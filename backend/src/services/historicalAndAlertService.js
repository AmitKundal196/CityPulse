const Event = require('../models/Event');
const FeedStatus = require('../models/FeedStatus');
const Alert = require('../models/Alert');
const ALERT_RULES = require('../config/alertRules');
const intelligenceService = require('./intelligenceService');

class HistoricalAndAlertService {
  /**
   * Fetches real historical observations from MongoDB Event collection.
   * Never fabricates missing values; explicitly reports insufficientData if count < 2.
   */
  async getHistoricalObservations(cityName, windowHours = 24) {
    const cutoff = new Date(Date.now() - windowHours * 60 * 60 * 1000);

    // Query real events only (isSynthetic: false)
    const events = await Event.find({
      city: cityName,
      isSynthetic: false,
      timestamp: { $gte: cutoff }
    })
      .sort({ timestamp: 1 })
      .lean();

    if (!events || events.length === 0) {
      return {
        city: cityName,
        windowHours,
        insufficientData: true,
        message: 'Insufficient historical data',
        count: 0,
        observations: []
      };
    }

    // Group events by discrete timestamp / observation cycle
    const timeMap = new Map();

    for (const ev of events) {
      const ts = new Date(ev.timestamp || ev.sourceTimestamp).toISOString();
      if (!timeMap.has(ts)) {
        timeMap.set(ts, {
          timestamp: ts,
          sourceTimestamp: ev.sourceTimestamp || ev.timestamp,
          city: cityName,
          aqi: null,
          pm2_5: null,
          pm10: null,
          temperature: null,
          humidity: null,
          windSpeed: null,
          rain: null,
          source: ev.source || 'Open-Meteo',
          status: ev.status || 'LIVE',
          isSynthetic: false
        });
      }

      const item = timeMap.get(ts);

      if (ev.eventType === 'us_aqi') {
        item.aqi = ev.value;
      } else if (ev.eventType === 'pm2_5') {
        item.pm2_5 = ev.value;
      } else if (ev.eventType === 'pm10') {
        item.pm10 = ev.value;
      } else if (ev.eventType === 'temperature') {
        item.temperature = ev.value;
      } else if (ev.eventType === 'humidity') {
        item.humidity = ev.value;
      } else if (ev.eventType === 'wind_speed') {
        item.windSpeed = ev.value;
      } else if (ev.eventType === 'rain') {
        item.rain = ev.value;
      }
    }

    const observations = Array.from(timeMap.values()).sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    const hasEnoughData = observations.length >= ALERT_RULES.trend.minObservationsRequired;

    return {
      city: cityName,
      windowHours,
      insufficientData: !hasEnoughData,
      message: hasEnoughData ? null : 'Insufficient historical data',
      count: observations.length,
      observations
    };
  }

  /**
   * Calculates deterministic trends from actual real observations.
   * Strictly non-predictive; explainable with start -> end values and delta.
   */
  async calculateTrends(cityName, windowHours = 6) {
    const historyResult = await this.getHistoricalObservations(cityName, windowHours);
    const observations = historyResult.observations.filter(o => o.aqi !== null);

    if (observations.length < ALERT_RULES.trend.minObservationsRequired) {
      return {
        city: cityName,
        trend: 'INSUFFICIENT_DATA',
        message: 'Not enough observations for trend analysis.',
        observationCount: observations.length,
        window: `Last ${windowHours} hours`
      };
    }

    const first = observations[0];
    const latest = observations[observations.length - 1];

    const aqiStart = first.aqi;
    const aqiEnd = latest.aqi;
    const deltaAqi = aqiEnd - aqiStart;

    let direction = 'STABLE';
    let statusText = 'Air quality is stable';

    if (deltaAqi > ALERT_RULES.trend.significantAqiDelta) {
      direction = 'INCREASING';
      statusText = 'Air quality is deteriorating';
    } else if (deltaAqi < -ALERT_RULES.trend.significantAqiDelta) {
      direction = 'DECREASING';
      statusText = 'Air quality is improving';
    }

    const deltaSign = deltaAqi > 0 ? `+${deltaAqi}` : `${deltaAqi}`;
    const description = direction === 'STABLE'
      ? `AQI remained approximately unchanged (${aqiStart} → ${aqiEnd}) over the available observation period.`
      : `AQI ${direction === 'INCREASING' ? 'increased' : 'decreased'} from ${aqiStart} to ${aqiEnd} (${deltaSign}) over the available observation period.`;

    // Calculate PM2.5 delta if available
    let pm25Trend = null;
    const validPm25 = observations.filter(o => o.pm2_5 !== null);
    if (validPm25.length >= 2) {
      const pmStart = validPm25[0].pm2_5;
      const pmEnd = validPm25[validPm25.length - 1].pm2_5;
      const deltaPm = Number((pmEnd - pmStart).toFixed(1));
      pm25Trend = {
        start: pmStart,
        end: pmEnd,
        delta: deltaPm,
        unit: 'µg/m³'
      };
    }

    return {
      city: cityName,
      trend: direction,
      statusText,
      description,
      currentAqi: aqiEnd,
      previousAqi: aqiStart,
      deltaAqi,
      observationCount: observations.length,
      startTime: first.timestamp,
      endTime: latest.timestamp,
      window: `Last ${windowHours} hours`,
      pm25Trend,
      source: 'Open-Meteo Air Quality',
      isSynthetic: false
    };
  }

  /**
   * Evaluates active alerts deterministically based on documented thresholds.
   * Implements duplicate alert prevention using a suppression window.
   */
  async evaluateAlertsForCity(cityName) {
    const feeds = await FeedStatus.find({ city: cityName }).lean();
    const aqiFeed = feeds.find(f => f.source === 'air_quality');
    const weatherFeed = feeds.find(f => f.source === 'weather');

    const candidateAlerts = [];

    // 1. AQI Threshold Alert
    if (aqiFeed && aqiFeed.status === 'LIVE') {
      const details = aqiFeed.details?.aqiData || aqiFeed.details?.openMeteoData || aqiFeed.details || {};
      const aqi = typeof details.aqi === 'number' ? details.aqi :
                  (typeof details.us_aqi === 'number' ? details.us_aqi : null);

      if (aqi !== null) {
        const matchingRule = ALERT_RULES.aqiThresholds.find(rule => aqi >= rule.minAqi);
        if (matchingRule) {
          const sourceTimestamp = aqiFeed.lastSourceTimestamp || new Date();
          candidateAlerts.push({
            city: cityName,
            type: 'AQI_THRESHOLD',
            severity: matchingRule.severity,
            title: `${cityName} — ${matchingRule.title}`,
            description: `${matchingRule.description} Current U.S. AQI is ${aqi} (${matchingRule.category}).`,
            value: aqi,
            unit: 'USAQI',
            timestamp: new Date(sourceTimestamp),
            sourceTimestamp: new Date(sourceTimestamp),
            source: 'Open-Meteo Air Quality',
            freshnessStatus: 'LIVE',
            isSynthetic: false,
            fingerprint: `${cityName}_AQI_THRESHOLD_${matchingRule.severity}`,
            evidence: {
              aqi,
              category: matchingRule.category,
              threshold: matchingRule.minAqi
            }
          });
        }
      }
    }

    // 2. Rapid AQI Change Alert
    const trend = await this.calculateTrends(cityName, 6);
    if (trend && trend.trend === 'INCREASING' && trend.deltaAqi >= ALERT_RULES.rapidChange.minDelta) {
      const isCritical = trend.deltaAqi >= ALERT_RULES.rapidChange.criticalDelta;
      candidateAlerts.push({
        city: cityName,
        type: 'RAPID_AQI_CHANGE',
        severity: isCritical ? ALERT_RULES.severities.CRITICAL : ALERT_RULES.severities.WARNING,
        title: `${cityName} — AQI Rapidly Increasing`,
        description: `AQI increased by ${trend.deltaAqi} points over the available observation window (${new Date(trend.startTime).toLocaleTimeString()} to ${new Date(trend.endTime).toLocaleTimeString()}).`,
        value: trend.deltaAqi,
        unit: 'points',
        timestamp: new Date(trend.endTime),
        sourceTimestamp: new Date(trend.endTime),
        source: 'Open-Meteo Air Quality',
        freshnessStatus: 'LIVE',
        isSynthetic: false,
        fingerprint: `${cityName}_RAPID_AQI_CHANGE`,
        evidence: {
          startAqi: trend.previousAqi,
          endAqi: trend.currentAqi,
          deltaAqi: trend.deltaAqi,
          startTime: trend.startTime,
          endTime: trend.endTime
        }
      });
    }

    // 3. PM2.5 Threshold Alert
    if (aqiFeed && aqiFeed.status === 'LIVE') {
      const details = aqiFeed.details?.aqiData || aqiFeed.details?.openMeteoData || aqiFeed.details || {};
      const pm2_5 = typeof details.pm2_5 === 'number' ? details.pm2_5 :
                    (typeof details.rawPM25 === 'number' ? details.rawPM25 : null);

      if (pm2_5 !== null) {
        const pmRule = ALERT_RULES.pm25Thresholds.find(rule => pm2_5 >= rule.minValue);
        if (pmRule) {
          const sourceTimestamp = aqiFeed.lastSourceTimestamp || new Date();
          candidateAlerts.push({
            city: cityName,
            type: 'PM25_THRESHOLD',
            severity: pmRule.severity,
            title: `${cityName} — ${pmRule.title}`,
            description: `${pmRule.description} Particulate matter PM2.5 measured at ${pm2_5} µg/m³.`,
            value: pm2_5,
            unit: 'µg/m³',
            timestamp: new Date(sourceTimestamp),
            sourceTimestamp: new Date(sourceTimestamp),
            source: 'Open-Meteo Air Quality',
            freshnessStatus: 'LIVE',
            isSynthetic: false,
            fingerprint: `${cityName}_PM25_THRESHOLD_${pmRule.severity}`,
            evidence: {
              pm2_5,
              threshold: pmRule.minValue
            }
          });
        }
      }
    }

    // 4. Weather Alert
    if (weatherFeed && weatherFeed.status === 'LIVE') {
      const details = weatherFeed.details?.weatherData || weatherFeed.details || {};
      const temperature = typeof details.temperature === 'number' ? details.temperature : null;
      const rain = typeof details.rain === 'number' ? details.rain : null;
      const windSpeed = typeof details.windSpeed === 'number' ? details.windSpeed : null;
      const sourceTimestamp = weatherFeed.lastSourceTimestamp || new Date();

      if (temperature !== null && temperature >= ALERT_RULES.weatherThresholds.highTemperature) {
        const isExtreme = temperature >= ALERT_RULES.weatherThresholds.extremeTemperature;
        candidateAlerts.push({
          city: cityName,
          type: 'WEATHER_ALERT',
          severity: isExtreme ? ALERT_RULES.severities.HIGH : ALERT_RULES.severities.WARNING,
          title: `${cityName} — ${isExtreme ? 'Severe Heat Wave' : 'High Temperature Alert'}`,
          description: `Ambient temperature recorded at ${temperature}°C, exceeding threshold of ${ALERT_RULES.weatherThresholds.highTemperature}°C.`,
          value: temperature,
          unit: '°C',
          timestamp: new Date(sourceTimestamp),
          sourceTimestamp: new Date(sourceTimestamp),
          source: 'Open-Meteo Weather',
          freshnessStatus: 'LIVE',
          isSynthetic: false,
          fingerprint: `${cityName}_WEATHER_HEAT`,
          evidence: { temperature, threshold: ALERT_RULES.weatherThresholds.highTemperature }
        });
      }

      if (rain !== null && rain >= ALERT_RULES.weatherThresholds.heavyRain) {
        candidateAlerts.push({
          city: cityName,
          type: 'WEATHER_ALERT',
          severity: ALERT_RULES.severities.HIGH,
          title: `${cityName} — Heavy Rainfall Alert`,
          description: `Active heavy precipitation recorded at ${rain} mm.`,
          value: rain,
          unit: 'mm',
          timestamp: new Date(sourceTimestamp),
          sourceTimestamp: new Date(sourceTimestamp),
          source: 'Open-Meteo Weather',
          freshnessStatus: 'LIVE',
          isSynthetic: false,
          fingerprint: `${cityName}_WEATHER_HEAVY_RAIN`,
          evidence: { rain, threshold: ALERT_RULES.weatherThresholds.heavyRain }
        });
      }

      if (windSpeed !== null && windSpeed >= ALERT_RULES.weatherThresholds.strongWind) {
        candidateAlerts.push({
          city: cityName,
          type: 'WEATHER_ALERT',
          severity: ALERT_RULES.severities.WARNING,
          title: `${cityName} — Strong Wind Alert`,
          description: `High wind velocities recorded at ${windSpeed} km/h.`,
          value: windSpeed,
          unit: 'km/h',
          timestamp: new Date(sourceTimestamp),
          sourceTimestamp: new Date(sourceTimestamp),
          source: 'Open-Meteo Weather',
          freshnessStatus: 'LIVE',
          isSynthetic: false,
          fingerprint: `${cityName}_WEATHER_STRONG_WIND`,
          evidence: { windSpeed, threshold: ALERT_RULES.weatherThresholds.strongWind }
        });
      }
    }

    // 5. Cross-Feed Alert (Poor Air Dispersion from Phase 4)
    const dispersion = intelligenceService.evaluateDispersion(cityName, aqiFeed, weatherFeed);
    if (dispersion) {
      candidateAlerts.push({
        city: cityName,
        type: 'CROSS_FEED_ALERT',
        severity: dispersion.severity === 'CRITICAL' ? ALERT_RULES.severities.CRITICAL :
                  dispersion.severity === 'HIGH' ? ALERT_RULES.severities.HIGH : ALERT_RULES.severities.WARNING,
        title: `${cityName} — Poor Air Dispersion Alert`,
        description: 'Elevated AQI is occurring alongside low wind speed. Conditions are consistent with reduced atmospheric dispersion. Observation only; not a causal claim.',
        value: dispersion.evidence.aqi,
        unit: 'USAQI',
        timestamp: dispersion.timestamp,
        sourceTimestamp: dispersion.sourceTimestamp,
        source: 'Open-Meteo Air Quality & Weather',
        freshnessStatus: 'LIVE',
        isSynthetic: false,
        fingerprint: `${cityName}_CROSS_FEED_DISPERSION`,
        evidence: dispersion.evidence
      });
    }

    // Duplicate Alert Prevention & Persistence
    const activeAlerts = await this.persistAlertsWithDeduplication(candidateAlerts);
    return activeAlerts;
  }

  /**
   * Persists alerts with duplicate suppression window.
   * If an active alert with identical fingerprint exists within dedupWindowMs,
   * updates lastTriggeredAt without creating a duplicate record.
   */
  async persistAlertsWithDeduplication(candidateAlerts) {
    const saved = [];
    const dedupCutoff = new Date(Date.now() - ALERT_RULES.dedupWindowMs);

    for (const candidate of candidateAlerts) {
      try {
        const existing = await Alert.findOne({
          city: candidate.city,
          fingerprint: candidate.fingerprint,
          status: 'ACTIVE',
          lastTriggeredAt: { $gte: dedupCutoff }
        });

        if (existing) {
          // Update lastTriggeredAt and value without duplicating
          existing.lastTriggeredAt = new Date();
          existing.value = candidate.value;
          existing.timestamp = candidate.timestamp;
          await existing.save();
          saved.push(existing);
        } else {
          // New alert trigger
          const created = await Alert.create({
            ...candidate,
            status: 'ACTIVE',
            firstTriggeredAt: new Date(),
            lastTriggeredAt: new Date()
          });
          saved.push(created);
        }
      } catch (err) {
        console.warn(`[HistoricalAndAlertService] Failed to persist alert: ${err.message}`);
      }
    }

    return saved;
  }

  /**
   * Retrieves currently active alerts
   */
  async getActiveAlerts(cityName = null) {
    const query = { status: 'ACTIVE' };
    if (cityName && cityName.toLowerCase() !== 'all') {
      query.city = cityName;
    }
    // Only alerts active within the last 2 hours
    const activeCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000);
    query.lastTriggeredAt = { $gte: activeCutoff };

    return await Alert.find(query).sort({ timestamp: -1 }).lean();
  }

  /**
   * Retrieves alert history (active + past)
   */
  async getAlertHistory(cityName = null, limit = 50) {
    const query = {};
    if (cityName && cityName.toLowerCase() !== 'all') {
      query.city = cityName;
    }
    return await Alert.find(query).sort({ timestamp: -1 }).limit(limit).lean();
  }
}

module.exports = new HistoricalAndAlertService();

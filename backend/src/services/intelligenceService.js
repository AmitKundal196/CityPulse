const Insight = require('../models/Insight');
const FeedStatus = require('../models/FeedStatus');
const Event = require('../models/Event');
const INTELLIGENCE_RULES = require('../config/intelligenceRules');
const CITIES = require('../config/cities');

class IntelligenceService {
  /**
   * Evaluates air quality data and produces deterministic insights
   */
  evaluateAirQuality(city, feed) {
    if (!feed || feed.status !== 'LIVE') return null;

    const details = feed.details || {};
    const aqiData = details.aqiData || details.openMeteoData || details;

    const aqi = typeof aqiData.aqi === 'number' ? aqiData.aqi :
                (typeof aqiData.us_aqi === 'number' ? aqiData.us_aqi : null);
    const pm2_5 = typeof aqiData.pm2_5 === 'number' ? aqiData.pm2_5 :
                  (typeof aqiData.rawPM25 === 'number' ? aqiData.rawPM25 : null);
    const pm10 = typeof aqiData.pm10 === 'number' ? aqiData.pm10 : null;

    if (aqi === null) return null;

    const sourceTimestamp = feed.lastSourceTimestamp || aqiData.timestamp || new Date();
    const rules = INTELLIGENCE_RULES.airQuality;

    let conditionCode = 'GOOD_AIR';
    let severity = INTELLIGENCE_RULES.severityLevels.LOW;
    let title = 'Good Air Quality';
    let description = 'Air quality is satisfactory and poses little or no risk.';

    if (aqi > rules.hazardousMin) {
      conditionCode = 'HAZARDOUS_AIR';
      severity = INTELLIGENCE_RULES.severityLevels.CRITICAL;
      title = 'Hazardous Air Quality';
      description = 'Emergency health conditions: General population is seriously affected by acute pollution levels.';
    } else if (aqi >= rules.veryUnhealthyMin) {
      conditionCode = 'VERY_UNHEALTHY_AIR';
      severity = INTELLIGENCE_RULES.severityLevels.CRITICAL;
      title = 'Very High AQI: Very Unhealthy Air Quality';
      description = 'Health alert: Risk of health effects is elevated across the entire population.';
    } else if (aqi >= rules.unhealthyMin) {
      conditionCode = 'UNHEALTHY_AIR';
      severity = INTELLIGENCE_RULES.severityLevels.HIGH;
      title = 'High AQI: Unhealthy Air Quality';
      description = 'Air quality is unhealthy for the general public. Sensitive individuals face heightened health risks.';
    } else if (aqi >= rules.elevatedMin) {
      conditionCode = 'UNHEALTHY_FOR_SENSITIVE_GROUPS';
      severity = INTELLIGENCE_RULES.severityLevels.MEDIUM;
      title = 'Elevated AQI: Unhealthy for Sensitive Groups';
      description = 'Members of sensitive groups may experience health effects. General public is less likely to be affected.';
    } else if (aqi > rules.goodMax) {
      conditionCode = 'MODERATE_AIR';
      severity = INTELLIGENCE_RULES.severityLevels.LOW;
      title = 'Moderate Air Quality';
      description = 'Air quality is acceptable; however, sensitive individuals may experience minor irritation.';
    }

    return {
      city,
      type: 'AIR_QUALITY',
      severity,
      title,
      description,
      timestamp: new Date(sourceTimestamp),
      sourceTimestamp: new Date(sourceTimestamp),
      generatedAt: new Date(),
      sources: ['Open-Meteo Air Quality'],
      evidence: {
        aqi,
        pm2_5,
        pm10,
        standard: 'U.S. AQI',
        conditionCode
      },
      confidence: INTELLIGENCE_RULES.confidenceLevels.HIGH,
      freshnessStatus: 'LIVE',
      isSynthetic: false,
      fingerprint: `${city}_AIR_QUALITY_${conditionCode}`
    };
  }

  /**
   * Evaluates weather data and produces deterministic insights
   */
  evaluateWeather(city, feed) {
    if (!feed || feed.status !== 'LIVE') return [];

    const details = feed.details || {};
    const weatherData = details.weatherData || details;

    const temperature = typeof weatherData.temperature === 'number' ? weatherData.temperature : null;
    const humidity = typeof weatherData.humidity === 'number' ? weatherData.humidity : null;
    const windSpeed = typeof weatherData.windSpeed === 'number' ? weatherData.windSpeed : null;
    const rain = typeof weatherData.rain === 'number' ? weatherData.rain : null;

    const sourceTimestamp = feed.lastSourceTimestamp || weatherData.timestamp || new Date();
    const rules = INTELLIGENCE_RULES.weather;
    const insights = [];

    // 1. High Temperature
    if (temperature !== null && temperature >= rules.highTemperature) {
      const isExtreme = temperature >= rules.extremeTemperature;
      insights.push({
        city,
        type: 'WEATHER',
        severity: isExtreme ? INTELLIGENCE_RULES.severityLevels.HIGH : INTELLIGENCE_RULES.severityLevels.MEDIUM,
        title: isExtreme ? 'Severe Extreme Heat Condition' : 'High Temperature Condition',
        description: `Ambient temperature has reached ${temperature}°C, exceeding the threshold of ${rules.highTemperature}°C.`,
        timestamp: new Date(sourceTimestamp),
        sourceTimestamp: new Date(sourceTimestamp),
        generatedAt: new Date(),
        sources: ['Open-Meteo Weather'],
        evidence: { temperature, unit: '°C', threshold: rules.highTemperature },
        confidence: INTELLIGENCE_RULES.confidenceLevels.HIGH,
        freshnessStatus: 'LIVE',
        isSynthetic: false,
        fingerprint: `${city}_WEATHER_HIGH_TEMPERATURE`
      });
    }

    // 2. Low Temperature
    if (temperature !== null && temperature <= rules.lowTemperature) {
      const isExtreme = temperature <= rules.extremeLowTemperature;
      insights.push({
        city,
        type: 'WEATHER',
        severity: isExtreme ? INTELLIGENCE_RULES.severityLevels.MEDIUM : INTELLIGENCE_RULES.severityLevels.LOW,
        title: isExtreme ? 'Severe Cold Wave Condition' : 'Low Temperature Condition',
        description: `Ambient temperature has dropped to ${temperature}°C, below the cold threshold of ${rules.lowTemperature}°C.`,
        timestamp: new Date(sourceTimestamp),
        sourceTimestamp: new Date(sourceTimestamp),
        generatedAt: new Date(),
        sources: ['Open-Meteo Weather'],
        evidence: { temperature, unit: '°C', threshold: rules.lowTemperature },
        confidence: INTELLIGENCE_RULES.confidenceLevels.HIGH,
        freshnessStatus: 'LIVE',
        isSynthetic: false,
        fingerprint: `${city}_WEATHER_LOW_TEMPERATURE`
      });
    }

    // 3. Heavy Rain
    if (rain !== null && rain >= rules.heavyRain) {
      const isTorrential = rain >= rules.torrentialRain;
      insights.push({
        city,
        type: 'WEATHER',
        severity: isTorrential ? INTELLIGENCE_RULES.severityLevels.CRITICAL : INTELLIGENCE_RULES.severityLevels.HIGH,
        title: isTorrential ? 'Torrential Rainfall Alert' : 'Heavy Rainfall Observation',
        description: `Significant precipitation rate of ${rain} mm observed during the current period.`,
        timestamp: new Date(sourceTimestamp),
        sourceTimestamp: new Date(sourceTimestamp),
        generatedAt: new Date(),
        sources: ['Open-Meteo Weather'],
        evidence: { rain, unit: 'mm', threshold: rules.heavyRain },
        confidence: INTELLIGENCE_RULES.confidenceLevels.HIGH,
        freshnessStatus: 'LIVE',
        isSynthetic: false,
        fingerprint: `${city}_WEATHER_HEAVY_RAIN`
      });
    }

    // 4. Strong Wind
    if (windSpeed !== null && windSpeed >= rules.strongWind) {
      const isGale = windSpeed >= rules.galeWind;
      insights.push({
        city,
        type: 'WEATHER',
        severity: isGale ? INTELLIGENCE_RULES.severityLevels.HIGH : INTELLIGENCE_RULES.severityLevels.MEDIUM,
        title: isGale ? 'High Gale Wind Warning' : 'Strong Wind Observation',
        description: `Wind speeds measured at ${windSpeed} km/h, exceeding the strong wind threshold of ${rules.strongWind} km/h.`,
        timestamp: new Date(sourceTimestamp),
        sourceTimestamp: new Date(sourceTimestamp),
        generatedAt: new Date(),
        sources: ['Open-Meteo Weather'],
        evidence: { windSpeed, unit: 'km/h', threshold: rules.strongWind },
        confidence: INTELLIGENCE_RULES.confidenceLevels.HIGH,
        freshnessStatus: 'LIVE',
        isSynthetic: false,
        fingerprint: `${city}_WEATHER_STRONG_WIND`
      });
    }

    // 5. High Humidity
    if (humidity !== null && humidity >= rules.highHumidity) {
      insights.push({
        city,
        type: 'WEATHER',
        severity: INTELLIGENCE_RULES.severityLevels.LOW,
        title: 'High Relative Humidity',
        description: `Relative humidity recorded at ${humidity}%, indicating saturated atmospheric moisture conditions.`,
        timestamp: new Date(sourceTimestamp),
        sourceTimestamp: new Date(sourceTimestamp),
        generatedAt: new Date(),
        sources: ['Open-Meteo Weather'],
        evidence: { humidity, unit: '%', threshold: rules.highHumidity },
        confidence: INTELLIGENCE_RULES.confidenceLevels.HIGH,
        freshnessStatus: 'LIVE',
        isSynthetic: false,
        fingerprint: `${city}_WEATHER_HIGH_HUMIDITY`
      });
    }

    return insights;
  }

  /**
   * Cross-feed: Air Quality + Weather dispersion conditions
   */
  evaluateDispersion(city, aqiFeed, weatherFeed) {
    if (!aqiFeed || aqiFeed.status !== 'LIVE' || !weatherFeed || weatherFeed.status !== 'LIVE') {
      return null;
    }

    const aqiDetails = aqiFeed.details?.aqiData || aqiFeed.details?.openMeteoData || aqiFeed.details || {};
    const weatherDetails = weatherFeed.details?.weatherData || weatherFeed.details || {};

    const aqi = typeof aqiDetails.aqi === 'number' ? aqiDetails.aqi :
                (typeof aqiDetails.us_aqi === 'number' ? aqiDetails.us_aqi : null);
    const pm2_5 = typeof aqiDetails.pm2_5 === 'number' ? aqiDetails.pm2_5 :
                  (typeof aqiDetails.rawPM25 === 'number' ? aqiDetails.rawPM25 : null);
    const windSpeed = typeof weatherDetails.windSpeed === 'number' ? weatherDetails.windSpeed : null;

    if (aqi === null || windSpeed === null) return null;

    const isElevatedAqi = aqi >= INTELLIGENCE_RULES.airQuality.elevatedMin;
    const isStagnantWind = windSpeed <= INTELLIGENCE_RULES.weather.stagnantWind;

    if (isElevatedAqi && isStagnantWind) {
      const severity = aqi >= INTELLIGENCE_RULES.airQuality.veryUnhealthyMin
        ? INTELLIGENCE_RULES.severityLevels.CRITICAL
        : aqi >= INTELLIGENCE_RULES.airQuality.unhealthyMin
        ? INTELLIGENCE_RULES.severityLevels.HIGH
        : INTELLIGENCE_RULES.severityLevels.MEDIUM;

      const sourceTimestamp = aqiFeed.lastSourceTimestamp || weatherFeed.lastSourceTimestamp || new Date();

      return {
        city,
        type: 'POOR_AIR_DISPERSION',
        severity,
        title: 'Poor Air Dispersion Conditions',
        description: 'Elevated AQI is occurring alongside low wind speed. Conditions are consistent with reduced atmospheric dispersion. This is an observational rule-based correlation, not a causal prediction.',
        timestamp: new Date(sourceTimestamp),
        sourceTimestamp: new Date(sourceTimestamp),
        generatedAt: new Date(),
        sources: ['Open-Meteo Air Quality', 'Open-Meteo Weather'],
        evidence: {
          aqi,
          pm2_5,
          windSpeed,
          windUnit: 'km/h',
          aqiThreshold: INTELLIGENCE_RULES.airQuality.elevatedMin,
          windThreshold: INTELLIGENCE_RULES.weather.stagnantWind
        },
        confidence: INTELLIGENCE_RULES.confidenceLevels.HIGH,
        freshnessStatus: 'LIVE',
        isSynthetic: false,
        fingerprint: `${city}_POOR_AIR_DISPERSION`
      };
    }

    return null;
  }

  /**
   * Cross-feed: Traffic + Air Quality temporal overlap
   */
  evaluateTrafficAqiOverlap(city, aqiFeed, trafficFeed, recentTrafficEvent) {
    if (!aqiFeed || aqiFeed.status !== 'LIVE' || !trafficFeed) {
      return null;
    }
    // Only proceed if traffic feed is active (LIVE or SIMULATED)
    if (trafficFeed.status === 'OFFLINE' || trafficFeed.status === 'NOT_CONFIGURED' || trafficFeed.status === 'STALE') {
      return null;
    }

    const aqiDetails = aqiFeed.details?.aqiData || aqiFeed.details?.openMeteoData || aqiFeed.details || {};
    const aqi = typeof aqiDetails.aqi === 'number' ? aqiDetails.aqi :
                (typeof aqiDetails.us_aqi === 'number' ? aqiDetails.us_aqi : null);

    if (aqi === null || aqi < INTELLIGENCE_RULES.airQuality.elevatedMin) {
      return null;
    }

    // Check if traffic indicates elevated congestion
    const trafficSeverity = recentTrafficEvent?.severity || trafficFeed.details?.severity;
    const isElevatedTraffic = INTELLIGENCE_RULES.traffic.elevatedCongestionSeverities.includes(trafficSeverity);

    if (isElevatedTraffic) {
      const isSynthetic = trafficFeed.isSynthetic === true || (recentTrafficEvent && recentTrafficEvent.isSynthetic === true);
      const severity = trafficSeverity === 'critical' || aqi >= INTELLIGENCE_RULES.airQuality.veryUnhealthyMin
        ? INTELLIGENCE_RULES.severityLevels.HIGH
        : INTELLIGENCE_RULES.severityLevels.MEDIUM;

      return {
        city,
        type: 'TRAFFIC_AIR_QUALITY_OVERLAP',
        severity,
        title: 'Traffic & Air Quality Overlap',
        description: 'Elevated traffic and elevated AQI are occurring during the same observation period. This is an observational temporal overlap, not a causal claim.',
        timestamp: new Date(),
        sourceTimestamp: aqiFeed.lastSourceTimestamp || new Date(),
        generatedAt: new Date(),
        sources: ['Open-Meteo Air Quality', isSynthetic ? 'Traffic Simulator' : 'Traffic Feed'],
        evidence: {
          aqi,
          trafficSeverity,
          zone: recentTrafficEvent?.zone || 'Metropolitan Area',
          overlapWindow: 'Current observation window'
        },
        confidence: isSynthetic ? INTELLIGENCE_RULES.confidenceLevels.MEDIUM : INTELLIGENCE_RULES.confidenceLevels.HIGH,
        freshnessStatus: aqiFeed.status,
        isSynthetic,
        fingerprint: `${city}_TRAFFIC_AIR_QUALITY_OVERLAP`
      };
    }

    return null;
  }

  /**
   * Cross-feed: Complaints + Environmental stress overlap
   */
  evaluateComplaintsEnvironmentalOverlap(city, aqiFeed, weatherFeed, complaintEvents = []) {
    if (!complaintEvents || complaintEvents.length < INTELLIGENCE_RULES.complaints.elevatedCountThreshold) {
      return null;
    }

    const aqiDetails = aqiFeed?.details?.aqiData || aqiFeed?.details || {};
    const aqi = typeof aqiDetails.aqi === 'number' ? aqiDetails.aqi : null;

    const weatherDetails = weatherFeed?.details?.weatherData || weatherFeed?.details || {};
    const rain = typeof weatherDetails.rain === 'number' ? weatherDetails.rain : null;

    const isElevatedAqi = aqi !== null && aqi >= INTELLIGENCE_RULES.airQuality.elevatedMin;
    const isHeavyRain = rain !== null && rain >= INTELLIGENCE_RULES.weather.heavyRain;

    if (isElevatedAqi || isHeavyRain) {
      const isSynthetic = complaintEvents.some(c => c.isSynthetic === true);
      const conditionType = isElevatedAqi && isHeavyRain ? 'elevated AQI and heavy rain' :
                            isElevatedAqi ? 'elevated AQI' : 'heavy precipitation';

      return {
        city,
        type: 'COMPLAINTS_ENVIRONMENTAL_OVERLAP',
        severity: INTELLIGENCE_RULES.severityLevels.MEDIUM,
        title: 'Civic Activity & Environmental Overlap',
        description: `Multiple citizen complaints (${complaintEvents.length}) were recorded during a concurrent period of ${conditionType}. Observed as simultaneous activity; causation is not inferred.`,
        timestamp: new Date(),
        sourceTimestamp: new Date(),
        generatedAt: new Date(),
        sources: [isSynthetic ? 'Complaint Simulator' : 'Citizen Reports', 'Open-Meteo'],
        evidence: {
          complaintsRecorded: complaintEvents.length,
          environmentalCondition: conditionType,
          aqi: aqi || 'N/A',
          rain: rain !== null ? `${rain} mm` : 'N/A'
        },
        confidence: INTELLIGENCE_RULES.confidenceLevels.MEDIUM,
        freshnessStatus: 'LIVE',
        isSynthetic,
        fingerprint: `${city}_COMPLAINTS_ENVIRONMENTAL_OVERLAP`
      };
    }

    return null;
  }

  /**
   * Saves candidates using deterministic deduplication suppression window
   */
  async persistWithDeduplication(candidateInsights) {
    const saved = [];
    const dedupCutoff = new Date(Date.now() - INTELLIGENCE_RULES.dedupWindowMs);

    for (const insight of candidateInsights) {
      if (!insight) continue;

      try {
        // Deduplication check: Has identical fingerprint been generated in dedupWindowMs?
        const existing = await Insight.findOne({
          city: insight.city,
          fingerprint: insight.fingerprint,
          createdAt: { $gte: dedupCutoff }
        }).sort({ createdAt: -1 });

        if (existing) {
          // Within suppression window: return existing insight without duplicating
          saved.push(existing);
        } else {
          // New insight: insert
          const created = await Insight.create(insight);
          saved.push(created);
        }
      } catch (err) {
        console.warn(`[IntelligenceService] Error persisting insight: ${err.message}`);
      }
    }

    return saved;
  }

  /**
   * Main analysis method for a city
   */
  async analyzeCity(cityName) {
    try {
      // 1. Fetch current feed statuses for this city
      const feeds = await FeedStatus.find({ city: cityName }).lean();
      const aqiFeed = feeds.find(f => f.source === 'air_quality');
      const weatherFeed = feeds.find(f => f.source === 'weather');
      const trafficFeed = feeds.find(f => f.source === 'traffic');
      const complaintFeed = feeds.find(f => f.source === 'complaint');

      // 2. Fetch recent traffic & complaint events for context (last 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const [recentTrafficEvent, recentComplaints] = await Promise.all([
        Event.findOne({ city: cityName, source: { $in: ['traffic', 'traffic_simulator'] }, timestamp: { $gte: oneHourAgo } }).sort({ timestamp: -1 }),
        Event.find({ city: cityName, source: { $in: ['complaint', 'citizen', 'demo', 'complaint_simulator'] }, timestamp: { $gte: oneHourAgo } }).limit(5)
      ]);

      const candidateInsights = [];

      // 3. Air Quality single-source insight
      const aqiInsight = this.evaluateAirQuality(cityName, aqiFeed);
      if (aqiInsight) candidateInsights.push(aqiInsight);

      // 4. Weather single-source insights
      const weatherInsights = this.evaluateWeather(cityName, weatherFeed);
      candidateInsights.push(...weatherInsights);

      // 5. Cross-feed: Poor Air Dispersion
      const dispersionInsight = this.evaluateDispersion(cityName, aqiFeed, weatherFeed);
      if (dispersionInsight) candidateInsights.push(dispersionInsight);

      // 6. Cross-feed: Traffic + AQI overlap
      const trafficOverlapInsight = this.evaluateTrafficAqiOverlap(cityName, aqiFeed, trafficFeed, recentTrafficEvent);
      if (trafficOverlapInsight) candidateInsights.push(trafficOverlapInsight);

      // 7. Cross-feed: Complaints + Environmental overlap
      const complaintsOverlapInsight = this.evaluateComplaintsEnvironmentalOverlap(cityName, aqiFeed, weatherFeed, recentComplaints);
      if (complaintsOverlapInsight) candidateInsights.push(complaintsOverlapInsight);

      // 8. Deduplicate and persist
      const finalInsights = await this.persistWithDeduplication(candidateInsights);
      return finalInsights;
    } catch (err) {
      console.error(`[IntelligenceService] Error analyzing ${cityName}: ${err.message}`);
      return [];
    }
  }

  /**
   * Retrieves latest insights for a specific city or all cities
   */
  async getInsights(cityName = null) {
    const query = {};
    if (cityName) {
      query.city = cityName;
    }

    // Return insights from the last 24 hours, sorted newest first
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    query.createdAt = { $gte: cutoff };

    const insights = await Insight.find(query).sort({ createdAt: -1 }).lean();
    return insights;
  }
}

module.exports = new IntelligenceService();

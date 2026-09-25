const env = require('../config/env');
const CITIES = require('../config/cities');
const Event = require('../models/Event');
const FeedStatus = require('../models/FeedStatus');
const { validateEvent } = require('../utils/validationHelper');
const { isDuplicateEvent } = require('../utils/deduplicationHelper');

const { fetchWeatherDataForCity } = require('./connectors/weatherConnector');
const { fetchOpenMeteoAirQualityDataForCity } = require('./connectors/openMeteoAirQualityConnector');
const { fetchTrafficDataForCity } = require('./connectors/trafficConnector');
const { syncComplaintFeedStatus } = require('./complaintService');
const { fetchTransitDataForCity } = require('./connectors/transitConnector');
const intelligenceService = require('./intelligenceService');
const historicalAndAlertService = require('./historicalAndAlertService');

class IngestionManager {
  constructor() {
    this.intervals = {};
    this.isPolling = {
      weather: false,
      airQuality: false,
      traffic: false,
      complaint: false,
      transit: false,
      intelligence: false
    };
  }

  async updateFeedStatus(
    city,
    source,
    status,
    isSynthetic = false,
    errorMsg = null,
    reasonCode = null,
    recordsReceived = 0,
    recordsAccepted = 0,
    recordsRejected = 0,
    sourceTimestamp = null,
    details = {}
  ) {
    try {
      const updateData = {
        city,
        source,
        status,
        isSynthetic,
        lastAttempt: new Date(),
        reasonCode: reasonCode || null,
        recordsReceived: recordsReceived || 0,
        recordsAccepted: recordsAccepted || 0,
        recordsRejected: recordsRejected || 0,
        details: details || {}
      };

      if (sourceTimestamp) {
        updateData.lastSourceTimestamp = new Date(sourceTimestamp);
      }

      if (status === 'LIVE' || status === 'SIMULATED' || status === 'STALE') {
        updateData.lastSuccessfulFetch = new Date();
        updateData.lastError = null;
        updateData.error = null;
      } else if (errorMsg) {
        updateData.lastError = errorMsg;
        updateData.error = errorMsg;
      }

      await FeedStatus.findOneAndUpdate({ city, source }, updateData, { upsert: true, new: true });
    } catch (err) {
      console.warn(`[IngestionManager] Failed to update FeedStatus for ${city}/${source}: ${err.message}`);
    }
  }

  async processEvents(events) {
    let recordsReceived = events.length;
    let recordsAccepted = 0;
    let recordsRejected = 0;

    for (const rawEvent of events) {
      const validation = validateEvent(rawEvent);
      if (!validation.valid) {
        recordsRejected++;
        console.warn(`[Validation Rejection][${rawEvent.city || 'Unknown'}][${rawEvent.source || 'Unknown'}] ${validation.reason} (code: ${validation.reasonCode || 'INVALID_DATA'})`);
        continue;
      }

      const duplicate = await isDuplicateEvent(rawEvent);
      if (duplicate) {
        continue;
      }

      try {
        await Event.create(rawEvent);
        recordsAccepted++;
      } catch (err) {
        recordsRejected++;
        console.warn(`[IngestionManager] Failed to insert event: ${err.message}`);
      }
    }

    return { recordsReceived, recordsAccepted, recordsRejected };
  }

  async pollWeather() {
    if (this.isPolling.weather) {
      console.log('[IngestionManager] Weather poll already in progress, skipping overlap.');
      return;
    }
    this.isPolling.weather = true;
    try {
      for (const cityObj of CITIES) {
        const cityName = cityObj.name;
        try {
        const result = await fetchWeatherDataForCity(cityObj);
        const events = result.events || [];
        const summary = result.summaryData || {};
        const reasonCode = result.reasonCode || null;

        const processResult = await this.processEvents(events);

        await this.updateFeedStatus(
          cityName,
          'weather',
          summary.status || 'LIVE',
          false,
          null,
          reasonCode,
          processResult.recordsReceived,
          processResult.recordsAccepted,
          processResult.recordsRejected,
          summary.sourceTimestamp,
          { weatherData: summary, ...summary }
        );

        console.log(
          `[Weather][${cityName}]\n  source=Open-Meteo\n  status=${summary.status || 'LIVE'}\n  sourceTimestamp=${summary.sourceTimestamp || 'N/A'}\n  recordsReceived=${processResult.recordsReceived}\n  recordsAccepted=${processResult.recordsAccepted}\n  recordsRejected=${processResult.recordsRejected}`
        );
      } catch (err) {
        const reasonCode = err.code || 'FETCH_ERROR';
        console.error(
          `[Weather][${cityName}]\n  source=Open-Meteo\n  status=OFFLINE\n  error=${err.message}\n  reasonCode=${reasonCode}`
        );
        const existing = await FeedStatus.findOne({ city: cityName, source: 'weather' }).lean();
        const preservedDetails = existing?.details ? { ...existing.details, error: err.message, status: 'OFFLINE', reasonCode } : { error: err.message, status: 'OFFLINE', reasonCode };
        await this.updateFeedStatus(
          cityName,
          'weather',
          'OFFLINE',
          false,
          err.message,
          reasonCode,
          0,
          0,
          0,
          existing?.lastSourceTimestamp || null,
          preservedDetails
        );
        }
      }
    } finally {
      this.isPolling.weather = false;
    }
  }

  async pollAirQuality() {
    if (this.isPolling.airQuality) {
      console.log('[IngestionManager] Air Quality poll already in progress, skipping overlap.');
      return;
    }
    this.isPolling.airQuality = true;
    try {
      for (const cityObj of CITIES) {
        const cityName = cityObj.name;
        try {
        const result = await fetchOpenMeteoAirQualityDataForCity(cityObj);
        const events = result.events || [];
        const summary = result.summaryData || {};
        const reasonCode = result.reasonCode || null;

        const processResult = await this.processEvents(events);

        await this.updateFeedStatus(
          cityName,
          'air_quality',
          summary.status || 'LIVE',
          false,
          null,
          reasonCode,
          processResult.recordsReceived,
          processResult.recordsAccepted,
          processResult.recordsRejected,
          summary.sourceTimestamp,
          {
            aqiData: summary,
            openMeteoData: summary,
            ...summary
          }
        );

        console.log(
          `[AirQuality][${cityName}]\n  source=Open-Meteo\n  status=${summary.status || 'LIVE'}\n  sourceTimestamp=${summary.sourceTimestamp || 'N/A'}\n  recordsReceived=${processResult.recordsReceived}\n  recordsAccepted=${processResult.recordsAccepted}\n  recordsRejected=${processResult.recordsRejected}`
        );
      } catch (err) {
        const reasonCode = err.code || 'FETCH_ERROR';
        console.error(
          `[AirQuality][${cityName}]\n  source=Open-Meteo\n  status=OFFLINE\n  error=${err.message}\n  reasonCode=${reasonCode}`
        );
        const existing = await FeedStatus.findOne({ city: cityName, source: 'air_quality' }).lean();
        const preservedDetails = existing?.details ? { ...existing.details, error: err.message, status: 'OFFLINE', reasonCode } : { error: err.message, status: 'OFFLINE', reasonCode };
        await this.updateFeedStatus(
          cityName,
          'air_quality',
          'OFFLINE',
          false,
          err.message,
          reasonCode,
          0,
          0,
          0,
          existing?.lastSourceTimestamp || null,
          preservedDetails
        );
      }
    }
    } finally {
      this.isPolling.airQuality = false;
    }
  }

  async pollTraffic() {
    if (this.isPolling.traffic) {
      console.log('[IngestionManager] Traffic poll already in progress, skipping overlap.');
      return;
    }
    this.isPolling.traffic = true;
    try {
      for (const cityObj of CITIES) {
        const cityName = cityObj.name;
        try {
          const result = await fetchTrafficDataForCity(cityObj);
          const events = result.events || [];
          const summary = result.summaryData || {};
          const reasonCode = result.reasonCode || null;

          const processResult = await this.processEvents(events);

          await this.updateFeedStatus(
            cityName,
            'traffic',
            summary.status || 'LIVE',
            false,
            null,
            reasonCode,
            processResult.recordsReceived,
            processResult.recordsAccepted,
            processResult.recordsRejected,
            summary.sourceTimestamp,
            { trafficData: summary, ...summary }
          );

          console.log(
            `[Traffic][${cityName}]\n  provider=${summary.provider || 'Mappls'}\n  status=${summary.status || 'LIVE'}\n  sourceTimestamp=${summary.sourceTimestamp || 'N/A'}\n  recordsReceived=${processResult.recordsReceived}\n  recordsAccepted=${processResult.recordsAccepted}\n  recordsRejected=${processResult.recordsRejected}`
          );
        } catch (err) {
          const isNotConfigured = err.code === 'NOT_CONFIGURED';
          const reasonCode = err.code || (isNotConfigured ? 'CONFIG_ERROR' : 'FETCH_ERROR');
          const status = isNotConfigured ? 'NOT_CONFIGURED' : 'OFFLINE';

          console.warn(
            `[Traffic][${cityName}]\n  status=${status}\n  reasonCode=${reasonCode}\n  message=${err.message}`
          );

          const existing = await FeedStatus.findOne({ city: cityName, source: 'traffic' }).lean();
          const preservedDetails = existing?.details
            ? { ...existing.details, error: err.message, status, reasonCode, provider: 'Mappls' }
            : { error: err.message, status, reasonCode, provider: 'Mappls' };

          await this.updateFeedStatus(
            cityName,
            'traffic',
            status,
            false,
            err.message,
            reasonCode,
            0,
            0,
            0,
            existing?.lastSourceTimestamp || null,
            preservedDetails
          );
        }
      }
    } finally {
      this.isPolling.traffic = false;
    }
  }

  async pollComplaints() {
    if (this.isPolling.complaint) return;
    this.isPolling.complaint = true;
    try {
      await syncComplaintFeedStatus();
    } catch (err) {
      console.warn(`[IngestionManager] Complaint sync error: ${err.message}`);
    } finally {
      this.isPolling.complaint = false;
    }
  }

  async pollTransit() {
    for (const cityObj of CITIES) {
      try {
        await fetchTransitDataForCity(cityObj);
        await this.updateFeedStatus(cityObj.name, 'transit', 'LIVE', false);
      } catch (err) {
        const status = err.code === 'NOT_CONFIGURED' ? 'NOT_CONFIGURED' : 'OFFLINE';
        await this.updateFeedStatus(cityObj.name, 'transit', status, false, err.message);
      }
    }
  }

  async runIntelligenceAnalysis() {
    if (this.isPolling.intelligence) return;
    this.isPolling.intelligence = true;
    try {
      for (const cityObj of CITIES) {
      try {
        const insights = await intelligenceService.analyzeCity(cityObj.name);
        if (insights && insights.length > 0) {
          console.log(`[Intelligence][${cityObj.name}] Generated/refreshed ${insights.length} insight(s)`);
        }
        const alerts = await historicalAndAlertService.evaluateAlertsForCity(cityObj.name);
        if (alerts && alerts.length > 0) {
          console.log(`[Alerts][${cityObj.name}] Evaluated ${alerts.length} active alert(s)`);
        }
      } catch (err) {
        console.warn(`[Intelligence/Alerts][${cityObj.name}] Analysis error: ${err.message}`);
        }
      }
    } finally {
      this.isPolling.intelligence = false;
    }
  }

  async start() {
    console.log(`[IngestionManager] Starting multi-city ingestion service for ${CITIES.length} cities (${CITIES.map(c => c.name).join(', ')})...`);

    // Initial poll cycle
    await Promise.allSettled([
      this.pollWeather(),
      this.pollAirQuality(),
      this.pollTraffic(),
      this.pollComplaints(),
      this.pollTransit()
    ]);

    // Initial intelligence analysis after feeds are populated
    await this.runIntelligenceAnalysis();

    // Setup periodic polling intervals
    this.intervals.weather = setInterval(async () => {
      await this.pollWeather();
      await this.runIntelligenceAnalysis();
    }, env.weatherIntervalMs);

    this.intervals.airQuality = setInterval(async () => {
      await this.pollAirQuality();
      await this.runIntelligenceAnalysis();
    }, env.airQualityIntervalMs);

    this.intervals.traffic = setInterval(() => this.pollTraffic(), env.trafficIntervalMs || 300000);
    this.intervals.complaint = setInterval(() => this.pollComplaints(), 60000);

    console.log(`[IngestionManager] Multi-city polling active. Weather/AQ/Traffic every ${env.weatherIntervalMs / 1000}s, Complaints sync every 60s.`);
  }

  async refreshNow() {
    console.log('[IngestionManager] Manual refresh triggered from client...');
    await Promise.allSettled([
      this.pollWeather(),
      this.pollAirQuality(),
      this.pollTraffic(),
      this.pollComplaints()
    ]);
    await this.runIntelligenceAnalysis();
    return { success: true, timestamp: new Date() };
  }

  stop() {
    Object.values(this.intervals).forEach(clearInterval);
    console.log('[IngestionManager] Stopped polling.');
  }
}

module.exports = new IngestionManager();

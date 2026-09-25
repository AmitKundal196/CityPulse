/**
 * Centralized Thresholds and Rules Configuration for Phase 4
 * Neighborhood Pulse Intelligence & Cross-Feed Analysis.
 *
 * All values are deterministic, explainable, and documented.
 */

const INTELLIGENCE_RULES = {
  // 1. Weather Thresholds
  weather: {
    highTemperature: 38.0, // °C - Extreme heat condition
    extremeTemperature: 42.0, // °C - Severe heat condition
    lowTemperature: 12.0,  // °C - Cold wave condition
    extremeLowTemperature: 6.0, // °C - Severe cold condition
    heavyRain: 5.0,        // mm - Active precipitation
    torrentialRain: 15.0,  // mm - High severity rain
    strongWind: 25.0,      // km/h - High wind speed
    galeWind: 45.0,        // km/h - Severe wind speed
    stagnantWind: 12.0,    // km/h - Stagnant air threshold for dispersion analysis (~3.3 m/s)
    highHumidity: 85.0     // % - Saturated humidity condition
  },

  // 2. Air Quality Thresholds (US AQI standard)
  airQuality: {
    goodMax: 50,
    moderateMax: 100,
    elevatedMin: 101,      // Unhealthy for Sensitive Groups+
    unhealthyMin: 151,     // Unhealthy+
    veryUnhealthyMin: 201, // Very Unhealthy+
    hazardousMin: 301      // Hazardous
  },

  // 3. Traffic Overlap Thresholds
  traffic: {
    elevatedCongestionSeverities: ['high', 'critical']
  },

  // 4. Complaints Overlap Thresholds
  complaints: {
    elevatedCountThreshold: 2
  },

  // 5. Severity Mapping
  severityLevels: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  },

  // 6. Confidence Levels (Data Support, NOT causal certainty)
  confidenceLevels: {
    HIGH: 'HIGH',     // Multiple fresh verified live sources support the observation
    MEDIUM: 'MEDIUM', // Single fresh source or multiple sources with partial freshness
    LOW: 'LOW'        // Limited or partially stale data
  },

  // 7. Deduplication Time Window (milliseconds)
  dedupWindowMs: 30 * 60 * 1000 // 30 minutes suppression window for identical condition
};

module.exports = INTELLIGENCE_RULES;

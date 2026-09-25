/**
 * Phase 5 — Alerts, Trends & Historical Event Analysis
 * Centralized Alert Rules & Thresholds Configuration
 *
 * Deterministic, explainable, and derived from documented environmental standards.
 */

const ALERT_RULES = {
  // 1. AQI Threshold Alerts (Based on official U.S. AQI categories)
  aqiThresholds: [
    {
      minAqi: 301,
      severity: 'CRITICAL',
      title: 'Hazardous Air Quality Emergency',
      category: 'Hazardous',
      description: 'Emergency health warning: The entire population is likely to experience severe health effects.'
    },
    {
      minAqi: 201,
      severity: 'CRITICAL',
      title: 'Very Unhealthy Air Quality Alert',
      category: 'Very Unhealthy',
      description: 'Health alert: Risk of health effects is heightened across all demographics.'
    },
    {
      minAqi: 151,
      severity: 'HIGH',
      title: 'High AQI: Unhealthy Air Quality',
      category: 'Unhealthy',
      description: 'Air quality is unhealthy for the general public. Sensitive individuals face serious irritation.'
    },
    {
      minAqi: 101,
      severity: 'WARNING',
      title: 'Elevated AQI Alert',
      category: 'Unhealthy for Sensitive Groups',
      description: 'Members of sensitive groups may experience health effects. General public less likely affected.'
    }
  ],

  // 2. Rapid AQI Change (Delta over available observation window)
  rapidChange: {
    minDelta: 25, // AQI increase of >= 25 points between start and end of available window
    criticalDelta: 50,
    severity: 'WARNING'
  },

  // 3. PM2.5 Threshold Alerts (µg/m³)
  pm25Thresholds: [
    {
      minValue: 150.5,
      severity: 'CRITICAL',
      title: 'Severe PM2.5 Particulate Concentration',
      description: 'Fine particulate matter (PM2.5) has crossed critical threshold (150.5+ µg/m³).'
    },
    {
      minValue: 55.5,
      severity: 'HIGH',
      title: 'High PM2.5 Particulate Alert',
      description: 'Fine particulate matter (PM2.5) has reached unhealthy levels exceeding 55.5 µg/m³.'
    },
    {
      minValue: 35.5,
      severity: 'WARNING',
      title: 'Elevated PM2.5 Observation',
      description: 'Fine particulate matter (PM2.5) exceeds the 35.5 µg/m³ baseline threshold.'
    }
  ],

  // 4. Weather-related Thresholds
  weatherThresholds: {
    highTemperature: 38.0, // °C
    extremeTemperature: 42.0, // °C
    heavyRain: 5.0, // mm
    torrentialRain: 15.0, // mm
    strongWind: 25.0, // km/h
    galeWind: 45.0 // km/h
  },

  // 5. Trend Calculations
  trend: {
    significantAqiDelta: 5, // Change of > 5 points indicates Increasing or Decreasing; <= 5 is Stable
    minObservationsRequired: 2 // Minimum real observations required
  },

  // 6. Alert Severities
  severities: {
    INFO: 'INFO',
    WARNING: 'WARNING',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  },

  // 7. Duplicate Alert Prevention Window
  dedupWindowMs: 45 * 60 * 1000 // 45 minutes suppression for identical active alert state
};

module.exports = ALERT_RULES;

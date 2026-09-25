const CITIES = require('../config/cities');

const VALID_CITY_NAMES = CITIES.map(c => c.name.toLowerCase());
const KNOWN_SOURCES = ['Open-Meteo', 'weather', 'air_quality', 'open-meteo', 'traffic', 'complaint', 'citizen', 'demo', 'transit'];

/**
 * Validates an incoming normalized event against strict Phase 3 criteria.
 *
 * @param {Object} event - Event candidate
 * @returns {{ valid: boolean, reason?: string, reasonCode?: string }}
 */
function validateEvent(event) {
  if (!event || typeof event !== 'object') {
    return { valid: false, reason: 'Event is not an object', reasonCode: 'INVALID_DATA' };
  }

  // 1. City Validation
  if (!event.city || typeof event.city !== 'string' || event.city.trim() === '') {
    return { valid: false, reason: 'Missing or empty city name', reasonCode: 'INVALID_DATA' };
  }
  if (!VALID_CITY_NAMES.includes(event.city.toLowerCase())) {
    return { valid: false, reason: `Unsupported city: ${event.city}`, reasonCode: 'INVALID_DATA' };
  }

  // 2. Source Validation
  if (!event.source || typeof event.source !== 'string' || event.source.trim() === '') {
    return { valid: false, reason: 'Missing or empty source', reasonCode: 'INVALID_DATA' };
  }
  if (!KNOWN_SOURCES.map(s => s.toLowerCase()).includes(event.source.toLowerCase())) {
    return { valid: false, reason: `Unknown source: ${event.source}`, reasonCode: 'INVALID_DATA' };
  }

  // 3. EventType Validation
  if (!event.eventType || typeof event.eventType !== 'string' || event.eventType.trim() === '') {
    return { valid: false, reason: 'Missing or empty eventType', reasonCode: 'INVALID_DATA' };
  }

  // 4. Synthetic Flag
  if (typeof event.isSynthetic !== 'boolean') {
    return { valid: false, reason: 'isSynthetic field must be a boolean', reasonCode: 'INVALID_DATA' };
  }

  // 5. Geographic Coordinates Validation
  if (
    typeof event.latitude !== 'number' ||
    isNaN(event.latitude) ||
    !isFinite(event.latitude) ||
    event.latitude < -90 ||
    event.latitude > 90
  ) {
    return { valid: false, reason: `Invalid latitude value: ${event.latitude}`, reasonCode: 'INVALID_DATA' };
  }

  if (
    typeof event.longitude !== 'number' ||
    isNaN(event.longitude) ||
    !isFinite(event.longitude) ||
    event.longitude < -180 ||
    event.longitude > 180
  ) {
    return { valid: false, reason: `Invalid longitude value: ${event.longitude}`, reasonCode: 'INVALID_DATA' };
  }

  // 6. Timestamp Validation
  if (!event.timestamp) {
    return { valid: false, reason: 'Missing timestamp', reasonCode: 'INVALID_DATA' };
  }
  const time = new Date(event.timestamp);
  if (isNaN(time.getTime())) {
    return { valid: false, reason: `Invalid timestamp value: ${event.timestamp}`, reasonCode: 'INVALID_DATA' };
  }

  // 7. Zone Assignment
  if (!event.zone || typeof event.zone !== 'string' || event.zone.trim() === '') {
    return { valid: false, reason: 'Missing or invalid zone assignment', reasonCode: 'INVALID_DATA' };
  }

  // 8. Numeric Value Integrity (no NaN, Infinity)
  if (event.value !== null && event.value !== undefined) {
    if (typeof event.value !== 'number' || isNaN(event.value) || !isFinite(event.value)) {
      return { valid: false, reason: `Invalid numeric value: ${event.value}`, reasonCode: 'INVALID_DATA' };
    }

    // Specific Domain Bounds Checking
    if (event.eventType === 'us_aqi' || event.eventType === 'us_aqi_pm2_5') {
      if (event.value < 0 || event.value > 500) {
        return { valid: false, reason: `AQI value out of valid range (0-500): ${event.value}`, reasonCode: 'INVALID_DATA' };
      }
    }

    if (event.eventType === 'pm2_5') {
      if (event.value < 0 || event.value > 1000) {
        return { valid: false, reason: `PM2.5 value out of expected range (0-1000 µg/m³): ${event.value}`, reasonCode: 'INVALID_DATA' };
      }
    }

    if (event.eventType === 'pm10') {
      if (event.value < 0 || event.value > 1500) {
        return { valid: false, reason: `PM10 value out of expected range (0-1500 µg/m³): ${event.value}`, reasonCode: 'INVALID_DATA' };
      }
    }

    if (event.eventType === 'humidity') {
      if (event.value < 0 || event.value > 100) {
        return { valid: false, reason: `Humidity value out of expected range (0-100%): ${event.value}`, reasonCode: 'INVALID_DATA' };
      }
    }
  }

  return { valid: true };
}

module.exports = { validateEvent };


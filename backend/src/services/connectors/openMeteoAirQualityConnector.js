const env = require('../../config/env');
const { getZone } = require('../../utils/zoneHelper');
const { getUsAqiCategory } = require('../../utils/aqiCalculator');

/**
 * Open-Meteo Air Quality Connector
 * Endpoint: https://air-quality-api.open-meteo.com/v1/air-quality
 * Official Docs: https://open-meteo.com/en/docs/air-quality-api
 */
async function fetchOpenMeteoAirQualityDataForCity(cityObj) {
  const lat = cityObj.latitude;
  const lon = cityObj.longitude;
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,us_aqi_pm2_5,pm2_5,pm10,nitrogen_dioxide,ozone&hourly=pm2_5,us_aqi&timezone=auto`;

  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch (err) {
    // Retry once after 1s on transient socket drop / network reconnection
    try {
      await new Promise(r => setTimeout(r, 1000));
      response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    } catch (retryErr) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        const error = new Error(`Open-Meteo Air Quality request timed out for ${cityObj.name}`);
        error.code = 'TIMEOUT';
        throw error;
      }
      const error = new Error(`Open-Meteo Air Quality network fetch error for ${cityObj.name}: ${err.message}`);
      error.code = 'FETCH_ERROR';
      throw error;
    }
  }

  if (!response.ok) {
    if (response.status === 429) {
      const error = new Error(`Open-Meteo Air Quality rate limit reached (HTTP 429) for ${cityObj.name}`);
      error.code = 'RATE_LIMITED';
      throw error;
    }
    const isServerUnavailable = response.status >= 500;
    const error = new Error(`Open-Meteo Air Quality HTTP ${response.status} ${response.statusText} for ${cityObj.name}`);
    error.code = isServerUnavailable ? 'SOURCE_UNAVAILABLE' : 'FETCH_ERROR';
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    const error = new Error(`Malformed non-JSON response from Open-Meteo Air Quality for ${cityObj.name}`);
    error.code = 'INVALID_RESPONSE';
    throw error;
  }

  if (!data || typeof data !== 'object' || !data.current || typeof data.current !== 'object') {
    const error = new Error(`Malformed Open-Meteo response for ${cityObj.name}: missing 'current' object`);
    error.code = 'INVALID_RESPONSE';
    throw error;
  }

  const current = data.current;

  // Defensive validation of required primary values
  if (current.us_aqi === undefined && current.us_aqi_pm2_5 === undefined) {
    const error = new Error(`Open-Meteo response for ${cityObj.name} missing both 'us_aqi' and 'us_aqi_pm2_5'`);
    error.code = 'INVALID_DATA';
    throw error;
  }

  const rawPM25 = typeof current.pm2_5 === 'number' && !isNaN(current.pm2_5) && isFinite(current.pm2_5) ? current.pm2_5 : null;
  const usAqi = typeof current.us_aqi === 'number' && !isNaN(current.us_aqi) && isFinite(current.us_aqi) ? current.us_aqi : null;
  const usAqiPm25 = typeof current.us_aqi_pm2_5 === 'number' && !isNaN(current.us_aqi_pm2_5) && isFinite(current.us_aqi_pm2_5) ? current.us_aqi_pm2_5 : null;
  const pm10 = typeof current.pm10 === 'number' && !isNaN(current.pm10) && isFinite(current.pm10) ? current.pm10 : null;
  const nitrogenDioxide = typeof current.nitrogen_dioxide === 'number' && !isNaN(current.nitrogen_dioxide) && isFinite(current.nitrogen_dioxide) ? current.nitrogen_dioxide : null;
  const ozone = typeof current.ozone === 'number' && !isNaN(current.ozone) && isFinite(current.ozone) ? current.ozone : null;

  // Timestamp extraction and timezone alignment
  const utcOffsetSeconds = typeof data.utc_offset_seconds === 'number' ? data.utc_offset_seconds : 0;
  let sourceTimestamp;
  if (current.time) {
    if (current.time.includes('Z')) {
      sourceTimestamp = new Date(current.time).toISOString();
    } else {
      const utcMs = Date.parse(`${current.time}:00.000Z`) - (utcOffsetSeconds * 1000);
      sourceTimestamp = new Date(utcMs).toISOString();
    }
  } else {
    const error = new Error(`Open-Meteo response for ${cityObj.name} missing measurement timestamp`);
    error.code = 'INVALID_DATA';
    throw error;
  }

  const ingestedAt = new Date().toISOString();
  const now = new Date();
  const measDate = new Date(sourceTimestamp);
  const ageHours = (now - measDate) / (1000 * 60 * 60);
  const freshnessThreshold = env.aqiFreshnessHours || 6;
  const isFresh = ageHours >= -1 && ageHours <= freshnessThreshold;
  const status = isFresh ? 'LIVE' : 'STALE';
  const reasonCode = isFresh ? null : 'STALE_DATA';

  // Primary AQI value
  const aqi = usAqi !== null ? usAqi : usAqiPm25;
  const categoryInfo = getUsAqiCategory(aqi);
  const zone = getZone(lat, lon, cityObj);

  // Normalized Air Quality Object matching Phase 3 schema
  const summaryData = {
    city: cityObj.name,
    source: 'Open-Meteo',
    feed: 'air_quality',
    provider: 'Open-Meteo',

    aqi,
    aqiCategory: categoryInfo.category,

    rawPM25,
    pm2_5: rawPM25,
    pm10,
    us_aqi: usAqi,
    us_aqi_pm2_5: usAqiPm25,
    usAqi,
    usAqiPm25,

    unit: 'µg/m³',

    timestamp: sourceTimestamp,
    sourceTimestamp,
    ingestedAt,

    latitude: lat,
    longitude: lon,

    isSynthetic: false,
    status,
    reasonCode,

    nitrogenDioxide,
    ozone,
    ageHours,
    methodology: 'U.S. AQI · Open-Meteo'
  };

  const events = [];

  // 1. Primary U.S. AQI Event
  if (usAqi !== null) {
    const severity = categoryInfo.category === 'Hazardous' ? 'critical' : categoryInfo.category.includes('Unhealthy') ? 'high' : 'low';
    events.push({
      city: cityObj.name,
      source: 'Open-Meteo',
      eventType: 'us_aqi',
      timestamp: sourceTimestamp,
      sourceTimestamp,
      ingestedAt,
      latitude: lat,
      longitude: lon,
      zone,
      severity,
      value: usAqi,
      unit: 'USAQI',
      status,
      metadata: {
        ...summaryData,
        eventType: 'us_aqi'
      },
      isSynthetic: false
    });
  }

  // 2. PM2.5 Event
  if (rawPM25 !== null) {
    const severity = categoryInfo.category === 'Hazardous' ? 'critical' : categoryInfo.category.includes('Unhealthy') ? 'high' : 'low';
    events.push({
      city: cityObj.name,
      source: 'Open-Meteo',
      eventType: 'pm2_5',
      timestamp: sourceTimestamp,
      sourceTimestamp,
      ingestedAt,
      latitude: lat,
      longitude: lon,
      zone,
      severity,
      value: rawPM25,
      unit: 'µg/m³',
      status,
      metadata: {
        ...summaryData,
        eventType: 'pm2_5'
      },
      isSynthetic: false
    });
  }

  // 3. PM10 Event
  if (pm10 !== null) {
    events.push({
      city: cityObj.name,
      source: 'Open-Meteo',
      eventType: 'pm10',
      timestamp: sourceTimestamp,
      sourceTimestamp,
      ingestedAt,
      latitude: lat,
      longitude: lon,
      zone,
      severity: 'info',
      value: pm10,
      unit: 'µg/m³',
      status,
      metadata: { ...summaryData, eventType: 'pm10' },
      isSynthetic: false
    });
  }

  // 4. US AQI (PM2.5 specific) Event
  if (usAqiPm25 !== null) {
    events.push({
      city: cityObj.name,
      source: 'Open-Meteo',
      eventType: 'us_aqi_pm2_5',
      timestamp: sourceTimestamp,
      sourceTimestamp,
      ingestedAt,
      latitude: lat,
      longitude: lon,
      zone,
      severity: 'info',
      value: usAqiPm25,
      unit: 'USAQI',
      status,
      metadata: { ...summaryData, eventType: 'us_aqi_pm2_5' },
      isSynthetic: false
    });
  }

  return { events, summaryData, reasonCode };
}

module.exports = { fetchOpenMeteoAirQualityDataForCity };



const { getZone } = require('../../utils/zoneHelper');

/**
 * Weather connector fetching current forecast data from Open-Meteo API
 * for a specific city configuration object.
 */
async function fetchWeatherDataForCity(cityObj) {
  const lat = cityObj.latitude;
  const lon = cityObj.longitude;
  const primaryUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m`;
  const ensembleUrl = `https://ensemble-api.open-meteo.com/v1/ensemble?latitude=${lat}&longitude=${lon}&models=gfs_seamless&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m`;

  let response;
  try {
    response = await fetch(primaryUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok && response.status === 429) {
      console.warn(`[Weather][${cityObj.name}] Open-Meteo forecast API 429 rate-limited, switching to Open-Meteo ensemble endpoint...`);
      response = await fetch(ensembleUrl, { signal: AbortSignal.timeout(10000) });
    }
  } catch (err) {
    try {
      response = await fetch(ensembleUrl, { signal: AbortSignal.timeout(10000) });
    } catch (fallbackErr) {
      try {
        await new Promise(r => setTimeout(r, 1000));
        response = await fetch(ensembleUrl, { signal: AbortSignal.timeout(10000) });
      } catch (retryErr) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
          const error = new Error(`Open-Meteo Weather request timed out for ${cityObj.name}`);
          error.code = 'TIMEOUT';
          throw error;
        }
        const error = new Error(`Open-Meteo Weather network fetch error for ${cityObj.name}: ${err.message}`);
        error.code = 'FETCH_ERROR';
        throw error;
      }
    }
  }

  if (!response.ok) {
    if (response.status === 429) {
      const error = new Error(`Open-Meteo Weather rate limit reached (HTTP 429) for ${cityObj.name}`);
      error.code = 'RATE_LIMITED';
      throw error;
    }
    const isServerUnavailable = response.status >= 500;
    const error = new Error(`Open-Meteo Weather API HTTP ${response.status} ${response.statusText} for ${cityObj.name}`);
    error.code = isServerUnavailable ? 'SOURCE_UNAVAILABLE' : 'FETCH_ERROR';
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    const error = new Error(`Malformed non-JSON response from Open-Meteo Weather for ${cityObj.name}`);
    error.code = 'INVALID_RESPONSE';
    throw error;
  }

  if (!data || typeof data !== 'object' || !data.current || typeof data.current !== 'object') {
    const error = new Error(`Malformed Open-Meteo response for ${cityObj.name}: missing 'current' object`);
    error.code = 'INVALID_RESPONSE';
    throw error;
  }

  const current = data.current;
  const sourceTimestamp = current.time ? new Date(current.time).toISOString() : new Date().toISOString();
  const ingestedAt = new Date().toISOString();

  // Freshness check (weather considered fresh within 6 hours)
  const now = new Date();
  const measDate = new Date(sourceTimestamp);
  const ageHours = (now - measDate) / (1000 * 60 * 60);
  const isFresh = ageHours >= -1 && ageHours <= 6;
  const status = isFresh ? 'LIVE' : 'STALE';
  const reasonCode = isFresh ? null : 'STALE_DATA';

  const zone = getZone(lat, lon, cityObj);
  const events = [];

  // Temperature
  if (typeof current.temperature_2m === 'number' && !isNaN(current.temperature_2m) && isFinite(current.temperature_2m)) {
    events.push({
      city: cityObj.name,
      source: 'Open-Meteo',
      eventType: 'temperature',
      timestamp: sourceTimestamp,
      sourceTimestamp,
      ingestedAt,
      latitude: lat,
      longitude: lon,
      zone,
      severity: null,
      value: current.temperature_2m,
      unit: '°C',
      status,
      metadata: { weatherCode: current.weather_code, source: 'Open-Meteo' },
      isSynthetic: false
    });
  }

  // Rain
  if (typeof current.rain === 'number' && !isNaN(current.rain) && isFinite(current.rain)) {
    events.push({
      city: cityObj.name,
      source: 'Open-Meteo',
      eventType: 'rain',
      timestamp: sourceTimestamp,
      sourceTimestamp,
      ingestedAt,
      latitude: lat,
      longitude: lon,
      zone,
      severity: current.rain > 10 ? 'high' : current.rain > 2 ? 'medium' : 'low',
      value: current.rain,
      unit: 'mm',
      status,
      metadata: { precipitation: current.precipitation, source: 'Open-Meteo' },
      isSynthetic: false
    });
  }

  // Wind speed
  if (typeof current.wind_speed_10m === 'number' && !isNaN(current.wind_speed_10m) && isFinite(current.wind_speed_10m)) {
    events.push({
      city: cityObj.name,
      source: 'Open-Meteo',
      eventType: 'wind_speed',
      timestamp: sourceTimestamp,
      sourceTimestamp,
      ingestedAt,
      latitude: lat,
      longitude: lon,
      zone,
      severity: current.wind_speed_10m > 40 ? 'high' : 'low',
      value: current.wind_speed_10m,
      unit: 'km/h',
      status,
      metadata: { source: 'Open-Meteo' },
      isSynthetic: false
    });
  }

  // Humidity
  if (typeof current.relative_humidity_2m === 'number' && !isNaN(current.relative_humidity_2m) && isFinite(current.relative_humidity_2m)) {
    events.push({
      city: cityObj.name,
      source: 'Open-Meteo',
      eventType: 'humidity',
      timestamp: sourceTimestamp,
      sourceTimestamp,
      ingestedAt,
      latitude: lat,
      longitude: lon,
      zone,
      severity: null,
      value: current.relative_humidity_2m,
      unit: '%',
      status,
      metadata: { source: 'Open-Meteo' },
      isSynthetic: false
    });
  }

  const summaryData = {
    city: cityObj.name,
    source: 'Open-Meteo',
    feed: 'weather',
    temperature: current.temperature_2m,
    humidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    rain: current.rain,
    weatherCode: current.weather_code,
    timestamp: sourceTimestamp,
    sourceTimestamp,
    ingestedAt,
    status,
    reasonCode,
    isSynthetic: false
  };

  return { events, summaryData, reasonCode };
}

module.exports = { fetchWeatherDataForCity };


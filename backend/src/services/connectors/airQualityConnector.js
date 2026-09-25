const env = require('../../config/env');
const { getZone } = require('../../utils/zoneHelper');
const { calculatePM25AQI } = require('../../utils/aqiCalculator');

/**
 * OpenAQ API v3 Connector & Candidate Selection Engine
 * Uses CPCB (Indian National AQI) methodology for PM2.5.
 * Official Docs: https://docs.openaq.org/
 */
async function fetchAirQualityDataForCity(cityObj) {
  const apiKey = env.openaqApiKey ? env.openaqApiKey.trim() : '';
  const apiKeyPresent = Boolean(apiKey);

  const freshnessThresholdHours = env.aqiFreshnessHours || 24;

  const diag = {
    city: cityObj.name,
    apiKeyPresent,
    httpStatus: null,
    reason: null,
    locationsFound: 0,
    nearestLocation: null,
    sensorsFound: 0,
    latestMeasurementAvailable: false,
    aqiData: null
  };

  // 1. Check API Key presence
  if (!apiKeyPresent) {
    diag.reason = 'CONFIG_ERROR';
    const error = new Error(`OPENAQ_API_KEY is not configured in environment variables.`);
    error.code = 'NOT_CONFIGURED';
    error.diagnostic = diag;
    throw error;
  }

  // 2. Query Locations endpoint with radius=25000 & coordinates
  const lat = cityObj.latitude;
  const lon = cityObj.longitude;
  const radiusMeters = 25000;
  const baseUrl = 'https://api.openaq.org/v3';
  const locationsUrl = `${baseUrl}/locations?coordinates=${lat},${lon}&radius=${radiusMeters}&limit=100`;

  const headers = {
    'X-API-Key': apiKey
  };

  let locationsRes;
  try {
    locationsRes = await fetch(locationsUrl, { headers });
    diag.httpStatus = locationsRes.status;
  } catch (err) {
    diag.reason = 'API_ERROR';
    const error = new Error(`OpenAQ network failure for ${cityObj.name}: ${err.message}`);
    error.code = 'OFFLINE';
    error.diagnostic = diag;
    throw error;
  }

  if (locationsRes.status === 401 || locationsRes.status === 403) {
    diag.reason = 'API_UNAUTHORIZED';
    const error = new Error(`Unauthorized OpenAQ API Key (HTTP ${locationsRes.status})`);
    error.code = 'NOT_CONFIGURED';
    error.diagnostic = diag;
    throw error;
  }

  if (locationsRes.status === 429) {
    diag.reason = 'API_RATE_LIMITED';
    const error = new Error(`OpenAQ API rate limit exceeded (HTTP 429)`);
    error.code = 'OFFLINE';
    error.diagnostic = diag;
    throw error;
  }

  if (!locationsRes.ok) {
    diag.reason = 'API_ERROR';
    const error = new Error(`OpenAQ API HTTP ${locationsRes.status} ${locationsRes.statusText}`);
    error.code = 'OFFLINE';
    error.diagnostic = diag;
    throw error;
  }

  const locationsData = await locationsRes.json();
  const locations = locationsData.results || [];
  diag.locationsFound = locations.length;

  if (locations.length === 0) {
    diag.reason = 'NO_LOCATIONS_FOUND';
    const error = new Error(`No OpenAQ measurement locations found within 25km of ${cityObj.name}`);
    error.code = 'NOT_CONFIGURED';
    error.diagnostic = diag;
    throw error;
  }

  // 3. Inspect candidate locations for the newest valid PM2.5 measurement
  let bestCandidate = null;

  for (const candidateLoc of locations.slice(0, 20)) {
    try {
      const latestUrl = `${baseUrl}/locations/${candidateLoc.id}/latest`;
      const lRes = await fetch(latestUrl, { headers });
      if (!lRes.ok) continue;

      const lData = await lRes.json();
      const measurements = lData.results || [];

      for (const m of measurements) {
        if (!m || typeof m.value !== 'number') continue;
        const paramName = (m.parameter?.name || m.parameter || '').toLowerCase();
        const isPm25 = paramName === 'pm25' || paramName === 'pm2.5';

        const rawTimeStr = m.datetime ? (m.datetime.utc || m.datetime) : null;
        const mDate = rawTimeStr ? new Date(rawTimeStr) : null;

        if (isPm25 && mDate && !isNaN(mDate.getTime())) {
          if (!bestCandidate || mDate > bestCandidate.date) {
            bestCandidate = {
              location: candidateLoc,
              measurement: m,
              date: mDate,
              timeIso: mDate.toISOString(),
              rawPM25: m.value,
              allMeasurements: measurements
            };
          }
        }
      }
    } catch (e) {
      // Continue searching remaining candidates
    }
  }

  // Fallback: If no candidate location returned a PM2.5 measurement, use the first location's latest response
  if (!bestCandidate) {
    const firstLoc = locations[0];
    try {
      const lRes = await fetch(`${baseUrl}/locations/${firstLoc.id}/latest`, { headers });
      if (lRes.ok) {
        const lData = await lRes.json();
        const measurements = lData.results || [];
        if (measurements.length > 0) {
          const firstM = measurements[0];
          const rawTimeStr = firstM.datetime ? (firstM.datetime.utc || firstM.datetime) : new Date().toISOString();
          const mDate = new Date(rawTimeStr);
          bestCandidate = {
            location: firstLoc,
            measurement: firstM,
            date: mDate,
            timeIso: mDate.toISOString(),
            rawPM25: typeof firstM.value === 'number' ? firstM.value : null,
            allMeasurements: measurements
          };
        }
      }
    } catch (e) {}
  }

  if (!bestCandidate) {
    diag.reason = 'NO_RECENT_MEASUREMENTS';
    const error = new Error(`No usable measurements found for candidate stations in ${cityObj.name}`);
    error.code = 'OFFLINE';
    error.diagnostic = diag;
    throw error;
  }

  const selectedLoc = bestCandidate.location;
  diag.nearestLocation = {
    id: selectedLoc.id,
    name: selectedLoc.name,
    distance: selectedLoc.distance || null,
    coordinates: selectedLoc.coordinates || null
  };
  diag.sensorsFound = selectedLoc.sensors ? selectedLoc.sensors.length : 0;
  diag.latestMeasurementAvailable = true;

  // 4. Compute CPCB AQI & Freshness Status
  const rawPM25 = bestCandidate.rawPM25;
  const aqiResult = calculatePM25AQI(rawPM25);
  const now = new Date();
  const ageMs = now - bestCandidate.date;
  const ageMinutes = Math.max(0, Math.floor(ageMs / (1000 * 60)));
  const ageHours = ageMs / (1000 * 60 * 60);

  const status = ageHours <= freshnessThresholdHours ? 'LIVE' : 'STALE';
  diag.reason = 'SUCCESS';

  diag.aqiData = {
    city: cityObj.name,
    rawPM25,
    aqi: aqiResult.aqi,
    aqiCategory: aqiResult.aqiCategory,
    measurementTimestamp: bestCandidate.timeIso,
    ageMinutes,
    status,
    station: selectedLoc.name,
    isSynthetic: false
  };

  // 5. Build normalized Event objects preserving actual OpenAQ measurements
  const events = [];
  const eventLat = selectedLoc.coordinates?.latitude || lat;
  const eventLon = selectedLoc.coordinates?.longitude || lon;
  const zone = getZone(eventLat, eventLon, cityObj);

  for (const m of bestCandidate.allMeasurements) {
    if (m && typeof m.value === 'number') {
      const paramName = m.parameter?.name ? m.parameter.name.toLowerCase() : (m.parameter || 'unknown');
      const isPm25 = paramName === 'pm25' || paramName === 'pm2.5';
      const mRawVal = m.value;
      const mAqiRes = isPm25 ? aqiResult : calculatePM25AQI(mRawVal);
      const mTimestamp = m.datetime ? new Date(m.datetime.utc || m.datetime).toISOString() : bestCandidate.timeIso;

      events.push({
        city: cityObj.name,
        source: 'air_quality',
        eventType: paramName,
        timestamp: mTimestamp,
        latitude: m.coordinates?.latitude || eventLat,
        longitude: m.coordinates?.longitude || eventLon,
        zone,
        severity: mAqiRes.aqi > 300 ? 'critical' : mAqiRes.aqi > 200 ? 'high' : mAqiRes.aqi > 100 ? 'medium' : 'low',
        value: mRawVal,
        unit: m.parameter?.units || m.unit || 'µg/m³',
        metadata: {
          rawPM25: mRawVal,
          aqi: mAqiRes.aqi,
          aqiCategory: mAqiRes.aqiCategory,
          status,
          ageMinutes,
          locationsId: m.locationsId || selectedLoc.id,
          sensorsId: m.sensorsId || null,
          locationName: selectedLoc.name,
          methodology: 'Based on PM2.5 · CPCB/India AQI'
        },
        isSynthetic: false
      });
    }
  }

  return { events, diagnostic: diag };
}

module.exports = { fetchAirQualityDataForCity };

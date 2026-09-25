const env = require('../../config/env');
const { getZone } = require('../../utils/zoneHelper');

// Cache token in-memory to prevent redundant token exchanges
let cachedMapplsToken = null;
let tokenExpiresAt = 0;

/**
 * Exchanges Mappls Client Credentials for OAuth Bearer token.
 */
async function getMapplsToken() {
  if (cachedMapplsToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedMapplsToken;
  }

  const clientId = env.mapplsClientId;
  const clientSecret = env.mapplsClientSecret;

  if (!clientId || !clientSecret) {
    return null;
  }

  const tokenUrl = 'https://outpost.mappls.com/api/security/oauth/token';
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  });

  try {
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      const err = new Error(`Mappls OAuth token failed (HTTP ${res.status}): ${errBody}`);
      err.code = res.status === 401 || res.status === 403 ? 'CONFIG_ERROR' : 'FETCH_ERROR';
      throw err;
    }

    const data = await res.json();
    if (!data.access_token) {
      const err = new Error('Mappls OAuth response missing access_token');
      err.code = 'INVALID_RESPONSE';
      throw err;
    }

    cachedMapplsToken = data.access_token;
    tokenExpiresAt = Date.now() + ((data.expires_in || 86400) * 1000);
    return cachedMapplsToken;
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      const error = new Error('Mappls OAuth request timed out');
      error.code = 'TIMEOUT';
      throw error;
    }
    throw err;
  }
}

/**
 * Deterministically maps speedRatio to a standardized severity level.
 * Rule:
 *   speedRatio < 0.40 => 'critical' (Severe Congestion)
 *   speedRatio < 0.65 => 'high' (Heavy Congestion)
 *   speedRatio < 0.85 => 'medium' (Moderate Congestion)
 *   speedRatio >= 0.85 => 'low' (Free Flow / Minimal Congestion)
 */
function calculateDeterministicCongestion(currentSpeed, freeFlowSpeed) {
  if (!freeFlowSpeed || freeFlowSpeed <= 0 || !currentSpeed || currentSpeed < 0) {
    return { severity: 'info', congestionLevel: 'Traffic data available', speedRatio: null };
  }

  const speedRatio = parseFloat((currentSpeed / freeFlowSpeed).toFixed(3));

  if (speedRatio < 0.40) {
    return { severity: 'critical', congestionLevel: 'Severe Congestion', speedRatio };
  }
  if (speedRatio < 0.65) {
    return { severity: 'high', congestionLevel: 'Heavy Congestion', speedRatio };
  }
  if (speedRatio < 0.85) {
    return { severity: 'medium', congestionLevel: 'Moderate Congestion', speedRatio };
  }
  return { severity: 'low', congestionLevel: 'Normal Free Flow', speedRatio };
}

/**
 * Fetches real traffic data for a target city using configured provider.
 * Supports:
 *   1. Mappls (OAuth or REST key)
 *   2. Standard Traffic Flow (TomTom Flow Segment API via TRAFFIC_API_KEY)
 *
 * If no credentials are provided, immediately throws code: 'NOT_CONFIGURED'.
 */
async function fetchTrafficDataForCity(cityObj) {
  const hasMapplsOAuth = Boolean(env.mapplsClientId && env.mapplsClientSecret);
  const hasApiKey = Boolean(env.trafficApiKey);

  // 1. Guard against missing credentials (NEVER fabricate data)
  if (!hasMapplsOAuth && !hasApiKey) {
    const error = new Error(
      `Traffic API credentials not configured for ${cityObj.name}. Set MAPPLS_CLIENT_ID & MAPPLS_CLIENT_SECRET or TRAFFIC_API_KEY in backend/.env`
    );
    error.code = 'NOT_CONFIGURED';
    throw error;
  }

  const lat = cityObj.latitude;
  const lon = cityObj.longitude;
  const cityName = cityObj.name;
  const zone = getZone(lat, lon, cityObj);

  // 2. Mappls Integration Flow
  if (hasMapplsOAuth || (env.trafficProvider === 'mappls' && hasApiKey)) {
    let token = null;
    if (hasMapplsOAuth) {
      token = await getMapplsToken();
    }

    const apiKey = token || env.trafficApiKey;
    const url = `https://apis.mappls.com/advancedmaps/v1/${apiKey}/traffic?bounds=${lat - 0.05},${lon - 0.05};${lat + 0.05},${lon + 0.05}`;

    let response;
    try {
      response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(10000)
      });
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        const error = new Error(`Mappls Traffic API timed out for ${cityName}`);
        error.code = 'TIMEOUT';
        throw error;
      }
      const error = new Error(`Mappls Traffic network fetch error for ${cityName}: ${err.message}`);
      error.code = 'FETCH_ERROR';
      throw error;
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        const error = new Error(`Mappls API key / token invalid (HTTP ${response.status}) for ${cityName}`);
        error.code = 'CONFIG_ERROR';
        throw error;
      }
      if (response.status === 429) {
        const error = new Error(`Mappls Traffic API rate limit reached (HTTP 429) for ${cityName}`);
        error.code = 'RATE_LIMITED';
        throw error;
      }
      const error = new Error(`Mappls Traffic API HTTP ${response.status} for ${cityName}`);
      error.code = response.status >= 500 ? 'SOURCE_UNAVAILABLE' : 'FETCH_ERROR';
      throw error;
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      const error = new Error(`Malformed JSON response from Mappls Traffic for ${cityName}`);
      error.code = 'INVALID_RESPONSE';
      throw error;
    }

    const rawTimestamp = data?.timestamp || response.headers.get('date');
    const sourceTimestamp = rawTimestamp ? new Date(rawTimestamp).toISOString() : new Date().toISOString();
    const ingestedAt = new Date().toISOString();

    const now = new Date();
    const ageMinutes = (now - new Date(sourceTimestamp)) / (1000 * 60);
    const isFresh = ageMinutes >= -5 && ageMinutes <= 30;
    const status = isFresh ? 'LIVE' : (ageMinutes <= 120 ? 'STALE' : 'OFFLINE');
    const reasonCode = isFresh ? null : (ageMinutes <= 120 ? 'STALE_DATA' : 'SOURCE_UNAVAILABLE');

    // Mappls incident / flow parsing
    const incidents = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.incidents) ? data.incidents : []);
    const events = [];

    if (incidents.length > 0) {
      for (const inc of incidents.slice(0, 5)) {
        const incLat = typeof inc.location?.lat === 'number' ? inc.location.lat : lat;
        const incLon = typeof inc.location?.lng === 'number' ? inc.location.lng : lon;
        const incZone = getZone(incLat, incLon, cityObj);
        const incSeverity = ['low', 'medium', 'high', 'critical'].includes(inc.severity?.toLowerCase())
          ? inc.severity.toLowerCase()
          : 'info';

        events.push({
          city: cityName,
          source: 'traffic',
          eventType: 'traffic_incident',
          timestamp: inc.entryTime ? new Date(inc.entryTime).toISOString() : sourceTimestamp,
          sourceTimestamp,
          ingestedAt,
          latitude: incLat,
          longitude: incLon,
          zone: incZone,
          severity: incSeverity,
          value: typeof inc.delay === 'number' ? inc.delay : null,
          unit: 'min_delay',
          status,
          metadata: {
            provider: 'Mappls',
            roadName: inc.roadName || `${cityName} Corridor`,
            incidentType: inc.type || 'traffic_alert',
            description: inc.description || 'Observed incident',
            isSynthetic: false
          },
          isSynthetic: false
        });
      }
    } else {
      // Normal flow observation
      const flow = data?.flow || {};
      const currentSpeed = typeof flow.speed === 'number' ? flow.speed : (typeof data.speed === 'number' ? data.speed : null);
      const freeFlowSpeed = typeof flow.freeFlowSpeed === 'number' ? flow.freeFlowSpeed : (typeof data.freeFlowSpeed === 'number' ? data.freeFlowSpeed : null);
      const { severity, congestionLevel, speedRatio } = calculateDeterministicCongestion(currentSpeed, freeFlowSpeed);

      events.push({
        city: cityName,
        source: 'traffic',
        eventType: 'traffic_flow',
        timestamp: sourceTimestamp,
        sourceTimestamp,
        ingestedAt,
        latitude: lat,
        longitude: lon,
        zone,
        severity,
        value: currentSpeed,
        unit: 'km/h',
        status,
        metadata: {
          provider: 'Mappls',
          roadName: `${cityName} Central Arterial`,
          currentSpeed,
          freeFlowSpeed,
          speedRatio,
          congestionLevel,
          isSynthetic: false
        },
        isSynthetic: false
      });
    }

    return {
      events,
      reasonCode,
      summaryData: {
        city: cityName,
        source: 'traffic',
        provider: 'Mappls',
        status,
        sourceTimestamp,
        ingestedAt,
        eventsCount: events.length,
        isSynthetic: false
      }
    };
  }

  // 3. TomTom / Direct Traffic Flow Segment API (via TRAFFIC_API_KEY)
  const apiKey = env.trafficApiKey;
  const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json?point=${lat},${lon}&unit=KMPH&key=${apiKey}`;

  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      const error = new Error(`Traffic API timed out for ${cityName}`);
      error.code = 'TIMEOUT';
      throw error;
    }
    const error = new Error(`Traffic API network fetch error for ${cityName}: ${err.message}`);
    error.code = 'FETCH_ERROR';
    throw error;
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      const error = new Error(`Traffic API key invalid (HTTP ${response.status}) for ${cityName}`);
      error.code = 'CONFIG_ERROR';
      throw error;
    }
    if (response.status === 429) {
      const error = new Error(`Traffic API rate limit reached (HTTP 429) for ${cityName}`);
      error.code = 'RATE_LIMITED';
      throw error;
    }
    const error = new Error(`Traffic API HTTP ${response.status} for ${cityName}`);
    error.code = response.status >= 500 ? 'SOURCE_UNAVAILABLE' : 'FETCH_ERROR';
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    const error = new Error(`Malformed non-JSON response from Traffic API for ${cityName}`);
    error.code = 'INVALID_RESPONSE';
    throw error;
  }

  const flow = data?.flowSegmentData;
  if (!flow || typeof flow !== 'object') {
    const error = new Error(`Missing flowSegmentData in Traffic API response for ${cityName}`);
    error.code = 'INVALID_RESPONSE';
    throw error;
  }

  const rawTimestamp = response.headers.get('date');
  const sourceTimestamp = rawTimestamp ? new Date(rawTimestamp).toISOString() : new Date().toISOString();
  const ingestedAt = new Date().toISOString();

  const now = new Date();
  const ageMinutes = (now - new Date(sourceTimestamp)) / (1000 * 60);
  const isFresh = ageMinutes >= -5 && ageMinutes <= 30;
  const status = isFresh ? 'LIVE' : (ageMinutes <= 120 ? 'STALE' : 'OFFLINE');
  const reasonCode = isFresh ? null : 'STALE_DATA';

  const currentSpeed = typeof flow.currentSpeed === 'number' ? flow.currentSpeed : null;
  const freeFlowSpeed = typeof flow.freeFlowSpeed === 'number' ? flow.freeFlowSpeed : null;
  const currentTravelTime = typeof flow.currentTravelTime === 'number' ? flow.currentTravelTime : null;
  const freeFlowTravelTime = typeof flow.freeFlowTravelTime === 'number' ? flow.freeFlowTravelTime : null;
  const delaySec = (currentTravelTime && freeFlowTravelTime) ? Math.max(0, currentTravelTime - freeFlowTravelTime) : 0;
  const delayMinutes = Math.round(delaySec / 60);

  const { severity, congestionLevel, speedRatio } = calculateDeterministicCongestion(currentSpeed, freeFlowSpeed);

  const events = [
    {
      city: cityName,
      source: 'traffic',
      eventType: 'traffic_flow',
      timestamp: sourceTimestamp,
      sourceTimestamp,
      ingestedAt,
      latitude: lat,
      longitude: lon,
      zone,
      severity,
      value: currentSpeed,
      unit: 'km/h',
      status,
      metadata: {
        provider: 'TomTom',
        roadName: `${cityName} Central Arterial`,
        currentSpeed,
        freeFlowSpeed,
        delayMinutes,
        speedRatio,
        congestionLevel,
        roadClosure: Boolean(flow.roadClosure),
        confidence: typeof flow.confidence === 'number' ? flow.confidence : null,
        isSynthetic: false
      },
      isSynthetic: false
    }
  ];

  return {
    events,
    reasonCode,
    summaryData: {
      city: cityName,
      source: 'traffic',
      provider: 'TomTom',
      status,
      sourceTimestamp,
      ingestedAt,
      currentSpeed,
      freeFlowSpeed,
      delayMinutes,
      congestionLevel,
      speedRatio,
      isSynthetic: false
    }
  };
}

module.exports = {
  fetchTrafficDataForCity,
  calculateDeterministicCongestion
};

const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const CITIES = [
  { id: 'jaipur', name: 'Jaipur', latitude: 26.9124, longitude: 75.7873 },
  { id: 'delhi', name: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
  { id: 'mumbai', name: 'Mumbai', latitude: 19.0760, longitude: 72.8777 }
];

async function diagnoseCity(city, apiKey) {
  const apiKeyPresent = Boolean(apiKey && apiKey.trim());
  const diagnostics = {
    city: city.name,
    apiKeyPresent,
    httpStatus: null,
    reason: null,
    locationsFound: 0,
    nearestLocation: null,
    sensorsFound: 0,
    latestMeasurementAvailable: false
  };

  if (!apiKeyPresent) {
    diagnostics.reason = 'CONFIG_ERROR';
    return diagnostics;
  }

  const locationsUrl = `https://api.openaq.org/v3/locations?coordinates=${city.latitude},${city.longitude}&radius=25000&limit=100`;
  const headers = {
    'X-API-Key': apiKey.trim()
  };

  try {
    const response = await fetch(locationsUrl, { headers });
    diagnostics.httpStatus = response.status;

    if (response.status === 401 || response.status === 403) {
      diagnostics.reason = 'API_UNAUTHORIZED';
      return diagnostics;
    }

    if (response.status === 429) {
      diagnostics.reason = 'API_RATE_LIMITED';
      return diagnostics;
    }

    if (!response.ok) {
      diagnostics.reason = 'API_ERROR';
      return diagnostics;
    }

    const data = await response.json();
    const locations = data.results || [];
    diagnostics.locationsFound = locations.length;

    if (locations.length === 0) {
      diagnostics.reason = 'NO_LOCATIONS_FOUND';
      return diagnostics;
    }

    // Identify nearest location
    const nearest = locations[0];
    diagnostics.nearestLocation = {
      id: nearest.id,
      name: nearest.name,
      distance: nearest.distance || null,
      coordinates: nearest.coordinates || null
    };

    // Inspect sensors via GET /v3/locations/{location_id}/sensors
    const sensorsUrl = `https://api.openaq.org/v3/locations/${nearest.id}/sensors`;
    const sensorsRes = await fetch(sensorsUrl, { headers });

    if (!sensorsRes.ok) {
      diagnostics.reason = 'NO_SUITABLE_SENSORS';
      return diagnostics;
    }

    const sensorsData = await sensorsRes.json();
    const sensors = sensorsData.results || [];
    diagnostics.sensorsFound = sensors.length;

    if (sensors.length === 0) {
      diagnostics.reason = 'NO_SUITABLE_SENSORS';
      return diagnostics;
    }

    // Inspect latest measurements via GET /v3/locations/{location_id}/latest
    const latestUrl = `https://api.openaq.org/v3/locations/${nearest.id}/latest`;
    const latestRes = await fetch(latestUrl, { headers });

    if (latestRes.ok) {
      const latestData = await latestRes.json();
      const latestResults = latestData.results || [];

      if (latestResults.length > 0) {
        diagnostics.latestMeasurementAvailable = true;
        diagnostics.reason = 'SUCCESS';
      } else {
        diagnostics.reason = 'NO_RECENT_MEASUREMENTS';
      }
    } else {
      diagnostics.reason = 'NO_RECENT_MEASUREMENTS';
    }

  } catch (error) {
    console.error(`[OpenAQ Diagnostic Error] ${city.name}: ${error.message}`);
    diagnostics.reason = 'API_ERROR';
  }

  return diagnostics;
}

async function runDiagnostics() {
  const apiKey = process.env.OPENAQ_API_KEY || '';
  console.log(`OPENAQ_API_KEY_PRESENT=${Boolean(apiKey && apiKey.trim())}`);

  const results = [];
  for (const city of CITIES) {
    const diag = await diagnoseCity(city, apiKey);
    results.push(diag);
    console.log(`\n--- ${city.name} Diagnostic ---`);
    console.log(`HTTP Status: ${diag.httpStatus}`);
    console.log(`Reason Code: ${diag.reason}`);
    console.log(`Locations Found: ${diag.locationsFound}`);
    console.log(`Nearest Location:`, JSON.stringify(diag.nearestLocation));
    console.log(`Sensors Found: ${diag.sensorsFound}`);
    console.log(`Latest Measurements Available: ${diag.latestMeasurementAvailable}`);
  }

  return results;
}

if (require.main === module) {
  runDiagnostics();
}

module.exports = { diagnoseCity, runDiagnostics };

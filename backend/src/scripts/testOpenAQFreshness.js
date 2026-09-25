const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const CITIES = [
  { id: 'jaipur', name: 'Jaipur', latitude: 26.9124, longitude: 75.7873 },
  { id: 'delhi', name: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
  { id: 'mumbai', name: 'Mumbai', latitude: 19.0760, longitude: 72.8777 }
];

async function exploreCityLocations(city) {
  const apiKey = process.env.OPENAQ_API_KEY || '';
  if (!apiKey) {
    console.log(`No API Key found`);
    return;
  }

  const baseUrl = 'https://api.openaq.org/v3';
  const headers = { 'X-API-Key': apiKey.trim() };
  
  // Search locations within 25km radius
  const locUrl = `${baseUrl}/locations?coordinates=${city.latitude},${city.longitude}&radius=25000&limit=100`;
  const res = await fetch(locUrl, { headers });
  if (!res.ok) {
    console.log(`${city.name}: Locations search HTTP ${res.status}`);
    return;
  }

  const data = await res.json();
  const locations = data.results || [];
  console.log(`\n========================================`);
  console.log(`City: ${city.name} - Found ${locations.length} locations within 25km`);

  let bestPm25Candidate = null;

  // Inspect up to 15 candidate locations to find newest PM2.5 measurement
  for (const loc of locations.slice(0, 15)) {
    const latestUrl = `${baseUrl}/locations/${loc.id}/latest`;
    try {
      const lRes = await fetch(latestUrl, { headers });
      if (!lRes.ok) continue;

      const lData = await lRes.json();
      const measurements = lData.results || [];

      for (const m of measurements) {
        const pName = (m.parameter?.name || m.parameter || '').toLowerCase();
        if ((pName === 'pm25' || pName === 'pm2.5') && typeof m.value === 'number') {
          const mDate = new Date(m.datetime?.utc || m.datetime);
          console.log(`Location #${loc.id} "${loc.name}": PM2.5 = ${m.value} µg/m³, datetime = ${mDate.toISOString()}`);

          if (!bestPm25Candidate || mDate > bestPm25Candidate.date) {
            bestPm25Candidate = {
              locationId: loc.id,
              locationName: loc.name,
              value: m.value,
              unit: m.parameter?.units || m.unit || 'µg/m³',
              date: mDate,
              isoString: mDate.toISOString(),
              measurement: m
            };
          }
        }
      }
    } catch (e) {
      // skip
    }
  }

  if (bestPm25Candidate) {
    const now = new Date();
    const ageHours = (now - bestPm25Candidate.date) / (1000 * 60 * 60);
    const ageDays = (ageHours / 24).toFixed(1);
    console.log(`\n>>> BEST CANDIDATE FOR ${city.name.toUpperCase()}:`);
    console.log(`Station: "${bestPm25Candidate.locationName}" (ID: ${bestPm25Candidate.locationId})`);
    console.log(`PM2.5: ${bestPm25Candidate.value} µg/m³`);
    console.log(`Timestamp: ${bestPm25Candidate.isoString}`);
    console.log(`Age: ${ageHours.toFixed(1)} hours (${ageDays} days ago)`);
  } else {
    console.log(`\n>>> NO PM2.5 CANDIDATE FOUND FOR ${city.name.toUpperCase()}`);
  }
}

async function main() {
  for (const c of CITIES) {
    await exploreCityLocations(c);
  }
}

main();

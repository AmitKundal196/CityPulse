const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const CITIES = [
  { id: 'jaipur', name: 'Jaipur', latitude: 26.9124, longitude: 75.7873 },
  { id: 'delhi', name: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
  { id: 'mumbai', name: 'Mumbai', latitude: 19.0760, longitude: 72.8777 }
];

async function inspectCity(city) {
  const apiKey = (process.env.OPENAQ_API_KEY || '').trim();
  const baseUrl = 'https://api.openaq.org/v3';
  const headers = { 'X-API-Key': apiKey };

  const locUrl = `${baseUrl}/locations?coordinates=${city.latitude},${city.longitude}&radius=25000&limit=20`;
  const res = await fetch(locUrl, { headers });
  const data = await res.json();
  const locations = data.results || [];
  console.log(`\n=== CITY: ${city.name} (${locations.length} locations) ===`);

  for (const loc of locations.slice(0, 10)) {
    console.log(`\nLocation ID ${loc.id}: "${loc.name}" (sensors count: ${loc.sensors?.length || 0})`);
    
    // Log location sensors if present
    if (loc.sensors && loc.sensors.length > 0) {
      loc.sensors.forEach(s => {
        console.log(`  Sensor ID ${s.id}: parameter =`, JSON.stringify(s.parameter), `latest =`, JSON.stringify(s.latest));
      });
    }

    // Try /sensors endpoint
    try {
      const sRes = await fetch(`${baseUrl}/locations/${loc.id}/sensors`, { headers });
      if (sRes.ok) {
        const sData = await sRes.json();
        const sensors = sData.results || [];
        console.log(`  /sensors endpoint returned ${sensors.length} sensors:`);
        sensors.forEach(s => {
          console.log(`    Sensor #${s.id}: parameter =`, JSON.stringify(s.parameter));
        });
      }
    } catch (e) {}

    // Try /latest endpoint
    try {
      const lRes = await fetch(`${baseUrl}/locations/${loc.id}/latest`, { headers });
      if (lRes.ok) {
        const lData = await lRes.json();
        console.log(`  /latest endpoint returned:`, JSON.stringify(lData.results).slice(0, 300));
      }
    } catch (e) {}
  }
}

async function run() {
  for (const c of CITIES) {
    await inspectCity(c);
  }
}

run();

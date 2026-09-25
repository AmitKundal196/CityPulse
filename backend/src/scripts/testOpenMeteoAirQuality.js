const CITIES = [
  { id: 'jaipur', name: 'Jaipur', latitude: 26.9124, longitude: 75.7873 },
  { id: 'delhi', name: 'Delhi', latitude: 28.6139, longitude: 77.2090 },
  { id: 'mumbai', name: 'Mumbai', latitude: 19.0760, longitude: 72.8777 }
];

async function testOpenMeteoAQ() {
  for (const city of CITIES) {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${city.latitude}&longitude=${city.longitude}&current=pm2_5,pm10,nitrogen_dioxide,ozone,us_aqi,us_aqi_pm2_5`;
    console.log(`\nFetching Open-Meteo Air Quality for ${city.name}...`);
    try {
      const res = await fetch(url);
      console.log(`HTTP Status: ${res.status}`);
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
  }
}

testOpenMeteoAQ();

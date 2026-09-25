const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

module.exports = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/neighborhood-pulse',
  demoCity: process.env.DEMO_CITY || 'Jaipur',
  latitude: process.env.LATITUDE ? parseFloat(process.env.LATITUDE) : 26.9124,
  longitude: process.env.LONGITUDE ? parseFloat(process.env.LONGITUDE) : 75.7873,
  radiusKm: process.env.RADIUS_KM ? parseFloat(process.env.RADIUS_KM) : 10,
  openaqApiKey: process.env.OPENAQ_API_KEY || '',
  llmApiKey: process.env.LLM_API_KEY || '',
  weatherIntervalMs: process.env.WEATHER_INTERVAL_MS ? parseInt(process.env.WEATHER_INTERVAL_MS, 10) : 300000,
  airQualityIntervalMs: process.env.AIR_QUALITY_INTERVAL_MS ? parseInt(process.env.AIR_QUALITY_INTERVAL_MS, 10) : 300000,
  simulationIntervalMs: process.env.SIMULATION_INTERVAL_MS ? parseInt(process.env.SIMULATION_INTERVAL_MS, 10) : 5000,
  trafficApiKey: process.env.TRAFFIC_API_KEY || '',
  mapplsClientId: process.env.MAPPLS_CLIENT_ID || '',
  mapplsClientSecret: process.env.MAPPLS_CLIENT_SECRET || '',
  trafficProvider: process.env.TRAFFIC_PROVIDER || 'mappls',
  trafficIntervalMs: process.env.TRAFFIC_INTERVAL_MS ? parseInt(process.env.TRAFFIC_INTERVAL_MS, 10) : 300000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};

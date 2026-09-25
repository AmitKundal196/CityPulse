/**
 * Phase 4 Intelligence & Cross-Feed Analysis - Automated Verification Suite
 *
 * Covers all 14 test requirements:
 * 1. Good AQI
 * 2. Elevated AQI
 * 3. High AQI
 * 4. Low wind + elevated AQI
 * 5. High temperature
 * 6. Heavy rain
 * 7. Strong wind
 * 8. Traffic + AQI overlap
 * 9. Complaint + environmental overlap
 * 10. Missing source
 * 11. Stale source
 * 12. One city failing
 * 13. Duplicate ingestion
 * 14. Invalid source data
 */

const mongoose = require('mongoose');
const intelligenceService = require('../services/intelligenceService');
const INTELLIGENCE_RULES = require('../config/intelligenceRules');
const Insight = require('../models/Insight');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('PHASE 4: NEIGHBORHOOD PULSE INTELLIGENCE TEST SUITE');
  console.log('====================================================\n');

  // Connect to test/dev MongoDB if needed
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/neighborhood-pulse');
  }

  // 1. Test Good AQI
  console.log('Test 1: Good AQI Evaluation');
  const goodAqiFeed = {
    status: 'LIVE',
    source: 'air_quality',
    lastSourceTimestamp: new Date(),
    details: { aqiData: { aqi: 35, pm2_5: 8.4, pm10: 15 } }
  };
  const goodInsight = intelligenceService.evaluateAirQuality('Jaipur', goodAqiFeed);
  assert(goodInsight !== null, 'Good AQI generates an insight');
  assert(goodInsight.evidence.conditionCode === 'GOOD_AIR', 'Condition code is GOOD_AIR');
  assert(goodInsight.severity === 'LOW', 'Severity is LOW');
  assert(goodInsight.isSynthetic === false, 'isSynthetic is false');

  // 2. Test Elevated AQI
  console.log('\nTest 2: Elevated AQI Evaluation');
  const elevatedAqiFeed = {
    status: 'LIVE',
    source: 'air_quality',
    lastSourceTimestamp: new Date(),
    details: { aqiData: { aqi: 125, pm2_5: 22.0 } }
  };
  const elevatedInsight = intelligenceService.evaluateAirQuality('Delhi', elevatedAqiFeed);
  assert(elevatedInsight !== null, 'Elevated AQI generates an insight');
  assert(elevatedInsight.evidence.conditionCode === 'UNHEALTHY_FOR_SENSITIVE_GROUPS', 'Condition code is UNHEALTHY_FOR_SENSITIVE_GROUPS');
  assert(elevatedInsight.severity === 'MEDIUM', 'Severity is MEDIUM');

  // 3. Test High AQI
  console.log('\nTest 3: High AQI Evaluation');
  const highAqiFeed = {
    status: 'LIVE',
    source: 'air_quality',
    lastSourceTimestamp: new Date(),
    details: { aqiData: { aqi: 194, pm2_5: 45.1 } }
  };
  const highInsight = intelligenceService.evaluateAirQuality('Delhi', highAqiFeed);
  assert(highInsight !== null, 'High AQI generates an insight');
  assert(highInsight.evidence.conditionCode === 'UNHEALTHY_AIR', 'Condition code is UNHEALTHY_AIR');
  assert(highInsight.severity === 'HIGH', 'Severity is HIGH');

  // 4. Test Low wind + elevated AQI (Poor Air Dispersion)
  console.log('\nTest 4: Low Wind + Elevated AQI (POOR_AIR_DISPERSION)');
  const weatherLowWindFeed = {
    status: 'LIVE',
    source: 'weather',
    lastSourceTimestamp: new Date(),
    details: { weatherData: { windSpeed: 9.6, temperature: 31.0 } }
  };
  const dispersionInsight = intelligenceService.evaluateDispersion('Jaipur', elevatedAqiFeed, weatherLowWindFeed);
  assert(dispersionInsight !== null, 'POOR_AIR_DISPERSION insight generated');
  assert(dispersionInsight.type === 'POOR_AIR_DISPERSION', 'Type is POOR_AIR_DISPERSION');
  assert(dispersionInsight.evidence.aqi === 125, 'Evidence retains AQI');
  assert(dispersionInsight.evidence.windSpeed === 9.6, 'Evidence retains windSpeed');
  assert(dispersionInsight.description.includes('consistent with reduced atmospheric dispersion'), 'Contains non-causal explanation');
  assert(!dispersionInsight.description.includes('caused by'), 'Does NOT claim causation');

  // 5. Test High Temperature
  console.log('\nTest 5: High Temperature Evaluation');
  const hotWeatherFeed = {
    status: 'LIVE',
    source: 'weather',
    lastSourceTimestamp: new Date(),
    details: { weatherData: { temperature: 39.5, windSpeed: 10, humidity: 40 } }
  };
  const hotInsights = intelligenceService.evaluateWeather('Jaipur', hotWeatherFeed);
  const tempInsight = hotInsights.find(i => i.evidence.threshold === INTELLIGENCE_RULES.weather.highTemperature);
  assert(tempInsight !== undefined, 'HIGH_TEMPERATURE insight generated');
  assert(tempInsight.evidence.temperature === 39.5, 'Evidence retains temperature');

  // 6. Test Heavy Rain
  console.log('\nTest 6: Heavy Rain Evaluation');
  const rainWeatherFeed = {
    status: 'LIVE',
    source: 'weather',
    lastSourceTimestamp: new Date(),
    details: { weatherData: { rain: 12.5, temperature: 26.0 } }
  };
  const rainInsights = intelligenceService.evaluateWeather('Mumbai', rainWeatherFeed);
  const rainInsight = rainInsights.find(i => i.evidence.threshold === INTELLIGENCE_RULES.weather.heavyRain);
  assert(rainInsight !== undefined, 'HEAVY_RAIN insight generated');
  assert(rainInsight.severity === 'HIGH', 'Heavy rain severity is HIGH');

  // 7. Test Strong Wind
  console.log('\nTest 7: Strong Wind Evaluation');
  const windWeatherFeed = {
    status: 'LIVE',
    source: 'weather',
    lastSourceTimestamp: new Date(),
    details: { weatherData: { windSpeed: 28.0, temperature: 28.0 } }
  };
  const windInsights = intelligenceService.evaluateWeather('Mumbai', windWeatherFeed);
  const windInsight = windInsights.find(i => i.evidence.threshold === INTELLIGENCE_RULES.weather.strongWind);
  assert(windInsight !== undefined, 'STRONG_WIND insight generated');
  assert(windInsight.evidence.windSpeed === 28.0, 'Evidence retains windSpeed');

  // 8. Test Traffic + AQI overlap
  console.log('\nTest 8: Traffic + AQI Overlap');
  const trafficFeed = { status: 'SIMULATED', isSynthetic: true };
  const recentTrafficEvent = { severity: 'high', zone: 'Central District', isSynthetic: true };
  const trafficOverlap = intelligenceService.evaluateTrafficAqiOverlap('Delhi', elevatedAqiFeed, trafficFeed, recentTrafficEvent);
  assert(trafficOverlap !== null, 'TRAFFIC_AIR_QUALITY_OVERLAP insight generated');
  assert(trafficOverlap.type === 'TRAFFIC_AIR_QUALITY_OVERLAP', 'Type matches');
  assert(trafficOverlap.description.includes('temporal overlap'), 'Uses temporal overlap phrasing');
  assert(!trafficOverlap.description.includes('caused by'), 'No causation claimed');

  // 9. Test Complaint + Environmental overlap
  console.log('\nTest 9: Complaint + Environmental Overlap');
  const complaints = [
    { type: 'complaint', city: 'Mumbai', isSynthetic: true },
    { type: 'complaint', city: 'Mumbai', isSynthetic: true }
  ];
  const complaintOverlap = intelligenceService.evaluateComplaintsEnvironmentalOverlap('Mumbai', elevatedAqiFeed, rainWeatherFeed, complaints);
  assert(complaintOverlap !== null, 'COMPLAINTS_ENVIRONMENTAL_OVERLAP insight generated');
  assert(complaintOverlap.description.includes('concurrent period'), 'Uses concurrent phrasing');
  assert(!complaintOverlap.description.includes('caused'), 'No causation claimed');

  // 10. Test Missing source
  console.log('\nTest 10: Missing Source Resistance');
  const missingAqiInsight = intelligenceService.evaluateAirQuality('Jaipur', null);
  assert(missingAqiInsight === null, 'Missing AQI feed returns null cleanly');
  const missingDispersionInsight = intelligenceService.evaluateDispersion('Jaipur', null, weatherLowWindFeed);
  assert(missingDispersionInsight === null, 'Missing feed returns null without crashing');

  // 11. Test Stale source
  console.log('\nTest 11: Stale Source Handling');
  const staleAqiFeed = {
    status: 'STALE',
    source: 'air_quality',
    lastSourceTimestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    details: { aqiData: { aqi: 180, pm2_5: 35.0 } }
  };
  const staleInsight = intelligenceService.evaluateAirQuality('Delhi', staleAqiFeed);
  assert(staleInsight === null, 'Stale AQI feed is rejected from live intelligence');

  // 12. Test One City Failing (Independence)
  console.log('\nTest 12: City Independence (One City Failing)');
  const offlineDelhiFeed = { status: 'OFFLINE', source: 'air_quality' };
  const delhiInsight = intelligenceService.evaluateAirQuality('Delhi', offlineDelhiFeed);
  const mumbaiInsight = intelligenceService.evaluateAirQuality('Mumbai', goodAqiFeed);
  assert(delhiInsight === null, 'Failing city (Delhi) yields no invalid insight');
  assert(mumbaiInsight !== null, 'Independent city (Mumbai) continues normally');

  // 13. Test Duplicate Ingestion (Suppression)
  console.log('\nTest 13: Duplicate Suppression Window');
  const candidate1 = {
    city: 'Jaipur_Test',
    type: 'AIR_QUALITY',
    severity: 'LOW',
    title: 'Good Air Quality Test',
    description: 'Test duplicate description',
    timestamp: new Date(),
    sources: ['Open-Meteo Air Quality'],
    evidence: { aqi: 40 },
    confidence: 'HIGH',
    freshnessStatus: 'LIVE',
    isSynthetic: false,
    fingerprint: 'Jaipur_Test_AIR_QUALITY_GOOD_AIR'
  };

  // Clean test collection
  await Insight.deleteMany({ city: 'Jaipur_Test' });

  // First persist
  const savedFirst = await intelligenceService.persistWithDeduplication([candidate1]);
  assert(savedFirst.length === 1, 'First insertion succeeds');

  // Immediate second persist with identical candidate
  const savedSecond = await intelligenceService.persistWithDeduplication([candidate1]);
  const totalInDb = await Insight.countDocuments({ city: 'Jaipur_Test' });
  assert(totalInDb === 1, 'Duplicate within suppression window was prevented (total count = 1)');
  await Insight.deleteMany({ city: 'Jaipur_Test' });

  // 14. Test Invalid Source Data
  console.log('\nTest 14: Invalid Source Data Resilience');
  const invalidAqiFeed = {
    status: 'LIVE',
    source: 'air_quality',
    details: { aqiData: { aqi: 'not-a-number', pm2_5: NaN } }
  };
  const invalidInsight = intelligenceService.evaluateAirQuality('Jaipur', invalidAqiFeed);
  assert(invalidInsight === null, 'Malformed/non-numeric AQI produces no fabricated insight');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});

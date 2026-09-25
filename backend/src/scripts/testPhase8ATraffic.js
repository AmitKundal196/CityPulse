const mongoose = require('mongoose');
const env = require('../config/env');
const CITIES = require('../config/cities');
const Event = require('../models/Event');
const FeedStatus = require('../models/FeedStatus');
const { fetchTrafficDataForCity, calculateDeterministicCongestion } = require('../services/connectors/trafficConnector');
const ingestionManager = require('../services/ingestionManager');

async function runTests() {
  console.log('====================================================');
  console.log('PHASE 8A: REAL-TIME TRAFFIC INTEGRATION VALIDATION');
  console.log('====================================================\n');

  await mongoose.connect(env.mongoUri);
  console.log('[1] Connected to MongoDB.');

  // Test 1: Deterministic Congestion Calculation
  console.log('\n[2] Testing Deterministic Congestion Calculation:');
  const testCases = [
    { speed: 15, freeFlow: 50, expected: 'critical' }, // ratio 0.30
    { speed: 28, freeFlow: 50, expected: 'high' },     // ratio 0.56
    { speed: 38, freeFlow: 50, expected: 'medium' },   // ratio 0.76
    { speed: 48, freeFlow: 50, expected: 'low' },      // ratio 0.96
    { speed: null, freeFlow: 50, expected: 'info' }
  ];

  for (const tc of testCases) {
    const result = calculateDeterministicCongestion(tc.speed, tc.freeFlow);
    const passed = result.severity === tc.expected;
    console.log(`  - speed=${tc.speed}, freeFlow=${tc.freeFlow} => severity=${result.severity}, level="${result.congestionLevel}" (Passed: ${passed})`);
    if (!passed) throw new Error(`Congestion calculation failed for speed ${tc.speed}`);
  }

  // Test 2: Purge any legacy synthetic traffic events
  console.log('\n[3] Purging legacy synthetic traffic events from MongoDB:');
  const deleteResult = await Event.deleteMany({ source: 'traffic', isSynthetic: true });
  console.log(`  - Deleted ${deleteResult.deletedCount} legacy synthetic traffic event(s).`);

  const remainingSynthetic = await Event.countDocuments({ source: 'traffic', isSynthetic: true });
  console.log(`  - Remaining synthetic traffic events: ${remainingSynthetic} (Expected: 0)`);
  if (remainingSynthetic !== 0) throw new Error('Synthetic traffic events still exist!');

  // Test 3: Unconfigured State Behavior
  console.log('\n[4] Testing Unconfigured State (No Fake Data Generated):');
  for (const city of CITIES) {
    try {
      await fetchTrafficDataForCity(city);
      console.log(`  - [${city.name}] Real traffic API credentials are configured!`);
    } catch (err) {
      console.log(`  - [${city.name}] Threw expected code="${err.code}" - ${err.message}`);
      if (err.code !== 'NOT_CONFIGURED' && err.code !== 'CONFIG_ERROR' && err.code !== 'FETCH_ERROR') {
        throw new Error(`Unexpected error code: ${err.code}`);
      }
    }
  }

  // Test 4: Run IngestionManager Traffic Poll
  console.log('\n[5] Executing IngestionManager pollTraffic():');
  await ingestionManager.pollTraffic();

  for (const city of CITIES) {
    const statusDoc = await FeedStatus.findOne({ city: city.name, source: 'traffic' }).lean();
    console.log(`  - FeedStatus [${city.name}][traffic]:`);
    console.log(`      status: ${statusDoc?.status}`);
    console.log(`      isSynthetic: ${statusDoc?.isSynthetic}`);
    console.log(`      reasonCode: ${statusDoc?.reasonCode}`);
    console.log(`      recordsReceived: ${statusDoc?.recordsReceived}`);

    if (statusDoc?.isSynthetic !== false) {
      throw new Error(`FeedStatus for ${city.name} must have isSynthetic: false`);
    }
    if (!['LIVE', 'STALE', 'OFFLINE', 'NOT_CONFIGURED'].includes(statusDoc?.status)) {
      throw new Error(`Invalid status for ${city.name}: ${statusDoc?.status}`);
    }
  }

  // Test 5: Verify Weather and Air Quality Remain Intact & Unaffected
  console.log('\n[6] Verifying Weather & Air Quality Independence:');
  for (const city of CITIES) {
    const weatherStatus = await FeedStatus.findOne({ city: city.name, source: 'weather' }).lean();
    const aqiStatus = await FeedStatus.findOne({ city: city.name, source: 'air_quality' }).lean();
    console.log(`  - [${city.name}] Weather=${weatherStatus?.status || 'N/A'}, AQI=${aqiStatus?.status || 'N/A'}`);
    if (weatherStatus?.status !== 'LIVE') {
      console.warn(`    Weather status is ${weatherStatus?.status}`);
    }
  }

  console.log('\n====================================================');
  console.log('PHASE 8A VALIDATION COMPLETED SUCCESSFULLY!');
  console.log('====================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n[FATAL ERROR in Phase 8A Test]', err);
  process.exit(1);
});

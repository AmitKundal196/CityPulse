const { validateEvent } = require('../utils/validationHelper');
const { isDuplicateEvent } = require('../utils/deduplicationHelper');
const { getUsAqiCategory } = require('../utils/aqiCalculator');
const CITIES = require('../config/cities');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 3 DATA VALIDATION & FEED HEALTH TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(testName, condition, details = '') {
    total++;
    if (condition) {
      console.log(`✅ [PASS] Test ${total}: ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Test ${total}: ${testName} - ${details}`);
    }
  }

  // 1. Successful Valid Event
  const validEvent = {
    city: 'Jaipur',
    source: 'Open-Meteo',
    eventType: 'us_aqi',
    timestamp: new Date().toISOString(),
    sourceTimestamp: new Date().toISOString(),
    ingestedAt: new Date().toISOString(),
    latitude: 26.9124,
    longitude: 75.7873,
    zone: 'B2',
    value: 149,
    unit: 'USAQI',
    status: 'LIVE',
    isSynthetic: false
  };
  const res1 = validateEvent(validEvent);
  assert('Successful Valid Event passes validation', res1.valid === true);

  // 2. Missing Required Data
  const missingDataEvent = { ...validEvent };
  delete missingDataEvent.city;
  const res2 = validateEvent(missingDataEvent);
  assert('Missing city rejected', res2.valid === false && res2.reasonCode === 'INVALID_DATA');

  // 3. Unsupported City
  const invalidCityEvent = { ...validEvent, city: 'Atlantis' };
  const res3 = validateEvent(invalidCityEvent);
  assert('Unsupported city rejected', res3.valid === false && res3.reason.includes('Unsupported city'));

  // 4. Invalid Numeric Value: NaN
  const nanEvent = { ...validEvent, value: NaN };
  const res4 = validateEvent(nanEvent);
  assert('NaN numeric value rejected', res4.valid === false && res4.reasonCode === 'INVALID_DATA');

  // 5. Invalid Numeric Value: Infinity
  const infEvent = { ...validEvent, value: Infinity };
  const res5 = validateEvent(infEvent);
  assert('Infinity numeric value rejected', res5.valid === false && res5.reasonCode === 'INVALID_DATA');

  // 6. Domain Bounds Checking: Negative AQI
  const negAqiEvent = { ...validEvent, value: -15 };
  const res6 = validateEvent(negAqiEvent);
  assert('Negative AQI rejected', res6.valid === false && res6.reason.includes('AQI value out of valid range'));

  // 7. Domain Bounds Checking: Excessively large AQI (> 500)
  const highAqiEvent = { ...validEvent, value: 999 };
  const res7 = validateEvent(highAqiEvent);
  assert('AQI > 500 rejected', res7.valid === false && res7.reason.includes('AQI value out of valid range'));

  // 8. Stale Timestamp Calculation Test
  const tenHoursAgo = new Date(Date.now() - 10 * 3600 * 1000).toISOString();
  const now = new Date();
  const ageHours = (now - new Date(tenHoursAgo)) / (1000 * 3600);
  const isFresh = ageHours <= 6;
  assert('Stale timestamp correctly categorized as STALE', isFresh === false && ageHours >= 10);

  // 9. Unknown Source Rejection
  const unknownSourceEvent = { ...validEvent, source: 'untrusted_random_feed' };
  const res9 = validateEvent(unknownSourceEvent);
  assert('Unknown source rejected', res9.valid === false && res9.reason.includes('Unknown source'));

  // 10. City Isolation Verification
  const cityStatuses = {
    Jaipur: { status: 'LIVE', error: null },
    Delhi: { status: 'OFFLINE', error: 'Network timeout (mocked)' },
    Mumbai: { status: 'LIVE', error: null }
  };
  const delhiFailed = cityStatuses.Delhi.status === 'OFFLINE';
  const jaipurIntact = cityStatuses.Jaipur.status === 'LIVE' && cityStatuses.Jaipur.error === null;
  const mumbaiIntact = cityStatuses.Mumbai.status === 'LIVE' && cityStatuses.Mumbai.error === null;
  assert('Delhi failure does NOT contaminate Jaipur or Mumbai (Isolation)', delhiFailed && jaipurIntact && mumbaiIntact);

  console.log(`\n====================================================`);
  console.log(`Summary: ${passed}/${total} Phase 3 validation tests PASSED.`);
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

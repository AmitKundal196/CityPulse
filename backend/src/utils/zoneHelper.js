const defaultEnv = require('../config/env');

/**
 * Maps latitude/longitude to a 3x3 geographic grid code (A1..C3)
 * relative to the target city center coordinates.
 */
function getZone(latitude, longitude, cityObj = null) {
  const centerLat = cityObj && typeof cityObj.latitude === 'number' ? cityObj.latitude : defaultEnv.latitude;
  const centerLon = cityObj && typeof cityObj.longitude === 'number' ? cityObj.longitude : defaultEnv.longitude;

  const latDiff = latitude - centerLat;
  const lonDiff = longitude - centerLon;

  const step = 0.025;

  let row = 'B';
  if (latDiff > step) row = 'A';
  else if (latDiff < -step) row = 'C';

  let col = '2';
  if (lonDiff < -step) col = '1';
  else if (lonDiff > step) col = '3';

  return `${row}${col}`;
}

module.exports = { getZone };

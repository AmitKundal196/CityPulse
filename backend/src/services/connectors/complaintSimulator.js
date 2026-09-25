const { getZone } = require('../../utils/zoneHelper');

const COMPLAINT_EVENT_TYPES = [
  'flooding',
  'pothole',
  'garbage',
  'noise',
  'streetlight',
  'waterlogging',
  'road_damage'
];

const SEVERITIES = ['low', 'medium', 'high', 'critical'];

/**
 * Generates realistic synthetic 311 civic complaint events for a specific target city.
 * Set: city = cityObj.name, source = "complaint", isSynthetic = true
 */
function generateComplaintEventForCity(cityObj) {
  const centerLat = cityObj.latitude;
  const centerLon = cityObj.longitude;

  // Random offset strictly inside city limits (~3-4 km radius)
  const latOffset = (Math.random() - 0.5) * 0.05;
  const lonOffset = (Math.random() - 0.5) * 0.05;

  const lat = parseFloat((centerLat + latOffset).toFixed(6));
  const lon = parseFloat((centerLon + lonOffset).toFixed(6));
  const zone = getZone(lat, lon, cityObj);

  const eventType = COMPLAINT_EVENT_TYPES[Math.floor(Math.random() * COMPLAINT_EVENT_TYPES.length)];
  const severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];

  return {
    city: cityObj.name,
    source: 'complaint',
    eventType,
    timestamp: new Date().toISOString(),
    latitude: lat,
    longitude: lon,
    zone,
    severity,
    value: 1,
    unit: 'report',
    metadata: {
      ticketId: `T311-${cityObj.id.toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
      category: 'Public Works'
    },
    isSynthetic: true
  };
}

module.exports = { generateComplaintEventForCity };

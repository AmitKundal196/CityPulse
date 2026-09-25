const { getZone } = require('../../utils/zoneHelper');

const TRAFFIC_EVENT_TYPES = ['accident', 'congestion', 'road_blockage', 'signal_failure'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

/**
 * Generates realistic synthetic traffic events for a specific target city.
 * Set: city = cityObj.name, source = "traffic", isSynthetic = true
 */
function generateTrafficEventForCity(cityObj) {
  const centerLat = cityObj.latitude;
  const centerLon = cityObj.longitude;

  // Random offset strictly inside city limits (~3-4 km radius)
  const latOffset = (Math.random() - 0.5) * 0.05;
  const lonOffset = (Math.random() - 0.5) * 0.05;

  const lat = parseFloat((centerLat + latOffset).toFixed(6));
  const lon = parseFloat((centerLon + lonOffset).toFixed(6));
  const zone = getZone(lat, lon, cityObj);

  const eventType = TRAFFIC_EVENT_TYPES[Math.floor(Math.random() * TRAFFIC_EVENT_TYPES.length)];
  const severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
  const value = Math.floor(Math.random() * 30) + 5; 

  return {
    city: cityObj.name,
    source: 'traffic',
    eventType,
    timestamp: new Date().toISOString(),
    latitude: lat,
    longitude: lon,
    zone,
    severity,
    value,
    unit: 'min_delay',
    metadata: {
      roadName: `Main Corridor ${cityObj.name} ${zone}`,
      simulatedSpeedKmh: Math.floor(Math.random() * 20) + 5
    },
    isSynthetic: true
  };
}

module.exports = { generateTrafficEventForCity };

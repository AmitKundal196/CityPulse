/**
 * Transit connector architecture placeholder for real GTFS-Realtime integrations.
 */
async function fetchTransitDataForCity(cityObj) {
  const error = new Error(`No public GTFS-Realtime feed configured for ${cityObj.name}`);
  error.code = 'NOT_CONFIGURED';
  throw error;
}

module.exports = { fetchTransitDataForCity };

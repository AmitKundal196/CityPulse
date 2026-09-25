const Event = require('../models/Event');

/**
 * Checks whether an identical event observation was already saved recently.
 * Include city in deduplication signature.
 */
async function isDuplicateEvent(event) {
  if (event.isSynthetic) {
    return false;
  }

  try {
    const existing = await Event.findOne({
      city: event.city,
      source: event.source,
      eventType: event.eventType,
      timestamp: new Date(event.timestamp),
      value: event.value,
      zone: event.zone
    }).lean();

    return !!existing;
  } catch (error) {
    console.warn(`[Deduplication Warning] Failed to query existing events: ${error.message}`);
    return false;
  }
}

module.exports = { isDuplicateEvent };

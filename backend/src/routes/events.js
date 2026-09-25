const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const CITIES = require('../config/cities');
const { validateCity, validateQueryParams } = require('../middleware/validateInput');

// GET /api/events - Query recent events with optional city, source, eventType, zone filters
router.get('/events', validateCity, validateQueryParams, async (req, res, next) => {
  try {
    const { city, source, eventType, zone, limit } = req.query;
    const filter = {};

    if (city && city.toLowerCase() !== 'all') {
      // Find matching city by name or id
      const matchedCity = CITIES.find(
        c => c.name.toLowerCase() === city.toLowerCase() || c.id.toLowerCase() === city.toLowerCase()
      );
      filter.city = matchedCity ? matchedCity.name : new RegExp(`^${city}$`, 'i');
    }

    if (source) {
      if (source.toLowerCase() === 'complaint') {
        filter.source = { $in: ['complaint', 'citizen', 'demo'] };
      } else {
        filter.source = source;
      }
    }
    if (eventType) filter.eventType = eventType;
    if (zone) filter.zone = zone;

    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 200);

    const events = await Event.find(filter)
      .sort({ timestamp: -1 })
      .limit(parsedLimit)
      .lean();

    res.json({
      count: events.length,
      events
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/recent - Return latest single event per source (optionally per city)
router.get('/events/recent', async (req, res, next) => {
  try {
    const { city } = req.query;
    const sources = ['weather', 'air_quality', 'traffic', 'complaint', 'transit'];
    const recentEvents = {};

    for (const src of sources) {
      const filter = {};
      if (src === 'complaint') {
        filter.source = { $in: ['complaint', 'citizen', 'demo'] };
      } else {
        filter.source = src;
      }

      if (city && city.toLowerCase() !== 'all') {
        const matchedCity = CITIES.find(
          c => c.name.toLowerCase() === city.toLowerCase() || c.id.toLowerCase() === city.toLowerCase()
        );
        filter.city = matchedCity ? matchedCity.name : new RegExp(`^${city}$`, 'i');
      }

      const latest = await Event.findOne(filter)
        .sort({ timestamp: -1 })
        .lean();
      recentEvents[src] = latest || null;
    }

    res.json(recentEvents);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

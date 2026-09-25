const express = require('express');
const router = express.Router();
const FeedStatus = require('../models/FeedStatus');
const CITIES = require('../config/cities');

// GET /api/feeds - Return raw feed statuses list
router.get('/feeds', async (req, res, next) => {
  try {
    const feeds = await FeedStatus.find().lean();
    res.json(feeds);
  } catch (error) {
    next(error);
  }
});

// GET /api/feed-status - Structured diagnostic feed health endpoint (Phase 3)
router.get('/feed-status', async (req, res, next) => {
  try {
    const feedDocs = await FeedStatus.find().lean();

    const cityBreakdown = {};
    for (const cityObj of CITIES) {
      const cityName = cityObj.name;
      const cityFeeds = feedDocs.filter(f => f.city === cityName);

      cityBreakdown[cityName] = {
        city: cityName,
        coordinates: { latitude: cityObj.latitude, longitude: cityObj.longitude },
        feeds: cityFeeds.map(f => ({
          source: f.source,
          status: f.status,
          isSynthetic: f.isSynthetic,
          lastSuccessfulFetch: f.lastSuccessfulFetch,
          lastSourceTimestamp: f.lastSourceTimestamp,
          lastAttempt: f.lastAttempt,
          reasonCode: f.reasonCode || null,
          lastError: f.lastError || f.error || null,
          recordsReceived: f.recordsReceived || 0,
          recordsAccepted: f.recordsAccepted || 0,
          recordsRejected: f.recordsRejected || 0,
          details: f.details || {}
        }))
      };
    }

    res.json({
      timestamp: new Date().toISOString(),
      supportedCities: CITIES.map(c => c.name),
      feedStatus: cityBreakdown,
      raw: feedDocs
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;


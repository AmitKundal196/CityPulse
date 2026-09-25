const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const FeedStatus = require('../models/FeedStatus');
const CITIES = require('../config/cities');

// GET /api/system/status
router.get('/system/status', async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    const feedDocs = await FeedStatus.find().lean();

    const defaultSources = ['weather', 'air_quality', 'traffic', 'complaint', 'transit'];
    const citiesStatusMap = {};

    for (const cityObj of CITIES) {
      const cityName = cityObj.name;
      citiesStatusMap[cityName] = {};

      for (const src of defaultSources) {
        const match = feedDocs.find(f => f.city === cityName && f.source === src);
        citiesStatusMap[cityName][src] = match ? match.status : 'NOT_CONFIGURED';
      }
    }

    res.json({
      backend: 'online',
      database: isDbConnected ? 'connected' : 'disconnected',
      cities: citiesStatusMap
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/system/refresh - Trigger manual ingestion cycle for all active cities
router.post('/system/refresh', async (req, res, next) => {
  try {
    const ingestionManager = require('../services/ingestionManager');
    const result = await ingestionManager.refreshNow();
    res.json({
      success: true,
      message: 'System ingestion cycle executed successfully',
      timestamp: result.timestamp
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

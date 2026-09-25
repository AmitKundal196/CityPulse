const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FeedStatus = require('../models/FeedStatus');
const CITIES = require('../config/cities');

// GET /api/health - Production-grade diagnostic health check
router.get('/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';

    // Quick aggregation of feed health
    const feeds = await FeedStatus.find()
      .select('city source status lastSuccessfulFetch isSynthetic -_id')
      .lean();

    const liveCount = feeds.filter(f => f.status === 'LIVE').length;
    const staleCount = feeds.filter(f => f.status === 'STALE').length;
    const offlineCount = feeds.filter(f => f.status === 'OFFLINE').length;
    const simulatedCount = feeds.filter(f => f.status === 'SIMULATED').length;

    const overallStatus = dbStatus === 'connected' && offlineCount === 0 ? 'ok' : 'degraded';

    res.json({
      status: overallStatus,
      database: dbStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      supportedCities: CITIES.map(c => c.name),
      feedHealth: {
        total: feeds.length,
        live: liveCount,
        stale: staleCount,
        simulated: simulatedCount,
        offline: offlineCount
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'error',
      error: 'Internal health verification error',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;

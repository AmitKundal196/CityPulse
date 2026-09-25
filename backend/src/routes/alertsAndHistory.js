const express = require('express');
const router = express.Router();
const historicalAndAlertService = require('../services/historicalAndAlertService');
const CITIES = require('../config/cities');
const { validateCity, validateQueryParams } = require('../middleware/validateInput');

/**
 * GET /api/trends
 * Query: ?city=Delhi&window=6
 */
router.get('/trends', validateCity, validateQueryParams, async (req, res, next) => {
  try {
    const { city, window } = req.query;
    const windowHours = parseInt(window, 10) || 6;

    if (city && city.toLowerCase() !== 'all') {
      const trend = await historicalAndAlertService.calculateTrends(city, windowHours);
      return res.json({
        city,
        generatedAt: new Date().toISOString(),
        trends: trend
      });
    }

    // Evaluate trends across all supported cities
    const cityTrends = {};
    for (const c of CITIES) {
      cityTrends[c.name] = await historicalAndAlertService.calculateTrends(c.name, windowHours);
    }

    return res.json({
      city: 'ALL',
      generatedAt: new Date().toISOString(),
      supportedCities: CITIES.map(c => c.name),
      trends: cityTrends
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/alerts
 * Query: ?city=Delhi&limit=50
 */
router.get('/alerts', validateCity, validateQueryParams, async (req, res, next) => {
  try {
    const { city, limit } = req.query;
    const parsedLimit = Math.min(parseInt(limit, 10) || 50, 200);

    // Evaluate current alerts for requested cities
    if (city && city.toLowerCase() !== 'all') {
      await historicalAndAlertService.evaluateAlertsForCity(city);
    } else {
      for (const c of CITIES) {
        await historicalAndAlertService.evaluateAlertsForCity(c.name);
      }
    }

    const [activeAlerts, history] = await Promise.all([
      historicalAndAlertService.getActiveAlerts(city),
      historicalAndAlertService.getAlertHistory(city, parsedLimit)
    ]);

    return res.json({
      city: city || 'ALL',
      generatedAt: new Date().toISOString(),
      activeCount: activeAlerts.length,
      historyCount: history.length,
      activeAlerts,
      history
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/history
 * Query: ?city=Delhi&window=24
 */
router.get('/history', validateCity, validateQueryParams, async (req, res, next) => {
  try {
    const { city, window } = req.query;
    const cityName = city && city.toLowerCase() !== 'all' ? city : 'Delhi';
    const windowHours = parseInt(window, 10) || 24;

    const historyResult = await historicalAndAlertService.getHistoricalObservations(cityName, windowHours);

    return res.json({
      generatedAt: new Date().toISOString(),
      ...historyResult
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

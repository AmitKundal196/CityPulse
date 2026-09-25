const express = require('express');
const router = express.Router();
const intelligenceService = require('../services/intelligenceService');
const CITIES = require('../config/cities');
const { validateCity } = require('../middleware/validateInput');

/**
 * GET /api/insights
 * Query params: ?city=Delhi
 */
router.get('/insights', validateCity, async (req, res, next) => {
  try {
    const { city } = req.query;

    if (city) {
      // Analyze city dynamically to ensure up-to-date insights
      await intelligenceService.analyzeCity(city);
      const cityInsights = await intelligenceService.getInsights(city);

      return res.json({
        city,
        generatedAt: new Date().toISOString(),
        insights: cityInsights
      });
    }

    // If no city specified, analyze all supported cities
    for (const cityObj of CITIES) {
      await intelligenceService.analyzeCity(cityObj.name);
    }

    const allInsights = await intelligenceService.getInsights();

    return res.json({
      city: 'ALL',
      generatedAt: new Date().toISOString(),
      supportedCities: CITIES.map(c => c.name),
      count: allInsights.length,
      insights: allInsights
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

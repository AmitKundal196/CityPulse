const express = require('express');
const router = express.Router();
const CITIES = require('../config/cities');

// GET /api/cities - List all configured demo cities
router.get('/cities', (req, res) => {
  res.json(CITIES);
});

module.exports = router;

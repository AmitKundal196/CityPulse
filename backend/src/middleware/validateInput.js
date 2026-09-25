const CITIES = require('../config/cities');

const SUPPORTED_CITY_NAMES = CITIES.map(c => c.name.toLowerCase());

/**
 * Validates city parameter safely.
 * Allows 'all' or any supported city (case-insensitive).
 */
function validateCity(req, res, next) {
  const city = req.query.city || req.params.city;
  if (!city) return next();

  if (typeof city !== 'string' || city.trim().length === 0 || city.length > 50) {
    return res.status(400).json({
      success: false,
      error: 'Invalid city parameter: must be a non-empty string under 50 characters',
      code: 'INVALID_CITY'
    });
  }

  const cleanCity = city.trim().toLowerCase();
  if (cleanCity === 'all') return next();

  const isSupported = SUPPORTED_CITY_NAMES.includes(cleanCity);
  if (!isSupported) {
    return res.status(400).json({
      success: false,
      error: `Unsupported city '${city}'. Supported cities: ${CITIES.map(c => c.name).join(', ')}`,
      code: 'UNSUPPORTED_CITY'
    });
  }

  next();
}

/**
 * Validates pagination and numerical parameters safely.
 */
function validateQueryParams(req, res, next) {
  const { limit, window, page, latitude, longitude, radius } = req.query;

  if (limit !== undefined) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 200) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter: must be an integer between 1 and 200',
        code: 'INVALID_LIMIT'
      });
    }
  }

  if (window !== undefined) {
    const parsedWindow = parseInt(window, 10);
    if (isNaN(parsedWindow) || parsedWindow <= 0 || parsedWindow > 168) {
      return res.status(400).json({
        success: false,
        error: 'Invalid window parameter: must be an integer between 1 and 168 hours',
        code: 'INVALID_WINDOW'
      });
    }
  }

  if (page !== undefined) {
    const parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page parameter: must be a positive integer',
        code: 'INVALID_PAGE'
      });
    }
  }

  if (latitude !== undefined) {
    const lat = parseFloat(latitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        error: 'Invalid latitude parameter: must be a number between -90 and 90',
        code: 'INVALID_LATITUDE'
      });
    }
  }

  if (longitude !== undefined) {
    const lon = parseFloat(longitude);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        error: 'Invalid longitude parameter: must be a number between -180 and 180',
        code: 'INVALID_LONGITUDE'
      });
    }
  }

  if (radius !== undefined) {
    const rad = parseFloat(radius);
    if (isNaN(rad) || rad <= 0 || rad > 500) {
      return res.status(400).json({
        success: false,
        error: 'Invalid radius parameter: must be a positive number under 500 km',
        code: 'INVALID_RADIUS'
      });
    }
  }

  next();
}

module.exports = {
  validateCity,
  validateQueryParams
};

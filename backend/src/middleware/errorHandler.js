/**
 * Centralized Production Error Handling Middleware
 * Suppresses internal stack traces from client responses
 * Provides standardized, predictable error contracts.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const isClientError = statusCode >= 400 && statusCode < 500;

  // Log internally with context
  console.error(`[Server Error][${req.method} ${req.originalUrl}] Status: ${statusCode} - ${err.message}`);
  if (statusCode >= 500) {
    console.error(err.stack || err);
  }

  // Safe client response
  res.status(statusCode).json({
    success: false,
    error: isClientError ? err.message : 'An internal server error occurred',
    code: err.code || (isClientError ? 'INVALID_REQUEST' : 'INTERNAL_SERVER_ERROR'),
    timestamp: new Date().toISOString()
  });
};

module.exports = errorHandler;

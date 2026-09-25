const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const connectDB = require('./config/db');
const healthRouter = require('./routes/health');
const citiesRouter = require('./routes/cities');
const eventsRouter = require('./routes/events');
const feedsRouter = require('./routes/feeds');
const systemRouter = require('./routes/system');
const insightsRouter = require('./routes/insights');
const alertsAndHistoryRouter = require('./routes/alertsAndHistory');
const complaintsRouter = require('./routes/complaints');
const errorHandler = require('./middleware/errorHandler');
const ingestionManager = require('./services/ingestionManager');

const app = express();

// Security: Disable Express fingerprinting header
app.disable('x-powered-by');

// Security & Resilience: Production-ready CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin serverless rewrites)
    if (!origin) return callback(null, true);
    if (env.nodeEnv !== 'production' || env.corsOrigin === '*' || env.isVercel) {
      return callback(null, true);
    }
    const allowed = env.corsOrigin.split(',').map(o => o.trim());
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

// Middlewares with payload size constraints
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serverless DB Connection Middleware: Ensures MongoDB connection is active for each incoming request
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.warn(`[DB Middleware] Connection attempt warning: ${err.message}`);
  }
  next();
});

// Routes
app.use('/api', healthRouter);
app.use('/api', citiesRouter);
app.use('/api', eventsRouter);
app.use('/api', feedsRouter);
app.use('/api', systemRouter);
app.use('/api', insightsRouter);
app.use('/api', alertsAndHistoryRouter);
app.use('/api', complaintsRouter);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Neighborhood Pulse API Server',
    version: '1.0.0',
    phase: 'Phase 2.1 - Multi-City Live Data Collection',
    healthCheck: '/api/health',
    cities: '/api/cities',
    systemStatus: '/api/system/status',
    events: '/api/events'
  });
});

// Error handling middleware
app.use(errorHandler);

// Standalone server & ingestion manager execution:
// Only call app.listen() and start continuous interval polling during local/container development.
// On Vercel (where process.env.VERCEL is set), Vercel serverless handles requests via the exported app.
if (!env.isVercel) {
  const startServer = async () => {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`[Server] Neighborhood Pulse backend listening on port ${env.port}`);
    });

    // Start multi-city continuous ingestion service
    ingestionManager.start().catch(err => {
      console.error(`[Ingestion Error] Failed to start ingestion manager: ${err.message}`);
    });
  };

  startServer();
} else {
  console.log('[Server] Neighborhood Pulse backend initialized in Vercel serverless environment.');
}

module.exports = app;

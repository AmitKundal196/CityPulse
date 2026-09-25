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
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    if (env.nodeEnv !== 'production' || env.corsOrigin === '*') {
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

// Start server & ingestion manager
const startServer = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`[Server] Neighborhood Pulse backend listening on port ${env.port}`);
  });

  // Start multi-city ingestion service
  ingestionManager.start().catch(err => {
    console.error(`[Ingestion Error] Failed to start ingestion manager: ${err.message}`);
  });
};

startServer();

module.exports = app;

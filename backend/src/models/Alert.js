const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        'AQI_THRESHOLD',
        'RAPID_AQI_CHANGE',
        'PM25_THRESHOLD',
        'WEATHER_ALERT',
        'CROSS_FEED_ALERT',
        'POOR_AIR_DISPERSION'
      ],
      index: true
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'HIGH', 'CRITICAL'],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    unit: {
      type: String,
      default: null,
      trim: true
    },
    timestamp: {
      type: Date,
      required: true,
      index: true
    },
    sourceTimestamp: {
      type: Date,
      default: null
    },
    source: {
      type: String,
      required: true,
      trim: true
    },
    freshnessStatus: {
      type: String,
      enum: ['LIVE', 'STALE'],
      default: 'LIVE'
    },
    isSynthetic: {
      type: Boolean,
      required: true,
      default: false
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'RESOLVED', 'EXPIRED'],
      default: 'ACTIVE',
      index: true
    },
    firstTriggeredAt: {
      type: Date,
      default: Date.now
    },
    lastTriggeredAt: {
      type: Date,
      default: Date.now
    },
    fingerprint: {
      type: String,
      required: true,
      index: true
    },
    evidence: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for city alerts querying and duplicate checking
AlertSchema.index({ city: 1, fingerprint: 1, status: 1 });
AlertSchema.index({ city: 1, timestamp: -1 });
AlertSchema.index({ status: 1, timestamp: -1 });

module.exports = mongoose.model('Alert', AlertSchema);

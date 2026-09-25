const mongoose = require('mongoose');

const FeedStatusSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    source: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    status: {
      type: String,
      enum: ['LIVE', 'STALE', 'DEGRADED', 'OFFLINE', 'SIMULATED', 'NOT_CONFIGURED', 'NO_REPORTS'],
      required: true,
      default: 'NOT_CONFIGURED'
    },
    lastSuccessfulFetch: {
      type: Date,
      default: null
    },
    lastSourceTimestamp: {
      type: Date,
      default: null
    },
    lastAttempt: {
      type: Date,
      default: null
    },
    lastError: {
      type: String,
      default: null
    },
    error: {
      type: String,
      default: null
    },
    reasonCode: {
      type: String,
      enum: [
        'FETCH_ERROR',
        'TIMEOUT',
        'INVALID_RESPONSE',
        'INVALID_DATA',
        'STALE_DATA',
        'SOURCE_UNAVAILABLE',
        'CONFIG_ERROR',
        null
      ],
      default: null
    },
    recordsReceived: {
      type: Number,
      default: 0
    },
    recordsAccepted: {
      type: Number,
      default: 0
    },
    recordsRejected: {
      type: Number,
      default: 0
    },
    isSynthetic: {
      type: Boolean,
      default: false
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index per city and feed source
FeedStatusSchema.index({ city: 1, source: 1 }, { unique: true });

module.exports = mongoose.model('FeedStatus', FeedStatusSchema);

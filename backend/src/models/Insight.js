const mongoose = require('mongoose');

const InsightSchema = new mongoose.Schema(
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
      trim: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
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
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    sourceTimestamp: {
      type: Date,
      default: null
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    sources: {
      type: [String],
      required: true
    },
    evidence: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    confidence: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true
    },
    freshnessStatus: {
      type: String,
      enum: ['LIVE', 'STALE', 'PARTIAL'],
      default: 'LIVE'
    },
    isSynthetic: {
      type: Boolean,
      required: true,
      default: false
    },
    fingerprint: {
      type: String,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for deduplication and city querying
InsightSchema.index({ city: 1, fingerprint: 1, createdAt: -1 });
InsightSchema.index({ city: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('Insight', InsightSchema);

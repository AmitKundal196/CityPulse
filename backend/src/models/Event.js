const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
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
    eventType: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },
    sourceTimestamp: {
      type: Date,
      default: null,
      index: true
    },
    ingestedAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    zone: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical', 'info', null],
      default: 'info'
    },
    value: {
      type: Number,
      default: null
    },
    unit: {
      type: String,
      default: null,
      trim: true
    },
    status: {
      type: String,
      enum: ['LIVE', 'STALE', 'OFFLINE', 'NOT_CONFIGURED', 'SIMULATED'],
      default: 'LIVE'
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isSynthetic: {
      type: Boolean,
      required: true,
      default: false
    },
    synthetic: {
      type: Boolean,
      default: false
    },
    isReal: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient multi-city & source queries
EventSchema.index({ city: 1, timestamp: -1 });
EventSchema.index({ city: 1, source: 1, timestamp: -1 });
EventSchema.index({ city: 1, zone: 1, timestamp: -1 });
EventSchema.index({ city: 1, eventType: 1, timestamp: -1 });
EventSchema.index({ city: 1, isSynthetic: 1, timestamp: -1 });

module.exports = mongoose.model('Event', EventSchema);

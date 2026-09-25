const mongoose = require('mongoose');

const COMPLAINT_CATEGORIES = [
  'Road Damage',
  'Garbage / Waste',
  'Streetlight',
  'Water Supply',
  'Drainage / Sewage',
  'Traffic Signal',
  'Public Infrastructure',
  'Public Safety',
  'Other'
];

const COMPLAINT_STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'];

const ComplaintSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: COMPLAINT_CATEGORIES,
        message: 'Invalid complaint category'
      },
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [5, 'Description must be at least 5 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    location: {
      lat: {
        type: Number,
        required: [true, 'Latitude is required'],
        min: [-90, 'Latitude must be >= -90'],
        max: [90, 'Latitude must be <= 90']
      },
      lng: {
        type: Number,
        required: [true, 'Longitude is required'],
        min: [-180, 'Longitude must be >= -180'],
        max: [180, 'Longitude must be <= 180']
      }
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    imageUrl: {
      type: String,
      trim: true,
      default: null
    },
    status: {
      type: String,
      enum: {
        values: COMPLAINT_STATUSES,
        message: 'Invalid status'
      },
      default: 'OPEN',
      index: true
    },
    zone: {
      type: String,
      trim: true,
      default: 'B2',
      index: true
    },
    source: {
      type: String,
      enum: ['citizen', 'demo', 'CITIZEN'],
      default: 'citizen',
      index: true
    },
    synthetic: {
      type: Boolean,
      default: false,
      index: true
    },
    isReal: {
      type: Boolean,
      default: true
    },
    isSynthetic: {
      type: Boolean,
      default: false,
      index: true
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolvedBy: {
      type: String,
      trim: true,
      default: null
    },
    resolutionNote: {
      type: String,
      trim: true,
      default: null
    },
    history: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: String, default: 'system' },
        note: { type: String, default: '' }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes for query optimization
ComplaintSchema.index({ city: 1, status: 1, createdAt: -1 });
ComplaintSchema.index({ city: 1, category: 1, createdAt: -1 });
ComplaintSchema.index({ createdAt: -1 });

module.exports = {
  Complaint: mongoose.model('Complaint', ComplaintSchema),
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES
};

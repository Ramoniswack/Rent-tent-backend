const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor'],
      default: 'editor'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'accepted'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['planning', 'traveling', 'completed'],
    default: 'planning'
  },
  destination: {
    type: String,
    default: 'Nepal'
  },
  country: {
    type: String,
    default: 'Nepal'
  },
  currency: {
    type: String,
    default: 'NPR'
  },
  imageUrl: {
    type: String
  },
  lat: {
    type: Number
  },
  lng: {
    type: Number
  },
  budget: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Index for efficient user queries
tripSchema.index({ userId: 1 });

module.exports = mongoose.model('Trip', tripSchema);

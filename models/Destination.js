const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  activity: {
    type: String,
    required: true,
    trim: true
  },
  time: {
    type: Date,
    required: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['planning', 'traveling', 'completed'],
    default: 'planning'
  }
}, {
  timestamps: true
});

// Index for efficient trip queries
destinationSchema.index({ tripId: 1 });

module.exports = mongoose.model('Destination', destinationSchema);

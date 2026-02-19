const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'created_trip',
      'updated_trip',
      'added_destination',
      'removed_destination',
      'added_expense',
      'removed_expense',
      'invited_user',
      'removed_user',
      'changed_status'
    ]
  },
  details: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
activitySchema.index({ tripId: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);

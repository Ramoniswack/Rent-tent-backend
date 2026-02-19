const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user1Liked: {
    type: Boolean,
    default: false
  },
  user2Liked: {
    type: Boolean,
    default: false
  },
  matched: {
    type: Boolean,
    default: false
  },
  matchedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure unique pair (regardless of order)
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Helper method to check if both users liked each other
matchSchema.methods.checkMatch = function() {
  if (this.user1Liked && this.user2Liked && !this.matched) {
    this.matched = true;
    this.matchedAt = new Date();
    return true;
  }
  return false;
};

module.exports = mongoose.model('Match', matchSchema);

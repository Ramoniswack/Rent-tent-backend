const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  // Always store user IDs in sorted order (user1 < user2)
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
  // Individual user statuses
  user1Status: {
    type: String,
    enum: ['none', 'like', 'pass'],
    default: 'none'
  },
  user2Status: {
    type: String,
    enum: ['none', 'like', 'pass'],
    default: 'none'
  },
  // Legacy fields for backward compatibility
  user1Liked: {
    type: Boolean,
    default: false
  },
  user2Liked: {
    type: Boolean,
    default: false
  },
  // Match status
  matched: {
    type: Boolean,
    default: false
  },
  matchedAt: {
    type: Date
  },
  // User-specific settings
  user1Settings: {
    isPinned: { type: Boolean, default: false },
    nickname: { type: String, default: '' },
    isBlocked: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false }
  },
  user2Settings: {
    isPinned: { type: Boolean, default: false },
    nickname: { type: String, default: '' },
    isBlocked: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Ensure unique pair (regardless of order)
matchSchema.index({ user1: 1, user2: 1 }, { unique: true });

// Helper method to check if both users liked each other
matchSchema.methods.checkMatch = function() {
  // Check both new status fields and legacy liked fields
  const bothLiked = (this.user1Status === 'like' && this.user2Status === 'like') ||
                    (this.user1Liked && this.user2Liked);
  
  if (bothLiked && !this.matched) {
    this.matched = true;
    this.matchedAt = new Date();
    return true;
  }
  return false;
};

// Static method to get or create match with sorted user IDs
matchSchema.statics.getOrCreateMatch = async function(userId1, userId2) {
  const [user1, user2] = [userId1.toString(), userId2.toString()].sort();
  
  let match = await this.findOne({ user1, user2 });
  
  if (!match) {
    match = await this.create({ user1, user2 });
  }
  
  return match;
};

module.exports = mongoose.model('Match', matchSchema);

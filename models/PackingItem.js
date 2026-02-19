const mongoose = require('mongoose');

const packingItemSchema = new mongoose.Schema({
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['clothing', 'gear', 'documents', 'toiletries', 'electronics', 'medical', 'food', 'other'],
    default: 'other'
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  isPacked: {
    type: Boolean,
    default: false
  },
  isEssential: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  packedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  packedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient trip queries
packingItemSchema.index({ tripId: 1 });
packingItemSchema.index({ category: 1 });

module.exports = mongoose.model('PackingItem', packingItemSchema);

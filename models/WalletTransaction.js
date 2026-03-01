const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['recharge', 'deduction', 'refund'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['esewa', 'manual', 'system'],
    default: 'system'
  },
  // eSewa payment details
  esewaDetails: {
    transactionUuid: {
      type: String,
      unique: true,
      sparse: true
    },
    transactionCode: String,
    refId: String,
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETE', 'FAILED', 'CANCELED', 'REFUNDED', 'AMBIGUOUS', 'NOT_FOUND']
    },
    totalAmount: Number,
    verifiedAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
walletTransactionSchema.index({ user: 1, createdAt: -1 });
// Note: esewaDetails.transactionUuid already has unique index from schema definition
walletTransactionSchema.index({ status: 1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);

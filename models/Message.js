const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  imagePublicId: {
    type: String,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  type: {
    type: String,
    enum: ['text', 'image'],
    default: 'text'
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Client-side nonce for preventing duplicate messages during retries
  clientSideId: {
    type: String,
    required: true,
    index: true
  },
  // Sequence number for maintaining exact order within same timestamp
  sequenceNumber: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for faster queries with proper sorting
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1, sequenceNumber: -1 });
messageSchema.index({ receiver: 1, read: 1 });
messageSchema.index({ clientSideId: 1 }, { unique: true });

// Pre-save middleware to generate sequence number
messageSchema.pre('save', async function(next) {
  if (this.isNew && !this.sequenceNumber) {
    // Get the highest sequence number for messages created in the same second
    const sameTimestamp = new Date(this.createdAt);
    sameTimestamp.setMilliseconds(0); // Round to nearest second
    
    const nextSecond = new Date(sameTimestamp);
    nextSecond.setSeconds(nextSecond.getSeconds() + 1);
    
    const lastMessage = await this.constructor.findOne({
      createdAt: {
        $gte: sameTimestamp,
        $lt: nextSecond
      }
    }).sort({ sequenceNumber: -1 });
    
    this.sequenceNumber = lastMessage ? lastMessage.sequenceNumber + 1 : 0;
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'message',           // New message received
      'match',             // New match
      'like',              // Someone liked you
      'booking_request',   // Gear rental booking request
      'booking_accepted',  // Booking accepted
      'booking_rejected',  // Booking rejected
      'booking_cancelled', // Booking cancelled
      'review',            // New review received
      'trip_invite',       // Trip invitation
      'trip_update',       // Trip updated
      'system'             // System notification
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  link: {
    type: String
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create and emit notification
notificationSchema.statics.createAndEmit = async function(notificationData, io) {
  const notification = await this.create(notificationData);
  const populatedNotification = await this.findById(notification._id)
    .populate('sender', 'name profilePicture username')
    .populate('recipient', 'name');

  // Emit via Socket.io if io instance is provided
  if (io) {
    io.to(`user:${notificationData.recipient}`).emit('notification:new', populatedNotification);
  }

  return populatedNotification;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ recipient: userId, read: false });
};

module.exports = mongoose.model('Notification', notificationSchema);

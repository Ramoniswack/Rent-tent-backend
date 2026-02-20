const Notification = require('../models/Notification');
const User = require('../models/User');
const notificationService = require('./notificationService');

// Helper to get io instance
let ioInstance = null;
const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => ioInstance;

// Create and send notification
const createNotification = async (data) => {
  try {
    const { recipient, sender, type, title, message, link, data: extraData } = data;

    // Create notification in database
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
      data: extraData || {}
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name profilePicture username')
      .populate('recipient', 'name');

    // Send via Socket.io
    const io = getIO();
    if (io) {
      io.to(`user:${recipient}`).emit('notification:new', populatedNotification);
      
      // Update unread count
      const unreadCount = await Notification.getUnreadCount(recipient);
      io.to(`user:${recipient}`).emit('notification:count', unreadCount);
    }

    // Send push notification
    try {
      await notificationService.sendToUser(recipient, {
        title,
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        data: {
          url: link || '/',
          notificationId: notification._id.toString(),
          type
        }
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }

    return populatedNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Notification type helpers
const notifyNewMessage = async (senderId, recipientId, messageText) => {
  const sender = await User.findById(senderId);
  const preview = messageText ? (messageText.length > 50 ? messageText.substring(0, 50) + '...' : messageText) : '📷 Image';
  
  return createNotification({
    recipient: recipientId,
    sender: senderId,
    type: 'message',
    title: `New message from ${sender.name}`,
    message: preview,
    link: '/messages'
  });
};

const notifyNewMatch = async (user1Id, user2Id) => {
  const user1 = await User.findById(user1Id);
  const user2 = await User.findById(user2Id);
  
  // Notify user1
  await createNotification({
    recipient: user1Id,
    sender: user2Id,
    type: 'match',
    title: 'New Match!',
    message: `You matched with ${user2.name}`,
    link: '/messages'
  });
  
  // Notify user2
  await createNotification({
    recipient: user2Id,
    sender: user1Id,
    type: 'match',
    title: 'New Match!',
    message: `You matched with ${user1.name}`,
    link: '/messages'
  });
};

const notifyLike = async (likerId, likedUserId) => {
  const liker = await User.findById(likerId);
  
  return createNotification({
    recipient: likedUserId,
    sender: likerId,
    type: 'like',
    title: 'Someone likes you!',
    message: `${liker.name} liked your profile`,
    link: '/match'
  });
};

const notifyBookingRequest = async (ownerId, renterId, gearId, gearName) => {
  const renter = await User.findById(renterId);
  
  return createNotification({
    recipient: ownerId,
    sender: renterId,
    type: 'booking_request',
    title: 'New Booking Request',
    message: `${renter.name} wants to rent your ${gearName}`,
    link: `/rentals/dashboard`,
    data: { gearId }
  });
};

const notifyBookingAccepted = async (ownerId, renterId, gearName) => {
  const owner = await User.findById(ownerId);
  
  return createNotification({
    recipient: renterId,
    sender: ownerId,
    type: 'booking_accepted',
    title: 'Booking Accepted!',
    message: `${owner.name} accepted your booking request for ${gearName}`,
    link: '/rentals'
  });
};

const notifyBookingRejected = async (ownerId, renterId, gearName) => {
  const owner = await User.findById(ownerId);
  
  return createNotification({
    recipient: renterId,
    sender: ownerId,
    type: 'booking_rejected',
    title: 'Booking Declined',
    message: `${owner.name} declined your booking request for ${gearName}`,
    link: '/rentals'
  });
};

const notifyNewReview = async (reviewerId, reviewedUserId, rating, gearName) => {
  const reviewer = await User.findById(reviewerId);
  
  return createNotification({
    recipient: reviewedUserId,
    sender: reviewerId,
    type: 'review',
    title: 'New Review',
    message: `${reviewer.name} left you a ${rating}-star review for ${gearName}`,
    link: '/account?tab=profile'
  });
};

const notifyTripUpdate = async (updaterId, participantIds, tripName) => {
  const updater = await User.findById(updaterId);
  
  const promises = participantIds.map(participantId => {
    if (participantId.toString() === updaterId.toString()) return null;
    
    return createNotification({
      recipient: participantId,
      sender: updaterId,
      type: 'trip_update',
      title: 'Trip Updated',
      message: `${updater.name} updated ${tripName}`,
      link: '/trips'
    });
  });
  
  await Promise.all(promises.filter(p => p !== null));
};

module.exports = {
  setIO,
  getIO,
  createNotification,
  notifyNewMessage,
  notifyNewMatch,
  notifyLike,
  notifyBookingRequest,
  notifyBookingAccepted,
  notifyBookingRejected,
  notifyNewReview,
  notifyTripUpdate
};

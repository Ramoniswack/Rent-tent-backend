const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get all matches
router.get('/matches', messageController.getMatches);

// Get messages with a specific user
router.get('/:otherUserId', messageController.getMessages);

// Send a message
router.post('/', messageController.sendMessage);

// Create a match
router.post('/matches', messageController.createMatch);

// Mark message as read
router.put('/:messageId/read', messageController.markAsRead);

// Get unread count
router.get('/unread/count', messageController.getUnreadCount);

// Delete single message
router.delete('/message/:messageId', messageController.deleteMessage);

// Delete entire conversation
router.delete('/conversation/:otherUserId', messageController.deleteConversation);

// Block/Unblock user
router.post('/block/:otherUserId', messageController.blockUser);
router.post('/unblock/:otherUserId', messageController.unblockUser);

// Pin/Unpin conversation
router.post('/pin/:otherUserId', messageController.pinConversation);
router.post('/unpin/:otherUserId', messageController.unpinConversation);

// Set nickname
router.post('/nickname/:otherUserId', messageController.setNickname);

// Mute/Unmute conversation
router.post('/mute/:otherUserId', messageController.muteConversation);
router.post('/unmute/:otherUserId', messageController.unmuteConversation);

// Get blocked users
router.get('/blocked', messageController.getBlockedUsers);

module.exports = router;

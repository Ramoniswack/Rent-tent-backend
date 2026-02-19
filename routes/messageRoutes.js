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

module.exports = router;

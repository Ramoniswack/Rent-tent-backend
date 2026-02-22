const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get WebRTC configuration with dynamic TURN credentials from Metered.ca
router.get('/webrtc-config', callController.getWebRTCConfig);

// Debug and admin endpoints
router.get('/test-turn', callController.testTurnCredentials);
router.post('/refresh-turn', callController.refreshTurnCredentials);
router.get('/cache-status', callController.getCacheStatus);

module.exports = router;
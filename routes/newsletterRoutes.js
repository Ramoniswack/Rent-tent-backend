const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe, getSubscribers, getStats } = require('../controllers/newsletterController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public routes
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

// Admin routes
router.get('/subscribers', auth, adminAuth, getSubscribers);
router.get('/stats', auth, adminAuth, getStats);

module.exports = router;

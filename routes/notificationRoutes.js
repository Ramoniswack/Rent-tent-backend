const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const notificationController = require('../controllers/notificationController');

// Notification CRUD operations
router.get('/', auth, notificationController.getNotifications);
router.get('/unread/count', auth, notificationController.getUnreadCount);
router.put('/:notificationId/read', auth, notificationController.markAsRead);
router.put('/read-all', auth, notificationController.markAllAsRead);
router.delete('/:notificationId', auth, notificationController.deleteNotification);
router.delete('/read/all', auth, notificationController.deleteAllRead);
router.post('/create', auth, notificationController.createNotification);

// Register FCM token (mobile)
router.post('/register-mobile', auth, async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const user = await User.findById(req.userId);

    if (!user.fcmTokens.includes(fcmToken)) {
      user.fcmTokens.push(fcmToken);
      await user.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register web push subscription (desktop)
router.post('/register-web', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    const user = await User.findById(req.userId);

    // Remove old subscription with same endpoint
    user.webPushSubscriptions = user.webPushSubscriptions.filter(
      sub => sub.endpoint !== subscription.endpoint
    );

    user.webPushSubscriptions.push(subscription);
    await user.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get VAPID public key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// Update notification preferences
router.patch('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...req.body
    };
    await user.save();
    res.json(user.notificationPreferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notification preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json(user.notificationPreferences || {
      messages: true,
      bookings: true,
      matches: true,
      tripUpdates: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

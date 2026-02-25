const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Discovery and Swiping (New Core Engine)
router.get('/discover', matchController.discover);
router.post('/discover/advanced', matchController.advancedDiscover);
router.post('/swipe', matchController.swipe);

// Like/Pass actions (Legacy - kept for backward compatibility)
router.post('/like', matchController.likeUser);
router.post('/pass', matchController.passUser);

// Get matches and likes
router.get('/', matchController.getMatches);
router.get('/likes', matchController.getLikes);
router.get('/sent', matchController.getSentLikes);
router.get('/interacted', matchController.getInteractedUsers);
router.get('/check/:userId', matchController.checkMatch);

// Reset interactions (clear match history)
router.delete('/reset', matchController.resetInteractions);

// Cancel connection request
router.post('/cancel', matchController.cancelConnection);

module.exports = router;

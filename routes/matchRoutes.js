const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Like/Pass actions
router.post('/like', matchController.likeUser);
router.post('/pass', matchController.passUser);

// Get matches and likes
router.get('/', matchController.getMatches);
router.get('/likes', matchController.getLikes);
router.get('/check/:userId', matchController.checkMatch);

module.exports = router;

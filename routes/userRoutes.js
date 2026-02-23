const express = require('express');
const router = express.Router();
const { 
  getProfile, 
  updateProfile, 
  getAllUsers,
  getUserByUsername,
  checkUsernameAvailability,
  getUserStats,
  followUser,
  unfollowUser,
  getFollowStatus
} = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);
router.get('/all', auth, getAllUsers);
router.get('/profile/:username', auth, getUserByUsername);
router.get('/check-username/:username', checkUsernameAvailability); // Public endpoint for registration
router.get('/stats', auth, getUserStats);
router.post('/follow/:userId', auth, followUser);
router.delete('/unfollow/:userId', auth, unfollowUser);
router.get('/follow-status/:userId', auth, getFollowStatus);

module.exports = router;

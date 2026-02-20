const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllUsers, getUserStats } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);
router.get('/all', auth, getAllUsers);
router.get('/stats', auth, getUserStats);

module.exports = router;

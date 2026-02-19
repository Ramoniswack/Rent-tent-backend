const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getAllUsers } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);
router.get('/all', auth, getAllUsers);

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const profileFieldOptionsController = require('../controllers/profileFieldOptionsController');

// Public routes
router.get('/', profileFieldOptionsController.getAllOptions);
router.get('/:fieldType', profileFieldOptionsController.getOptionsByType);

// Admin routes
router.put('/:fieldType', auth, adminAuth, profileFieldOptionsController.updateOptions);

module.exports = router;

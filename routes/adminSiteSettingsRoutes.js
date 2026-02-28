const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Admin routes
router.get('/:key', auth, adminAuth, siteSettingsController.getSettingByKey);
router.post('/', auth, adminAuth, siteSettingsController.createOrUpdateSetting);
router.put('/:key', auth, adminAuth, siteSettingsController.updateSetting);

module.exports = router;

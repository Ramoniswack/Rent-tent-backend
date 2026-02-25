const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');

// Public routes
router.get('/', siteSettingsController.getAllSettings);
router.get('/:key', siteSettingsController.getSettingByKey);

module.exports = router;

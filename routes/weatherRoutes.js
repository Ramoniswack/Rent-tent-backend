const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const authMiddleware = require('../middleware/auth');

// Weather route requires authentication
router.use(authMiddleware);

router.get('/:city', weatherController.getWeather);

module.exports = router;

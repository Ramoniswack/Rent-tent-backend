const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
const authMiddleware = require('../middleware/auth');

// All destination routes require authentication
router.use(authMiddleware);

router.delete('/:id', destinationController.deleteDestination);
router.patch('/:id', destinationController.updateDestination);

module.exports = router;

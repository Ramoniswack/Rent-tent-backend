const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/auth');

// All wishlist routes require authentication
router.use(authMiddleware);

// Get user's wishlist
router.get('/', wishlistController.getWishlist);

// Check if gear is in wishlist
router.get('/check/:gearId', wishlistController.checkWishlist);

// Add gear to wishlist
router.post('/:gearId', wishlistController.addToWishlist);

// Remove gear from wishlist
router.delete('/:gearId', wishlistController.removeFromWishlist);

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const pageController = require('../controllers/pageController');

// Public routes
router.get('/', pageController.getAllPages);
router.get('/:slug', pageController.getPageBySlug);

// Admin routes
router.post('/', auth, adminAuth, pageController.createPage);
router.patch('/:id', auth, adminAuth, pageController.updatePage);
router.delete('/:id', auth, adminAuth, pageController.deletePage);

module.exports = router;

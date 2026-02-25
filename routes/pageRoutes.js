const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const pageController = require('../controllers/pageController');

// Optional auth middleware - adds user to req if token exists but doesn't require it
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return next();
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    // Token invalid, but that's okay for optional auth
  }
  
  next();
};

// Public routes (with optional auth for admin access)
router.get('/', pageController.getAllPages);
router.get('/:slug', optionalAuth, pageController.getPageBySlug);

// Admin routes
router.post('/', auth, adminAuth, pageController.createPage);
router.patch('/:id', auth, adminAuth, pageController.updatePage);
router.delete('/:id', auth, adminAuth, pageController.deletePage);

module.exports = router;

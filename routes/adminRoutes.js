const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');
const pageController = require('../controllers/pageController');

// All routes require authentication and admin privileges
router.use(auth);
router.use(adminAuth);

// Dashboard stats
router.get('/stats', adminController.getStats);

// User management
router.get('/users', adminController.getUsers);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Trip management
router.get('/trips', adminController.getTrips);
router.delete('/trips/:id', adminController.deleteTrip);

// Gear management
router.get('/gear', adminController.getGear);
router.patch('/gear/:id', adminController.updateGear);
router.delete('/gear/:id', adminController.deleteGear);

// Page management
router.get('/pages', pageController.getAllPages);
router.post('/pages', pageController.createPage);
router.patch('/pages/:id', pageController.updatePage);
router.delete('/pages/:id', pageController.deletePage);
router.put('/pages/about', adminController.updateAboutPage);
router.put('/pages/contact', adminController.updateContactPage);
router.put('/pages/home', adminController.updateHomePage);

module.exports = router;

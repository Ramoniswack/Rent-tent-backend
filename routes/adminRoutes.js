const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const adminController = require('../controllers/adminController');

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

module.exports = router;

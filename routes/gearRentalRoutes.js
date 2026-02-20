const express = require('express');
const router = express.Router();
const gearRentalController = require('../controllers/gearRentalController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/', gearRentalController.getAllGear);
router.get('/:id', gearRentalController.getGearById);
router.get('/:id/reviews', gearRentalController.getGearReviews);
router.get('/:id/unavailable-dates', gearRentalController.getUnavailableDates);

// Protected routes
router.use(authMiddleware);

// Gear management
router.get('/my/listings', gearRentalController.getMyGear);
router.post('/', gearRentalController.createGear);
router.patch('/:id', gearRentalController.updateGear);
router.delete('/:id', gearRentalController.deleteGear);
router.post('/:id/availability', gearRentalController.manageAvailability);

// Booking management
router.post('/bookings', gearRentalController.createBooking);
router.get('/bookings/my-rentals', gearRentalController.getMyBookings);
router.get('/bookings/my-gear', gearRentalController.getGearBookings);
router.patch('/bookings/:id/status', gearRentalController.updateBookingStatus);
router.post('/bookings/:id/review', gearRentalController.addReview);

module.exports = router;

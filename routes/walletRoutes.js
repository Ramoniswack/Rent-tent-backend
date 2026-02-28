const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/auth');

// All wallet routes require authentication
router.use(authMiddleware);

// Get wallet balance
router.get('/', walletController.getWallet);

// eSewa payment routes
router.post('/esewa/initiate', walletController.initiateEsewaPayment);
router.post('/esewa/verify', walletController.verifyEsewaPayment);
router.get('/esewa/status/:transactionUuid', walletController.checkEsewaPaymentStatus);

// Recharge wallet (manual/legacy)
router.post('/recharge', walletController.rechargeWallet);

// Get transaction history
router.get('/transactions', walletController.getTransactions);

// Deduct commission from completed booking
router.post('/deduct-commission', walletController.deductCommission);

// Charge listing fees (admin/cron job) - DEPRECATED
router.post('/charge-listings', walletController.chargeListingFees);

module.exports = router;

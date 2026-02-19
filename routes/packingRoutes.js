const express = require('express');
const router = express.Router();
const packingController = require('../controllers/packingController');
const authMiddleware = require('../middleware/auth');

// All packing routes require authentication
router.use(authMiddleware);

// Packing list routes (nested under trips)
router.get('/:id/packing', packingController.getPackingList);
router.post('/:id/packing', packingController.addPackingItem);
router.post('/:id/packing/template', packingController.addTemplateItems);
router.get('/:id/packing/stats', packingController.getPackingStats);

// Individual packing item routes
router.patch('/packing/:id', packingController.updatePackingItem);
router.delete('/packing/:id', packingController.deletePackingItem);

module.exports = router;

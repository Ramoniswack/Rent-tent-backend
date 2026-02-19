const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const destinationController = require('../controllers/destinationController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Destination routes (nested under trips)
router.get('/:id/destinations', destinationController.getDestinations);
router.post('/:id/destinations', destinationController.createDestination);

// Expense routes (nested under trips)
router.post('/:id/expenses', expenseController.createExpense);
router.get('/:id/expenses', expenseController.getExpenses);
router.get('/:id/expenses/summary', expenseController.getExpenseSummary);

module.exports = router;

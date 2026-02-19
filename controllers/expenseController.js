const Expense = require('../models/Expense');
const Trip = require('../models/Trip');
const mongoose = require('mongoose');

// Helper to check if user has access (owner, collaborator, or public trip for read-only)
const hasAccess = async (tripId, userId) => {
  const trip = await Trip.findOne({
    _id: tripId,
    $or: [
      { userId: userId },
      { 'collaborators.userId': new mongoose.Types.ObjectId(userId) },
      { isPublic: true } // Allow read access for public trips
    ]
  });
  return trip;
};

// Helper to check if user can edit (owner or editor)
const canEdit = async (tripId, userId) => {
  const trip = await Trip.findOne({
    _id: tripId,
    $or: [
      { userId: userId },
      { 
        collaborators: {
          $elemMatch: {
            userId: new mongoose.Types.ObjectId(userId),
            role: 'editor'
          }
        }
      }
    ]
  });
  return trip;
};

// POST /api/trips/:id/expenses - Add an expense to a trip
exports.createExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { item, amount, category } = req.body;

    // Verify edit permission (owner or editor)
    const trip = await canEdit(id, req.userId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const expense = new Expense({
      item,
      amount,
      category,
      tripId: id,
      createdBy: req.userId
    });

    await expense.save();
    
    // Populate createdBy before sending response
    await expense.populate('createdBy', 'name email');
    
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/trips/:id/expenses - Get all expenses for a trip
exports.getExpenses = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify access (owner or collaborator)
    const trip = await hasAccess(id, req.userId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const expenses = await Expense.find({ tripId: id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/trips/:id/expenses/summary - Aggregate total spending for a trip
// This endpoint uses MongoDB aggregation to calculate total expenses by category
// and overall total for the specified trip
exports.getExpenseSummary = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify access (owner or collaborator)
    const trip = await hasAccess(id, req.userId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    // Aggregate expenses by category using MongoDB aggregation pipeline
    const summary = await Expense.aggregate([
      { $match: { tripId: trip._id } },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Calculate overall total
    const overallTotal = summary.reduce((acc, cat) => acc + cat.total, 0);

    res.json({
      tripId: id,
      tripTitle: trip.title,
      overallTotal,
      byCategory: summary.map(cat => ({
        category: cat._id,
        total: cat.total,
        count: cat.count
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/expenses/:id - Delete an expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the expense first
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Verify edit permission (owner or editor)
    const trip = await canEdit(expense.tripId, req.userId);
    if (!trip) {
      return res.status(403).json({ error: 'Unauthorized to delete this expense' });
    }

    await Expense.findByIdAndDelete(id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/expenses/:id - Update an expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { item, amount, category } = req.body;

    // Find the expense first
    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Verify edit permission (owner or editor)
    const trip = await canEdit(expense.tripId, req.userId);
    if (!trip) {
      return res.status(403).json({ error: 'Unauthorized to update this expense' });
    }

    // Update the expense
    expense.item = item || expense.item;
    expense.amount = amount !== undefined ? amount : expense.amount;
    expense.category = category || expense.category;
    
    await expense.save();
    await expense.populate('createdBy', 'name email');
    
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

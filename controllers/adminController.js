const User = require('../models/User');
const Trip = require('../models/Trip');
const GearRental = require('../models/GearRental');
const bcrypt = require('bcryptjs');

// GET /api/admin/stats - Get dashboard statistics
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalTrips, totalGear, activeGear] = await Promise.all([
      User.countDocuments(),
      Trip.countDocuments(),
      GearRental.countDocuments(),
      GearRental.countDocuments({ available: true })
    ]);

    res.json({
      totalUsers,
      totalTrips,
      totalGear,
      activeGear
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/admin/users - Get all users with pagination
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { username: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/admin/users/:id - Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user's trips and gear
    await Promise.all([
      Trip.deleteMany({ userId: id }),
      GearRental.deleteMany({ owner: id })
    ]);

    await User.findByIdAndDelete(id);

    res.json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/admin/users/:id - Update user (including admin status)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, username, isAdmin, password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (username !== undefined) user.username = username;
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
    
    // Update password if provided
    if (password && password.length >= 6) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    const updatedUser = await User.findById(id).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/admin/trips - Get all trips with pagination
exports.getTrips = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { destination: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const [trips, total] = await Promise.all([
      Trip.find(query)
        .populate('userId', 'name email username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Trip.countDocuments(query)
    ]);

    res.json({
      trips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/admin/trips/:id - Delete a trip
exports.deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    await Trip.findByIdAndDelete(id);

    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/admin/gear - Get all gear rentals with pagination
exports.getGear = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const [gear, total] = await Promise.all([
      GearRental.find(query)
        .populate('owner', 'name email username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      GearRental.countDocuments(query)
    ]);

    res.json({
      gear,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/admin/gear/:id - Delete a gear rental
exports.deleteGear = async (req, res) => {
  try {
    const { id } = req.params;

    const gear = await GearRental.findById(id);
    if (!gear) {
      return res.status(404).json({ error: 'Gear not found' });
    }

    await GearRental.findByIdAndDelete(id);

    res.json({ message: 'Gear rental deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/admin/gear/:id - Update gear rental
exports.updateGear = async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.body;

    const gear = await GearRental.findById(id);
    if (!gear) {
      return res.status(404).json({ error: 'Gear not found' });
    }

    if (available !== undefined) {
      gear.available = available;
    }

    await gear.save();

    const updatedGear = await GearRental.findById(id).populate('owner', 'name email username');
    res.json(updatedGear);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// PUT /api/admin/pages/about - Update About page content
exports.updateAboutPage = async (req, res) => {
  try {
    const Page = require('../models/Page');
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const page = await Page.findOneAndUpdate(
      { slug: 'about' },
      { content, updatedAt: new Date(), lastModifiedBy: req.userId },
      { new: true, runValidators: true }
    );

    if (!page) {
      return res.status(404).json({ error: 'About page not found' });
    }

    res.json({ message: 'About page updated successfully', page });
  } catch (error) {
    console.error('Error updating About page:', error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/admin/pages/contact - Update Contact page content
exports.updateContactPage = async (req, res) => {
  try {
    const Page = require('../models/Page');
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const page = await Page.findOneAndUpdate(
      { slug: 'contact' },
      { content, updatedAt: new Date(), lastModifiedBy: req.userId },
      { new: true, runValidators: true }
    );

    if (!page) {
      return res.status(404).json({ error: 'Contact page not found' });
    }

    res.json({ message: 'Contact page updated successfully', page });
  } catch (error) {
    console.error('Error updating Contact page:', error);
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/admin/pages/home - Update Home page content
exports.updateHomePage = async (req, res) => {
  try {
    const Page = require('../models/Page');
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const page = await Page.findOneAndUpdate(
      { slug: 'home' },
      { content, updatedAt: new Date(), lastModifiedBy: req.userId },
      { new: true, runValidators: true }
    );

    if (!page) {
      return res.status(404).json({ error: 'Home page not found' });
    }

    res.json({ message: 'Home page updated successfully', page });
  } catch (error) {
    console.error('Error updating Home page:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/admin/analytics - Get revenue analytics
exports.getAnalytics = async (req, res) => {
  try {
    const RentalBooking = require('../models/RentalBooking');
    const WalletTransaction = require('../models/WalletTransaction');
    
    // Get all completed bookings
    const completedBookings = await RentalBooking.find({ status: 'completed' })
      .populate('renter', 'name')
      .populate('gear', 'title');
    
    // Calculate total revenue from bookings
    const totalBookingRevenue = completedBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    
    // Get commission transactions
    const commissionTransactions = await WalletTransaction.find({ 
      type: 'debit',
      'metadata.reason': 'commission'
    });
    
    const commissionRevenue = commissionTransactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    
    // Get wallet recharge transactions
    const rechargeTransactions = await WalletTransaction.find({ 
      type: 'credit',
      'metadata.paymentMethod': 'esewa'
    });
    
    const walletRecharges = rechargeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    
    // Total revenue
    const totalRevenue = totalBookingRevenue + walletRecharges;
    
    // Get booking counts
    const [totalBookings, activeBookings] = await Promise.all([
      RentalBooking.countDocuments(),
      RentalBooking.countDocuments({ status: { $in: ['confirmed', 'in_use'] } })
    ]);
    
    // Get user and gear counts
    const [totalUsers, totalGear] = await Promise.all([
      User.countDocuments(),
      GearRental.countDocuments()
    ]);
    
    // Calculate growth (mock data for now - you can implement actual comparison with previous period)
    const revenueGrowth = 12.5;
    const bookingsGrowth = 8.3;
    
    // Get monthly revenue for the last 12 months
    const monthlyRevenue = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      const monthBookings = await RentalBooking.find({
        status: 'completed',
        updatedAt: { $gte: monthStart, $lte: monthEnd }
      });
      
      const monthRevenue = monthBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
      
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue
      });
    }
    
    // Get all transactions (commissions and recharges)
    const allCommissions = await WalletTransaction.find({ 
      type: 'debit',
      'metadata.reason': 'commission'
    })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    
    const allRecharges = await WalletTransaction.find({ 
      type: 'credit',
      'metadata.paymentMethod': 'esewa'
    })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });
    
    const recentTransactions = [
      ...allCommissions.map(tx => ({
        date: tx.createdAt,
        type: 'commission',
        userName: tx.userId?.name,
        amount: Math.abs(tx.amount),
        description: tx.metadata?.description || 'Commission deduction'
      })),
      ...allRecharges.map(tx => ({
        date: tx.createdAt,
        type: 'recharge',
        userName: tx.userId?.name,
        amount: tx.amount,
        description: 'Wallet recharge via eSewa'
      }))
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json({
      totalRevenue,
      commissionRevenue,
      walletRecharges,
      totalBookings,
      completedBookings: completedBookings.length,
      activeBookings,
      totalUsers,
      totalGear,
      revenueGrowth,
      bookingsGrowth,
      monthlyRevenue,
      recentTransactions
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
};

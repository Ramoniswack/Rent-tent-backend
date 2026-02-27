const Newsletter = require('../models/Newsletter');
const { sendEmail } = require('../services/emailService');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email, source = 'footer' } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid email address' 
      });
    }

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    
    if (existing) {
      if (existing.active) {
        return res.status(200).json({ 
          success: true, 
          message: 'You are already subscribed to our newsletter!' 
        });
      } else {
        // Reactivate subscription
        existing.active = true;
        existing.subscribedAt = new Date();
        await existing.save();
        
        return res.status(200).json({ 
          success: true, 
          message: 'Welcome back! Your subscription has been reactivated.' 
        });
      }
    }

    // Create new subscription
    const subscription = await Newsletter.create({
      email: email.toLowerCase(),
      source
    });

    // Send welcome email (non-blocking)
    sendEmail(email, 'newsletterWelcome', { email }).catch(err => 
      console.error('Failed to send newsletter welcome email:', err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed! Check your email for confirmation.',
      subscription: {
        email: subscription.email,
        subscribedAt: subscription.subscribedAt
      }
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    if (error.code === 11000) {
      return res.status(200).json({ 
        success: true, 
        message: 'You are already subscribed to our newsletter!' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to subscribe. Please try again later.' 
    });
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const subscription = await Newsletter.findOne({ email: email.toLowerCase() });

    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email not found in our newsletter list' 
      });
    }

    subscription.active = false;
    await subscription.save();

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to unsubscribe. Please try again later.' 
    });
  }
};

// Get all subscribers (admin only)
exports.getSubscribers = async (req, res) => {
  try {
    const { active, page = 1, limit = 50 } = req.query;
    
    const query = {};
    if (active !== undefined) {
      query.active = active === 'true';
    }

    const subscribers = await Newsletter.find(query)
      .sort({ subscribedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Newsletter.countDocuments(query);

    res.json({
      success: true,
      subscribers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch subscribers' 
    });
  }
};

// Get newsletter stats (admin only)
exports.getStats = async (req, res) => {
  try {
    const totalSubscribers = await Newsletter.countDocuments({ active: true });
    const totalUnsubscribed = await Newsletter.countDocuments({ active: false });
    const todaySubscribers = await Newsletter.countDocuments({
      active: true,
      subscribedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });

    const sourceStats = await Newsletter.aggregate([
      { $match: { active: true } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalSubscribers,
        totalUnsubscribed,
        todaySubscribers,
        sourceBreakdown: sourceStats
      }
    });
  } catch (error) {
    console.error('Get newsletter stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch stats' 
    });
  }
};

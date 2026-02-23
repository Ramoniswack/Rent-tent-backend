const User = require('../models/User');

// GET /api/user/profile - Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/user/profile - Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { 
      name, 
      username, 
      profilePicture,
      coverPhoto,
      bio, 
      location, 
      age, 
      gender,
      dateOfBirth,
      coordinates,
      upcomingTrips,
      languages, 
      interests, 
      travelStyle, 
      billingAddress,
      preferences,
      matchPreferences
    } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (username !== undefined) user.username = username;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (coverPhoto !== undefined) user.coverPhoto = coverPhoto;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (coordinates !== undefined) user.coordinates = coordinates;
    if (upcomingTrips !== undefined) user.upcomingTrips = upcomingTrips;
    if (languages !== undefined) user.languages = languages;
    if (interests !== undefined) user.interests = interests;
    if (travelStyle !== undefined) user.travelStyle = travelStyle;
    if (billingAddress !== undefined) user.billingAddress = billingAddress;
    if (preferences !== undefined) user.preferences = preferences;
    if (matchPreferences !== undefined) user.matchPreferences = matchPreferences;

    await user.save();

    // Return user without password
    const updatedUser = await User.findById(req.userId).select('-password');
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/user/all - Get all users for matching (excluding current user)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.userId },
      profilePicture: { $exists: true, $ne: null, $ne: '' },
      name: { $exists: true, $ne: null, $ne: '' }
    })
    .select('-password')
    .limit(50);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/user/profile/:username - Get user profile by username
exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/user/check-username/:username - Check if username is available
exports.checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Validate username format
    if (!username || username.length < 3) {
      return res.json({ available: false, message: 'Username must be at least 3 characters' });
    }
    
    if (username.length > 20) {
      return res.json({ available: false, message: 'Username must be less than 20 characters' });
    }
    
    if (!/^[a-z0-9_]+$/.test(username)) {
      return res.json({ available: false, message: 'Username can only contain lowercase letters, numbers, and underscores' });
    }
    
    // Check if username exists
    const existingUser = await User.findOne({ username });
    
    // If checking own username (authenticated user), allow it
    if (req.userId && existingUser && existingUser._id.toString() === req.userId) {
      return res.json({ available: true, message: 'This is your current username' });
    }
    
    if (existingUser) {
      return res.json({ available: false, message: 'Username is already taken' });
    }
    
    res.json({ available: true, message: 'Username is available' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/user/stats - Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    const Trip = require('../models/Trip');
    const GearRental = require('../models/GearRental');
    const Match = require('../models/Match');
    
    // Get total trips count
    const totalTrips = await Trip.countDocuments({ user: req.userId });
    
    // Get total expenses from all trips
    const tripsWithExpenses = await Trip.find({ user: req.userId }).select('expenses');
    const totalExpenses = tripsWithExpenses.reduce((sum, trip) => {
      if (trip.expenses && Array.isArray(trip.expenses)) {
        return sum + trip.expenses.reduce((tripSum, expense) => tripSum + (expense.amount || 0), 0);
      }
      return sum;
    }, 0);
    
    // Get gear rental stats (both as renter and owner)
    const rentedGear = await GearRental.countDocuments({ 
      renter: req.userId,
      status: { $in: ['pending', 'approved', 'active'] }
    });
    
    const ownedGear = await GearRental.countDocuments({ 
      owner: req.userId 
    });
    
    // Get total connections (mutual matches)
    const totalConnections = await Match.countDocuments({
      $or: [
        { user1: req.userId, matched: true },
        { user2: req.userId, matched: true }
      ]
    });
    
    // Calculate trips this year
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const tripsThisYear = await Trip.countDocuments({ 
      user: req.userId,
      startDate: { $gte: startOfYear }
    });
    
    // Calculate percentage increase
    const lastYear = currentYear - 1;
    const startOfLastYear = new Date(lastYear, 0, 1);
    const endOfLastYear = new Date(lastYear, 11, 31);
    const tripsLastYear = await Trip.countDocuments({ 
      user: req.userId,
      startDate: { $gte: startOfLastYear, $lte: endOfLastYear }
    });
    
    const percentageIncrease = tripsLastYear > 0 
      ? Math.round(((tripsThisYear - tripsLastYear) / tripsLastYear) * 100)
      : tripsThisYear > 0 ? 100 : 0;
    
    res.json({
      totalTrips,
      totalExpenses: Math.round(totalExpenses * 100) / 100, // Round to 2 decimal places
      gearRented: rentedGear,
      gearOwned: ownedGear,
      totalConnections,
      tripsThisYear,
      percentageIncrease
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: error.message });
  }
};


// POST /api/user/follow/:userId - Follow a user
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    if (userId === currentUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Add to following and followers
    currentUser.following.push(userId);
    userToFollow.followers.push(currentUserId);

    await currentUser.save();
    await userToFollow.save();

    res.json({ 
      message: 'Successfully followed user',
      isFollowing: true,
      followerCount: userToFollow.followers.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/user/unfollow/:userId - Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    if (userId === currentUserId) {
      return res.status(400).json({ error: 'You cannot unfollow yourself' });
    }

    const userToUnfollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if not following
    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    // Remove from following and followers
    currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUserId);

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ 
      message: 'Successfully unfollowed user',
      isFollowing: false,
      followerCount: userToUnfollow.followers.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/user/follow-status/:userId - Check if following a user
exports.getFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFollowing = currentUser.following.includes(userId);
    const followerCount = targetUser.followers.length;

    res.json({ 
      isFollowing,
      followerCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

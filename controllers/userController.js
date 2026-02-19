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
    .select('-password -email')
    .limit(50);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

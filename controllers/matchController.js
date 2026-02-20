const Match = require('../models/Match');
const User = require('../models/User');
const mongoose = require('mongoose');

// Discover potential matches with geospatial filtering
exports.discover = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get current user with location
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has geolocation set
    if (!currentUser.geoLocation || !currentUser.geoLocation.coordinates || 
        currentUser.geoLocation.coordinates.length !== 2) {
      return res.status(400).json({ 
        error: 'Location not set. Please update your location in settings.',
        requiresLocation: true
      });
    }

    const [longitude, latitude] = currentUser.geoLocation.coordinates;
    const maxDistance = (currentUser.matchPreferences?.locationRange || 50) * 1000; // Convert km to meters

    // Build match preferences filter
    const matchFilter = {};
    
    // Age range filter
    if (currentUser.matchPreferences?.ageRange && currentUser.matchPreferences.ageRange.length === 2) {
      const [minAge, maxAge] = currentUser.matchPreferences.ageRange;
      matchFilter.age = { 
        $gte: minAge.toString(), 
        $lte: maxAge.toString() 
      };
    }

    // Gender preference filter
    if (currentUser.matchPreferences?.genders && currentUser.matchPreferences.genders.length > 0) {
      matchFilter.gender = { $in: currentUser.matchPreferences.genders };
    }

    // Travel style filter
    if (currentUser.matchPreferences?.travelStyles && currentUser.matchPreferences.travelStyles.length > 0) {
      matchFilter.travelStyle = { $in: currentUser.matchPreferences.travelStyles };
    }

    // Interests filter (at least one common interest)
    if (currentUser.matchPreferences?.interests && currentUser.matchPreferences.interests.length > 0) {
      matchFilter.interests = { $in: currentUser.matchPreferences.interests };
    }

    // Get all users current user has already interacted with
    const existingMatches = await Match.find({
      $or: [
        { user1: userId, user1Status: { $in: ['like', 'pass'] } },
        { user2: userId, user2Status: { $in: ['like', 'pass'] } }
      ]
    }).lean();

    // Extract user IDs to exclude
    const excludedUserIds = existingMatches.map(match => {
      if (match.user1.toString() === userId) {
        return match.user2.toString();
      }
      return match.user1.toString();
    });
    
    // Add current user to excluded list
    excludedUserIds.push(userId);

    // Aggregation pipeline for discovery
    const discoveryPipeline = [
      // Stage 1: Geospatial query
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          distanceField: 'distance',
          maxDistance: maxDistance,
          spherical: true,
          key: 'geoLocation'
        }
      },
      // Stage 2: Exclude already swiped users and current user
      {
        $match: {
          _id: { $nin: excludedUserIds.map(id => new mongoose.Types.ObjectId(id)) },
          'preferences.publicProfile': true, // Only show users with public profiles
          ...matchFilter
        }
      },
      // Stage 3: Project only necessary fields
      {
        $project: {
          name: 1,
          username: 1,
          profilePicture: 1,
          bio: 1,
          age: 1,
          gender: 1,
          location: 1,
          interests: 1,
          travelStyle: 1,
          languages: 1,
          upcomingTrips: 1,
          distance: 1
        }
      },
      // Stage 4: Randomize results
      {
        $sample: { size: 20 }
      }
    ];

    const potentialMatches = await User.aggregate(discoveryPipeline);

    // Format response for mobile frontend
    const formattedMatches = potentialMatches.map(user => ({
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      profilePicture: user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
      bio: user.bio || '',
      age: user.age || 'N/A',
      gender: user.gender || 'N/A',
      location: user.location || 'Unknown',
      distance: Math.round(user.distance / 1000), // Convert to km
      interests: user.interests || [],
      travelStyle: user.travelStyle || '',
      languages: user.languages || [],
      upcomingTrips: user.upcomingTrips || []
    }));

    res.json({
      success: true,
      count: formattedMatches.length,
      profiles: formattedMatches
    });

  } catch (error) {
    console.error('Error in discover:', error);
    res.status(500).json({ 
      error: 'Failed to fetch potential matches',
      message: error.message 
    });
  }
};

// Swipe action (like or pass)
exports.swipe = async (req, res) => {
  try {
    const userId = req.userId;
    const { targetUserId, action } = req.body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ error: 'Invalid target user ID' });
    }

    if (!['like', 'pass'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "like" or "pass"' });
    }

    // Prevent self-swiping
    if (userId === targetUserId) {
      return res.status(400).json({ error: 'Cannot swipe on yourself' });
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    // Sort user IDs to maintain consistency
    const [user1, user2] = [userId, targetUserId].sort();
    const isUser1 = userId === user1;

    // Determine which status field to update
    const statusField = isUser1 ? 'user1Status' : 'user2Status';
    const otherStatusField = isUser1 ? 'user2Status' : 'user1Status';
    
    // Also update legacy liked fields for backward compatibility
    const likedField = isUser1 ? 'user1Liked' : 'user2Liked';

    // Update object
    const updateObj = {
      [statusField]: action,
      [likedField]: action === 'like'
    };

    // Use findOneAndUpdate with upsert to create or update match
    const match = await Match.findOneAndUpdate(
      { user1, user2 },
      { 
        $set: updateObj,
        $setOnInsert: { 
          user1, 
          user2,
          user1Status: isUser1 ? action : 'none',
          user2Status: isUser1 ? 'none' : action
        }
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );

    // Check if both users liked each other
    const bothLiked = match.user1Status === 'like' && match.user2Status === 'like';
    
    if (bothLiked && !match.matched) {
      match.matched = true;
      match.matchedAt = new Date();
      await match.save();
    }

    // Format response
    const response = {
      success: true,
      action,
      matched: match.matched,
      matchId: match._id.toString()
    };

    // If it's a match, include target user info
    if (match.matched && action === 'like') {
      response.matchedUser = {
        id: targetUser._id.toString(),
        name: targetUser.name,
        username: targetUser.username,
        profilePicture: targetUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(targetUser.name)}&background=random`,
        bio: targetUser.bio || ''
      };
    }

    res.json(response);

  } catch (error) {
    console.error('Error in swipe:', error);
    
    // Handle duplicate key error (race condition)
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: 'Match already exists',
        message: 'You have already swiped on this user'
      });
    }

    res.status(500).json({ 
      error: 'Failed to process swipe',
      message: error.message 
    });
  }
};

// POST /api/matches/like - Like a user
exports.likeUser = async (req, res) => {
  try {
    const { likedUserId } = req.body;
    const currentUserId = req.userId;

    if (currentUserId === likedUserId) {
      return res.status(400).json({ error: 'Cannot like yourself' });
    }

    // Check if liked user exists
    const likedUser = await User.findById(likedUserId);
    if (!likedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Ensure consistent ordering (smaller ID first)
    const [user1, user2] = [currentUserId, likedUserId].sort();
    const isUser1 = currentUserId === user1;

    // Find or create match record
    let match = await Match.findOne({ user1, user2 });

    if (!match) {
      match = new Match({
        user1,
        user2,
        user1Liked: isUser1,
        user2Liked: !isUser1
      });
    } else {
      // Update the like status
      if (isUser1) {
        match.user1Liked = true;
      } else {
        match.user2Liked = true;
      }
    }

    // Check if it's a match
    const isMatch = match.checkMatch();
    await match.save();

    res.json({
      liked: true,
      matched: isMatch,
      match: isMatch ? match : null
    });
  } catch (error) {
    console.error('Like user error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/matches/pass - Pass on a user
exports.passUser = async (req, res) => {
  try {
    const { passedUserId } = req.body;
    const currentUserId = req.userId;

    // Ensure consistent ordering
    const [user1, user2] = [currentUserId, passedUserId].sort();
    const isUser1 = currentUserId === user1;

    // Find or create match record
    let match = await Match.findOne({ user1, user2 });

    if (!match) {
      match = new Match({
        user1,
        user2,
        user1Liked: false,
        user2Liked: false
      });
    } else {
      // Update the like status to false
      if (isUser1) {
        match.user1Liked = false;
      } else {
        match.user2Liked = false;
      }
      match.matched = false;
    }

    await match.save();

    res.json({ passed: true });
  } catch (error) {
    console.error('Pass user error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/matches - Get all matches for current user
exports.getMatches = async (req, res) => {
  try {
    const currentUserId = req.userId;

    const matches = await Match.find({
      $or: [
        { user1: currentUserId },
        { user2: currentUserId }
      ],
      matched: true
    })
    .populate('user1', '-password')
    .populate('user2', '-password')
    .sort({ matchedAt: -1 });

    // Format matches to return the other user
    const formattedMatches = matches.map(match => {
      const otherUser = match.user1._id.toString() === currentUserId 
        ? match.user2 
        : match.user1;
      
      return {
        matchId: match._id,
        user: otherUser,
        matchedAt: match.matchedAt
      };
    });

    res.json(formattedMatches);
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/matches/check/:userId - Check if matched with a specific user
exports.checkMatch = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId;

    const [user1, user2] = [currentUserId, userId].sort();

    const match = await Match.findOne({ user1, user2, matched: true });

    res.json({ matched: !!match });
  } catch (error) {
    console.error('Check match error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/matches/likes - Get users who liked current user
exports.getLikes = async (req, res) => {
  try {
    const currentUserId = req.userId;

    const matches = await Match.find({
      $or: [
        { user1: currentUserId, user2Liked: true, user1Liked: false },
        { user2: currentUserId, user1Liked: true, user2Liked: false }
      ]
    })
    .populate('user1', '-password')
    .populate('user2', '-password');

    // Format to return users who liked current user
    const likes = matches.map(match => {
      const otherUser = match.user1._id.toString() === currentUserId 
        ? match.user2 
        : match.user1;
      
      return {
        user: otherUser,
        likedAt: match.createdAt
      };
    });

    res.json(likes);
  } catch (error) {
    console.error('Get likes error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/matches/interacted - Get all user IDs that current user has interacted with (liked or passed)
exports.getInteractedUsers = async (req, res) => {
  try {
    const currentUserId = req.userId;

    const matches = await Match.find({
      $or: [
        { user1: currentUserId },
        { user2: currentUserId }
      ]
    });

    // Extract user IDs that current user has interacted with
    const interactedUserIds = matches.map(match => {
      return match.user1.toString() === currentUserId 
        ? match.user2.toString() 
        : match.user1.toString();
    });

    res.json({ interactedUserIds });
  } catch (error) {
    console.error('Get interacted users error:', error);
    res.status(500).json({ error: error.message });
  }
};

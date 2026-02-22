const Match = require('../models/Match');
const User = require('../models/User');
const mongoose = require('mongoose');

// Discover potential matches with optimized geospatial filtering and database-level scoring
exports.discover = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get current user with location and preferences
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all users current user has already interacted with
    const existingMatches = await Match.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ]
    }).lean();

    // Create a map of user interactions
    const userInteractions = {};
    existingMatches.forEach(match => {
      const isUser1 = match.user1.toString() === userId;
      const otherUserId = isUser1 ? match.user2.toString() : match.user1.toString();
      const myStatus = isUser1 ? match.user1Status : match.user2Status;
      const theirStatus = isUser1 ? match.user2Status : match.user1Status;
      
      userInteractions[otherUserId] = {
        myStatus,
        theirStatus,
        matched: match.matched
      };
    });

    // Only exclude current user and matched users
    const excludedUserIds = [userId];
    existingMatches.forEach(match => {
      if (match.matched) {
        const isUser1 = match.user1.toString() === userId;
        const otherUserId = isUser1 ? match.user2.toString() : match.user1.toString();
        excludedUserIds.push(otherUserId);
      }
    });

    // Get all users except excluded ones
    const allUsers = await User.find({
      _id: { $nin: excludedUserIds.map(id => new mongoose.Types.ObjectId(id)) },
      'preferences.publicProfile': { $ne: false }
    })
    .select('name username profilePicture bio age gender location interests travelStyle languages upcomingTrips')
    .limit(100)
    .lean();

    console.log(`Found ${allUsers.length} potential matches (showing all users)`);

    // Get connection counts for all matched users
    const userIds = allUsers.map(u => u._id);
    const connectionCounts = await Match.aggregate([
      {
        $match: {
          $or: [
            { user1: { $in: userIds }, matched: true },
            { user2: { $in: userIds }, matched: true }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $in: ['$user1', userIds] },
              '$user1',
              '$user2'
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Create a map of userId -> connection count
    const connectionMap = {};
    connectionCounts.forEach(item => {
      connectionMap[item._id.toString()] = item.count;
    });

    // Format response for frontend
    const formattedMatches = allUsers.map(user => {
      const userId = user._id.toString();
      const interaction = userInteractions[userId];
      
      // Determine connection status
      let connectionStatus = 'none';
      if (interaction) {
        if (interaction.matched) {
          connectionStatus = 'connected';
        } else if (interaction.myStatus === 'like') {
          connectionStatus = 'sent';
        } else if (interaction.theirStatus === 'like') {
          connectionStatus = 'pending';
        }
      }
      
      return {
        id: userId,
        name: user.name,
        username: user.username,
        profilePicture: user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
        bio: user.bio || '',
        age: user.age || 'N/A',
        gender: user.gender || 'N/A',
        location: user.location || 'Unknown',
        interests: user.interests || [],
        travelStyle: user.travelStyle || '',
        languages: user.languages || [],
        upcomingTrips: user.upcomingTrips || [],
        totalConnections: connectionMap[userId] || 0,
        connectionStatus: connectionStatus
      };
    });

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

// Advanced Discovery with Match Scoring
exports.advancedDiscover = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Extract and validate parameters
    const {
      longitude,
      latitude,
      maxDistance = 500, // km
      preferredStyles = [],
      preferredInterests = [],
      preferredGender = 'Any',
      ageRange = { min: 18, max: 60 }
    } = req.body;

    // Validate coordinates
    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      return res.status(400).json({ error: 'Invalid coordinates. Longitude and latitude must be numbers.' });
    }

    if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: 'Coordinates out of valid range.' });
    }

    // Validate maxDistance
    if (maxDistance < 1 || maxDistance > 500) {
      return res.status(400).json({ error: 'maxDistance must be between 1 and 500 km.' });
    }

    // Validate age range
    if (!ageRange.min || !ageRange.max || ageRange.min < 18 || ageRange.max > 100 || ageRange.min > ageRange.max) {
      return res.status(400).json({ error: 'Invalid age range. Min must be >= 18, max <= 100, and min <= max.' });
    }

    // Validate gender
    const validGenders = ['Male', 'Female', 'Non-binary', 'Any'];
    if (!validGenders.includes(preferredGender)) {
      return res.status(400).json({ error: 'Invalid gender preference. Must be Male, Female, Non-binary, or Any.' });
    }

    // Convert km to meters for MongoDB
    const maxDistanceMeters = maxDistance * 1000;

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

    // Build hard filters
    const hardFilters = {
      _id: { $nin: excludedUserIds.map(id => new mongoose.Types.ObjectId(id)) },
      'preferences.publicProfile': true
    };

    // Age filter (convert to number for comparison)
    hardFilters.$expr = {
      $and: [
        { $gte: [{ $toInt: '$age' }, ageRange.min] },
        { $lte: [{ $toInt: '$age' }, ageRange.max] }
      ]
    };

    // Gender filter (if not 'Any')
    if (preferredGender !== 'Any') {
      hardFilters.gender = preferredGender;
    }

    // Advanced Aggregation Pipeline
    const advancedPipeline = [
      // Step 1: $geoNear - Geospatial filtering
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          distanceField: 'distance',
          maxDistance: maxDistanceMeters,
          spherical: true,
          key: 'geoLocation',
          query: {
            _id: { $nin: excludedUserIds.map(id => new mongoose.Types.ObjectId(id)) },
            'preferences.publicProfile': true
          }
        }
      },
      
      // Step 2: $match - Hard filters (age and gender)
      {
        $match: hardFilters
      },
      
      // Step 3: $addFields - Calculate match scores
      {
        $addFields: {
          // Style Score: Count matching travel styles
          styleScore: {
            $size: {
              $ifNull: [
                {
                  $setIntersection: [
                    { $ifNull: [{ $cond: [{ $isArray: '$travelStyle' }, '$travelStyle', ['$travelStyle']] }, []] },
                    preferredStyles
                  ]
                },
                []
              ]
            }
          },
          
          // Interest Score: Count matching interests
          interestScore: {
            $size: {
              $ifNull: [
                {
                  $setIntersection: [
                    { $ifNull: ['$interests', []] },
                    preferredInterests
                  ]
                },
                []
              ]
            }
          }
        }
      },
      
      // Step 4: $addFields - Calculate total score
      {
        $addFields: {
          totalScore: {
            $add: ['$styleScore', '$interestScore']
          }
        }
      },
      
      // Step 5: $sort - Sort by score (desc) then distance (asc)
      {
        $sort: {
          totalScore: -1,
          distance: 1
        }
      },
      
      // Step 6: Limit results to 20
      {
        $limit: 20
      },
      
      // Step 7: Project final fields
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
          distance: 1,
          styleScore: 1,
          interestScore: 1,
          totalScore: 1
        }
      }
    ];

    const potentialMatches = await User.aggregate(advancedPipeline);

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
      upcomingTrips: user.upcomingTrips || [],
      matchScore: {
        total: user.totalScore || 0,
        styleScore: user.styleScore || 0,
        interestScore: user.interestScore || 0
      }
    }));

    res.json({
      success: true,
      count: formattedMatches.length,
      profiles: formattedMatches,
      filters: {
        maxDistance,
        preferredStyles,
        preferredInterests,
        preferredGender,
        ageRange
      }
    });

  } catch (error) {
    console.error('Error in advancedDiscover:', error);
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

    // Get connection counts for all matched users
    const userIds = matches.map(match => {
      return match.user1._id.toString() === currentUserId 
        ? match.user2._id 
        : match.user1._id;
    });

    const connectionCounts = await Match.aggregate([
      {
        $match: {
          $or: [
            { user1: { $in: userIds }, matched: true },
            { user2: { $in: userIds }, matched: true }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $in: ['$user1', userIds] },
              '$user1',
              '$user2'
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const connectionMap = {};
    connectionCounts.forEach(item => {
      connectionMap[item._id.toString()] = item.count;
    });

    // Format matches to return the other user
    const formattedMatches = matches.map(match => {
      const otherUser = match.user1._id.toString() === currentUserId 
        ? match.user2 
        : match.user1;
      
      return {
        matchId: match._id,
        user: {
          ...otherUser.toObject(),
          totalConnections: connectionMap[otherUser._id.toString()] || 0
        },
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

    // Get connection counts for all users who liked current user
    const userIds = matches.map(match => {
      return match.user1._id.toString() === currentUserId 
        ? match.user2._id 
        : match.user1._id;
    });

    const connectionCounts = await Match.aggregate([
      {
        $match: {
          $or: [
            { user1: { $in: userIds }, matched: true },
            { user2: { $in: userIds }, matched: true }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $in: ['$user1', userIds] },
              '$user1',
              '$user2'
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const connectionMap = {};
    connectionCounts.forEach(item => {
      connectionMap[item._id.toString()] = item.count;
    });

    // Format to return users who liked current user
    const likes = matches.map(match => {
      const otherUser = match.user1._id.toString() === currentUserId 
        ? match.user2 
        : match.user1;
      
      return {
        user: {
          ...otherUser.toObject(),
          totalConnections: connectionMap[otherUser._id.toString()] || 0
        },
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

// DELETE /api/matches/reset - Reset all interactions for current user (clear match history)
exports.resetInteractions = async (req, res) => {
  try {
    const currentUserId = req.userId;

    // Delete all match records where current user is involved
    const result = await Match.deleteMany({
      $or: [
        { user1: currentUserId },
        { user2: currentUserId }
      ]
    });

    console.log(`Reset interactions for user ${currentUserId}: deleted ${result.deletedCount} matches`);

    res.json({ 
      success: true,
      message: 'Match history cleared successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Reset interactions error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/matches/cancel - Cancel a sent connection request
exports.cancelConnection = async (req, res) => {
  try {
    const userId = req.userId;
    const { targetUserId } = req.body;

    // Validate inputs
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ error: 'Invalid target user ID' });
    }

    // Sort user IDs to maintain consistency
    const [user1, user2] = [userId, targetUserId].sort();
    const isUser1 = userId === user1;

    // Find the match
    const match = await Match.findOne({ user1, user2 });

    if (!match) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    // Check if user has sent a connection (status is 'like')
    const myStatus = isUser1 ? match.user1Status : match.user2Status;
    
    if (myStatus !== 'like') {
      return res.status(400).json({ error: 'No connection request to cancel' });
    }

    // Check if it's already matched
    if (match.matched) {
      return res.status(400).json({ error: 'Cannot cancel a matched connection. Use unmatch instead.' });
    }

    // Delete the match record since it's just a pending connection
    await Match.deleteOne({ user1, user2 });

    console.log(`User ${userId} cancelled connection request to ${targetUserId}`);

    res.json({ 
      success: true,
      message: 'Connection request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel connection error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel connection request',
      message: error.message 
    });
  }
};

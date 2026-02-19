const Match = require('../models/Match');
const User = require('../models/User');

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

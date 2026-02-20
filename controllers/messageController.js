const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

// Get all matches for the current user
exports.getMatches = async (req, res) => {
  try {
    const userId = req.userId;

    // Find all matches where user is involved and matched is true
    const matches = await Match.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ],
      matched: true
    })
    .populate('user1', 'name email profilePicture username')
    .populate('user2', 'name email profilePicture username')
    .lean();

    console.log(`Found ${matches.length} matches for user ${userId}`);

    // For each match, get the other user and last message
    const matchesWithDetails = await Promise.all(
      matches.map(async (match) => {
        try {
          // Get the other user
          const otherUser = match.user1._id.toString() === userId ? match.user2 : match.user1;
          
          if (!otherUser) {
            console.error('Other user not found in match:', match);
            return null;
          }
          
          // Get user-specific settings
          const isUser1 = match.user1._id.toString() === userId;
          const userSettings = isUser1 ? (match.user1Settings || {}) : (match.user2Settings || {});
          
          // Get last message between these users
          const lastMessage = await Message.findOne({
            $or: [
              { sender: userId, receiver: otherUser._id },
              { sender: otherUser._id, receiver: userId }
            ]
          }).sort({ createdAt: -1 }).lean();

          // Count unread messages from other user
          const unreadCount = await Message.countDocuments({
            sender: otherUser._id,
            receiver: userId,
            read: false
          });

          return {
            id: otherUser._id,
            name: userSettings.nickname || otherUser.name,
            username: otherUser.username,
            profilePicture: otherUser.profilePicture,
            imageUrl: otherUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`,
            lastMessage: lastMessage ? (lastMessage.image ? '📷 Image' : lastMessage.text) : 'Start a conversation',
            timestamp: lastMessage ? lastMessage.createdAt : match.matchedAt,
            unread: unreadCount,
            online: false,
            isPinned: userSettings.isPinned || false,
            isMuted: userSettings.isMuted || false,
            isBlocked: userSettings.isBlocked || false
          };
        } catch (err) {
          console.error('Error processing match:', err);
          return null;
        }
      })
    );

    // Filter out null values and sort by pinned first, then most recent message
    const validMatches = matchesWithDetails.filter(m => m !== null);
    validMatches.sort((a, b) => {
      // Pinned conversations first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Then by most recent message
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    res.json(validMatches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches', details: error.message });
  }
};

// Get messages between current user and another user
exports.getMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    // Verify match exists
    const [user1, user2] = [userId, otherUserId].sort();
    const match = await Match.findOne({
      user1,
      user2,
      matched: true
    });

    if (!match) {
      return res.status(403).json({ error: 'You can only message users you have matched with' });
    }

    // Get all messages between these users
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'name profilePicture')
    .populate('receiver', 'name profilePicture')
    .populate('replyTo', 'text sender image')
    .populate('reactions.user', 'name profilePicture');

    // Mark messages as read
    await Message.updateMany(
      { sender: otherUserId, receiver: userId, read: false },
      { read: true }
    );

    const formattedMessages = messages.map(msg => ({
      id: msg._id,
      senderId: msg.sender._id,
      text: msg.text,
      image: msg.image,
      timestamp: msg.createdAt,
      read: msg.read,
      replyTo: msg.replyTo ? {
        id: msg.replyTo._id,
        text: msg.replyTo.text,
        image: msg.replyTo.image,
        senderId: msg.replyTo.sender
      } : null,
      reactions: msg.reactions.map(r => ({
        user: {
          id: r.user._id,
          name: r.user.name,
          profilePicture: r.user.profilePicture
        },
        emoji: r.emoji,
        createdAt: r.createdAt
      }))
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { receiverId, text, replyToId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    // Verify match exists
    const [user1, user2] = [userId, receiverId].sort();
    const match = await Match.findOne({
      user1,
      user2,
      matched: true
    });

    if (!match) {
      return res.status(403).json({ error: 'You can only message users you have matched with' });
    }

    // Verify replyTo message exists if provided
    if (replyToId) {
      const replyToMessage = await Message.findById(replyToId);
      if (!replyToMessage) {
        return res.status(404).json({ error: 'Reply-to message not found' });
      }
    }

    // Create message
    const message = await Message.create({
      sender: userId,
      receiver: receiverId,
      text: text.trim(),
      replyTo: replyToId || null
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture')
      .populate('replyTo', 'text sender image')
      .populate('reactions.user', 'name profilePicture');

    // Send notification to receiver
    try {
      const sender = await User.findById(userId);
      const receiver = await User.findById(receiverId);
      
      if (receiver && receiver.notificationPreferences?.messages !== false) {
        await notificationService.sendToUser(receiverId, {
          title: `New message from ${sender.name}`,
          body: text.substring(0, 100),
          icon: sender.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.name)}&background=random`,
          data: {
            type: 'message',
            senderId: userId,
            url: '/messages'
          }
        });
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
      // Don't fail the message send if notification fails
    }

    res.status(201).json({
      id: populatedMessage._id,
      senderId: populatedMessage.sender._id,
      text: populatedMessage.text,
      timestamp: populatedMessage.createdAt,
      read: populatedMessage.read,
      replyTo: populatedMessage.replyTo ? {
        id: populatedMessage.replyTo._id,
        text: populatedMessage.replyTo.text,
        image: populatedMessage.replyTo.image,
        senderId: populatedMessage.replyTo.sender
      } : null,
      reactions: []
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Create a match (for testing or when users like each other)
exports.createMatch = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.body;

    // Sort user IDs to ensure consistent ordering
    const [user1, user2] = [userId, otherUserId].sort();

    // Check if match already exists
    const existingMatch = await Match.findOne({
      user1,
      user2
    });

    if (existingMatch) {
      return res.status(400).json({ error: 'Match already exists' });
    }

    // Verify other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create match
    const match = await Match.create({
      user1,
      user2,
      user1Liked: true,
      user2Liked: true,
      matched: true,
      matchedAt: new Date()
    });

    const populatedMatch = await Match.findById(match._id)
      .populate('user1', 'name email profilePicture username')
      .populate('user2', 'name email profilePicture username');

    res.status(201).json(populatedMatch);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only receiver can mark as read
    if (message.receiver.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    message.read = true;
    await message.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const unreadCount = await Message.countDocuments({
      receiver: userId,
      read: false
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

// Delete single message
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only sender can delete their message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Delete entire conversation
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    // Delete all messages between these users
    await Message.deleteMany({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    });

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    const [user1, user2] = [userId, otherUserId].sort();
    const match = await Match.findOne({ user1, user2 });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update the appropriate user settings
    if (match.user1.toString() === userId) {
      match.user1Settings.isBlocked = true;
    } else {
      match.user2Settings.isBlocked = true;
    }

    await match.save();

    res.json({ success: true, message: 'User blocked' });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({ error: 'Failed to block user' });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    const [user1, user2] = [userId, otherUserId].sort();
    const match = await Match.findOne({ user1, user2 });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update the appropriate user settings
    if (match.user1.toString() === userId) {
      match.user1Settings.isBlocked = false;
    } else {
      match.user2Settings.isBlocked = false;
    }

    await match.save();

    res.json({ success: true, message: 'User unblocked' });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

// Pin conversation
exports.pinConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    const [user1, user2] = [userId, otherUserId].sort();
    const match = await Match.findOne({ user1, user2 });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update the appropriate user settings
    if (match.user1.toString() === userId) {
      match.user1Settings.isPinned = true;
    } else {
      match.user2Settings.isPinned = true;
    }

    await match.save();

    res.json({ success: true, message: 'Conversation pinned' });
  } catch (error) {
    console.error('Error pinning conversation:', error);
    res.status(500).json({ error: 'Failed to pin conversation' });
  }
};

// Unpin conversation
exports.unpinConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    const [user1, user2] = [userId, otherUserId].sort();
    const match = await Match.findOne({ user1, user2 });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update the appropriate user settings
    if (match.user1.toString() === userId) {
      match.user1Settings.isPinned = false;
    } else {
      match.user2Settings.isPinned = false;
    }

    await match.save();

    res.json({ success: true, message: 'Conversation unpinned' });
  } catch (error) {
    console.error('Error unpinning conversation:', error);
    res.status(500).json({ error: 'Failed to unpin conversation' });
  }
};

// Set nickname
exports.setNickname = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;
    const { nickname } = req.body;

    const [user1, user2] = [userId, otherUserId].sort();
    const match = await Match.findOne({ user1, user2 });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update the appropriate user settings
    if (match.user1.toString() === userId) {
      match.user1Settings.nickname = nickname || '';
    } else {
      match.user2Settings.nickname = nickname || '';
    }

    await match.save();

    res.json({ success: true, message: 'Nickname updated', nickname });
  } catch (error) {
    console.error('Error setting nickname:', error);
    res.status(500).json({ error: 'Failed to set nickname' });
  }
};

// Mute conversation
exports.muteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    const [user1, user2] = [userId, otherUserId].sort();
    const match = await Match.findOne({ user1, user2 });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update the appropriate user settings
    if (match.user1.toString() === userId) {
      match.user1Settings.isMuted = true;
    } else {
      match.user2Settings.isMuted = true;
    }

    await match.save();

    res.json({ success: true, message: 'Conversation muted' });
  } catch (error) {
    console.error('Error muting conversation:', error);
    res.status(500).json({ error: 'Failed to mute conversation' });
  }
};

// Unmute conversation
exports.unmuteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    const [user1, user2] = [userId, otherUserId].sort();
    const match = await Match.findOne({ user1, user2 });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Update the appropriate user settings
    if (match.user1.toString() === userId) {
      match.user1Settings.isMuted = false;
    } else {
      match.user2Settings.isMuted = false;
    }

    await match.save();

    res.json({ success: true, message: 'Conversation unmuted' });
  } catch (error) {
    console.error('Error unmuting conversation:', error);
    res.status(500).json({ error: 'Failed to unmute conversation' });
  }
};

// Get blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.userId;

    // Find all matches where current user has blocked someone
    const matches = await Match.find({
      $or: [
        { user1: userId },
        { user2: userId }
      ]
    })
    .populate('user1', 'name email profilePicture username')
    .populate('user2', 'name email profilePicture username')
    .lean();

    // Filter matches where user has blocked the other person
    const blockedUsers = matches
      .map(match => {
        const isUser1 = match.user1._id.toString() === userId;
        const userSettings = isUser1 ? match.user1Settings : match.user2Settings;
        
        // Check if settings exist and user is blocked
        if (userSettings && userSettings.isBlocked) {
          const otherUser = isUser1 ? match.user2 : match.user1;
          return {
            id: otherUser._id,
            name: otherUser.name,
            username: otherUser.username,
            profilePicture: otherUser.profilePicture,
            imageUrl: otherUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`,
            blockedAt: match.updatedAt
          };
        }
        return null;
      })
      .filter(user => user !== null);

    res.json(blockedUsers);
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({ error: 'Failed to fetch blocked users' });
  }
};

// Unmatch user
exports.unmatchUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    const [user1, user2] = [userId, otherUserId].sort();
    const match = await Match.findOne({ user1, user2 });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Delete all messages between these users
    await Message.deleteMany({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ]
    });

    // Delete the match
    await Match.findByIdAndDelete(match._id);

    res.json({ success: true, message: 'Unmatched successfully' });
  } catch (error) {
    console.error('Error unmatching user:', error);
    res.status(500).json({ error: 'Failed to unmatch user' });
  }
};

// Add reaction to message
exports.addReaction = async (req, res) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.user.toString() === userId && r.emoji === emoji
    );

    if (existingReaction) {
      return res.status(400).json({ error: 'You already reacted with this emoji' });
    }

    // Add reaction
    message.reactions.push({
      user: userId,
      emoji,
      createdAt: new Date()
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('reactions.user', 'name profilePicture');

    res.json({
      success: true,
      reactions: populatedMessage.reactions
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
};

// Remove reaction from message
exports.removeReaction = async (req, res) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Remove reaction
    message.reactions = message.reactions.filter(
      r => !(r.user.toString() === userId && r.emoji === emoji)
    );

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('reactions.user', 'name profilePicture');

    res.json({
      success: true,
      reactions: populatedMessage.reactions
    });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
};

// Clear message notifications when user opens conversation
exports.clearMessageNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    const Notification = require('../models/Notification');

    // Clear all message notifications from this user
    await Notification.updateMany(
      {
        user: userId,
        'data.type': 'message',
        'data.senderId': otherUserId,
        read: false
      },
      {
        read: true
      }
    );

    res.json({ success: true, message: 'Notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
};

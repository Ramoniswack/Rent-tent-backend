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
            name: otherUser.name,
            username: otherUser.username,
            imageUrl: otherUser.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`,
            lastMessage: lastMessage ? (lastMessage.image ? '📷 Image' : lastMessage.text) : 'Start a conversation',
            timestamp: lastMessage ? lastMessage.createdAt : match.matchedAt,
            unread: unreadCount,
            online: false
          };
        } catch (err) {
          console.error('Error processing match:', err);
          return null;
        }
      })
    );

    // Filter out null values and sort by most recent message
    const validMatches = matchesWithDetails.filter(m => m !== null);
    validMatches.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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
    .populate('receiver', 'name profilePicture');

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
      read: msg.read
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
    const { receiverId, text } = req.body;

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

    // Create message
    const message = await Message.create({
      sender: userId,
      receiver: receiverId,
      text: text.trim()
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture');

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
      read: populatedMessage.read
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

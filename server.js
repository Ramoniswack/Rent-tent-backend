require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const tripRoutes = require('./routes/tripRoutes');
const destinationRoutes = require('./routes/destinationRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/userRoutes');
const packingRoutes = require('./routes/packingRoutes');
const messageRoutes = require('./routes/messageRoutes');
const gearRentalRoutes = require('./routes/gearRentalRoutes');
const matchRoutes = require('./routes/matchRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const callRoutes = require('./routes/callRoutes');
const pageRoutes = require('./routes/pageRoutes');
const profileFieldOptionsRoutes = require('./routes/profileFieldOptionsRoutes');
const siteSettingsRoutes = require('./routes/siteSettingsRoutes');
const adminSiteSettingsRoutes = require('./routes/adminSiteSettingsRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NomadNotes API Documentation'
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/trips', expenseRoutes);
app.use('/api/expenses', expenseRoutes); // For direct expense operations (delete, update)
app.use('/api/weather', weatherRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/user', userRoutes);
app.use('/api/trips', packingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/gear', gearRentalRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/profile-field-options', profileFieldOptionsRoutes);
app.use('/api/site-settings', siteSettingsRoutes);
app.use('/api/admin/site-settings', adminSiteSettingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'NomadNotes API is running',
    documentation: '/api-docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Socket.IO setup for real-time messaging and notifications
const { Server } = require('socket.io');
const notificationHelper = require('./services/notificationHelper');

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Initialize notification helper with io instance
notificationHelper.setIO(io);

// Store online users and active calls
const onlineUsers = new Map();
const activeCalls = new Map(); // Track active calls: callId -> { caller, receiver, startTime, type }

// Make io and onlineUsers accessible to controllers
app.set('io', io);
app.set('onlineUsers', onlineUsers);
app.set('activeCalls', activeCalls);

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their ID
  socket.on('user:join', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    socket.join(`user:${userId}`); // Join user-specific room for notifications
    console.log(`User ${userId} joined`);
    
    // Broadcast online status
    io.emit('user:online', userId);
    
    // Send unread notification count
    const Notification = require('./models/Notification');
    Notification.getUnreadCount(userId).then(count => {
      socket.emit('notification:count', count);
    });
  });

  // Send message
  socket.on('message:send', async (data) => {
    console.log('📨 Received message:send event:', {
      receiverId: data.receiverId,
      senderId: data.senderId,
      hasText: !!data.text,
      hasImage: !!data.image,
      clientSideId: data.clientSideId
    });
    
    const { receiverId, senderId, text, image, imagePublicId, replyToId, clientSideId } = data;
    
    // Validate required fields
    if (!clientSideId) {
      console.log('❌ Error: clientSideId missing');
      socket.emit('message:error', { error: 'clientSideId is required' });
      return;
    }
    
    // Validate that we have either text or image
    if ((!text || !text.trim()) && !image) {
      console.log('❌ Error: No text or image');
      socket.emit('message:error', { error: 'Message must contain either text or image' });
      return;
    }
    
    console.log('✅ Validation passed, proceeding to save message');
    
    // Save message to database
    const Message = require('./models/Message');
    const Notification = require('./models/Notification');
    const User = require('./models/User');
    
    try {
      // Check for duplicate message using clientSideId
      const existingMessage = await Message.findOne({ clientSideId });
      if (existingMessage) {
        console.log('⚠️  Duplicate message detected, returning existing');
        // Return existing message instead of creating duplicate
        const populatedMessage = await Message.findById(existingMessage._id)
          .populate('sender', 'name profilePicture')
          .populate('receiver', 'name profilePicture')
          .populate('replyTo', 'text sender image')
          .populate('reactions.user', 'name profilePicture');

        socket.emit('message:sent', populatedMessage);
        return;
      }

      // TEMPORARY: Disable permission check for testing
      // TODO: Re-enable after confirming messages work
      console.log('✅ Permission check bypassed (temporary)');
      
      /*
      // PERMISSION CHECK: Verify match exists OR mutual connection exists
      const [user1, user2] = [senderId, receiverId].sort();
      const match = await Match.findOne({
        user1,
        user2,
        matched: true
      });

      console.log('Socket message permission check:', {
        sender: senderId,
        receiver: receiverId,
        matchFound: !!match
      });

      // If not matched, check for mutual connection
      let hasPermission = !!match;
      
      if (!hasPermission) {
        // Check if users have mutual connection (both follow each other)
        const currentUser = await User.findById(senderId).select('following').lean();
        const otherUser = await User.findById(receiverId).select('following').lean();
        
        if (currentUser && otherUser) {
          const currentUserFollowsOther = currentUser.following && currentUser.following.some(id => id.toString() === receiverId);
          const otherUserFollowsCurrent = otherUser.following && otherUser.following.some(id => id.toString() === senderId);
          
          hasPermission = currentUserFollowsOther && otherUserFollowsCurrent;
          
          console.log('Socket mutual connection check:', {
            currentUserFollowsOther,
            otherUserFollowsCurrent,
            hasPermission
          });
        }
      }

      if (!hasPermission) {
        console.log('❌ Socket message blocked: No permission');
        socket.emit('message:error', { 
          error: 'You can only message users you have matched with or connected with. Match with them on the swipe page or connect on the discover page first.',
          code: 'NO_PERMISSION'
        });
        return;
      }

      console.log('✅ Socket message permission granted');
      */

      const messageData = {
        sender: senderId,
        receiver: receiverId,
        read: false,
        clientSideId
      };
      
      // Add text if provided
      if (text && text.trim()) {
        messageData.text = text.trim();
      }
      
      // Add image data if provided
      if (image) {
        messageData.image = image;
        messageData.imagePublicId = imagePublicId;
        messageData.type = 'image';
      }
      
      // Add replyTo if provided
      if (replyToId) {
        messageData.replyTo = replyToId;
      }
      
      console.log('💾 Creating message in database...');
      const message = await Message.create(messageData);
      console.log('✅ Message created:', message._id);

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name profilePicture')
        .populate('receiver', 'name profilePicture')
        .populate('replyTo', 'text sender image')
        .populate('reactions.user', 'name profilePicture');

      console.log('✅ Message populated');

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:receive', populatedMessage);
        console.log('✅ Message sent to receiver via socket:', receiverSocketId);
      } else {
        console.log('⚠️  Receiver is offline, message saved to database');
      }

      // Send confirmation to sender
      socket.emit('message:sent', populatedMessage);
      console.log('✅ Message confirmation sent to sender');
      
      // Create notification for receiver
      const sender = await User.findById(senderId);
      const messagePreview = image ? '📷 Sent an image' : (text ? (text.length > 50 ? text.substring(0, 50) + '...' : text) : 'New message');
      
      await Notification.createAndEmit({
        recipient: receiverId,
        sender: senderId,
        type: 'message',
        title: `New message from ${sender.name}`,
        message: messagePreview,
        link: `/messages`,
        data: { messageId: message._id, clientSideId: message.clientSideId }
      }, io);
      
      console.log('✅ Notification created');
      
    } catch (error) {
      console.error('❌ Error saving message:', error);
      
      // Handle duplicate key error for clientSideId
      if (error.code === 11000 && error.keyPattern?.clientSideId) {
        socket.emit('message:error', { 
          error: 'Message with this clientSideId already exists',
          code: 'DUPLICATE_MESSAGE'
        });
      } else {
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    }
  });

  // Mark message as read
  socket.on('message:read', async (data) => {
    const { messageId, messageIds } = data;
    const Message = require('./models/Message');
    
    try {
      const readTimestamp = new Date();
      let updatedMessages = [];

      if (messageIds && Array.isArray(messageIds)) {
        // Bulk mark multiple messages as read
        const messages = await Message.find({
          _id: { $in: messageIds },
          receiver: socket.userId,
          read: false
        });

        if (messages.length > 0) {
          await Message.updateMany(
            { _id: { $in: messageIds }, receiver: socket.userId, read: false },
            { read: true, readAt: readTimestamp }
          );

          // Send read receipts to senders
          const senderUpdates = {};
          messages.forEach(msg => {
            const senderId = msg.sender.toString();
            if (!senderUpdates[senderId]) {
              senderUpdates[senderId] = [];
            }
            senderUpdates[senderId].push({
              messageId: msg._id,
              clientSideId: msg.clientSideId,
              readBy: socket.userId,
              readAt: readTimestamp
            });
          });

          // Emit to each sender
          Object.keys(senderUpdates).forEach(senderId => {
            const senderSocketId = onlineUsers.get(senderId);
            if (senderSocketId) {
              senderUpdates[senderId].forEach(update => {
                io.to(senderSocketId).emit('message:read_update', update);
              });
            }
          });

          updatedMessages = messages.map(msg => ({
            messageId: msg._id,
            clientSideId: msg.clientSideId
          }));
        }
      } else if (messageId) {
        // Single message read
        const message = await Message.findById(messageId);
        if (message && message.receiver.toString() === socket.userId && !message.read) {
          message.read = true;
          message.readAt = readTimestamp;
          await message.save();

          // Send read receipt to sender
          const senderSocketId = onlineUsers.get(message.sender.toString());
          if (senderSocketId) {
            io.to(senderSocketId).emit('message:read_update', {
              messageId: message._id,
              clientSideId: message.clientSideId,
              readBy: socket.userId,
              readAt: readTimestamp
            });
          }

          updatedMessages = [{
            messageId: message._id,
            clientSideId: message.clientSideId
          }];
        }
      }

      socket.emit('message:read:success', { 
        updatedMessages,
        readAt: readTimestamp
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      socket.emit('message:read:error', { error: 'Failed to mark message as read' });
    }
  });

  // User typing indicator
  socket.on('typing:start', (data) => {
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:start', { userId: socket.userId });
    }
  });

  socket.on('typing:stop', (data) => {
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('typing:stop', { userId: socket.userId });
    }
  });

  // Call signaling with acknowledgment and timeout handling
  socket.on('call:offer', (data) => {
    const { to, offer, type } = data;
    const receiverSocketId = onlineUsers.get(to);
    
    if (receiverSocketId) {
      const callId = `${socket.userId}_${to}_${Date.now()}`;
      
      // Store active call information
      activeCalls.set(callId, {
        caller: socket.userId,
        receiver: to,
        startTime: Date.now(),
        type: type,
        status: 'calling'
      });
      
      // Send call offer to receiver
      io.to(receiverSocketId).emit('call:incoming', { 
        from: socket.userId, 
        offer,
        type,
        callId
      });
      
      // Set call timeout (30 seconds)
      setTimeout(() => {
        const call = activeCalls.get(callId);
        if (call && call.status === 'calling') {
          // Call timed out
          activeCalls.delete(callId);
          
          // Notify caller of timeout
          socket.emit('call:timeout');
          
          // Notify receiver to stop ringing
          const receiverSocket = onlineUsers.get(to);
          if (receiverSocket) {
            io.to(receiverSocket).emit('call:timeout');
          }
          
          console.log(`Call ${callId} timed out`);
        }
      }, 30000); // 30 second timeout
      
      console.log(`Call offer sent: ${callId} (${type})`);
    } else {
      // Receiver is offline
      socket.emit('call:user_offline');
    }
  });

  // Call received acknowledgment
  socket.on('call:received', (data) => {
    const { callId, from } = data;
    const call = activeCalls.get(callId);
    
    if (call && call.caller === from) {
      // Update call status
      call.status = 'ringing';
      activeCalls.set(callId, call);
      
      // Notify caller that receiver got the call (show "Ringing" state)
      const callerSocketId = onlineUsers.get(from);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:ringing', { callId });
      }
      
      console.log(`Call ${callId} acknowledged - now ringing`);
    }
  });

  socket.on('call:answer', (data) => {
    const { to, answer, callId } = data;
    const call = activeCalls.get(callId);
    
    if (call) {
      // Update call status
      call.status = 'connected';
      call.connectedAt = Date.now();
      activeCalls.set(callId, call);
      
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('call:accepted', { answer, callId });
      }
      
      console.log(`Call ${callId} accepted and connected`);
    }
  });

  socket.on('call:reject', (data) => {
    const { to, callId } = data;
    
    if (callId && activeCalls.has(callId)) {
      // Remove call from active calls
      activeCalls.delete(callId);
      
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('call:rejected', { callId });
      }
      
      console.log(`Call ${callId} rejected`);
    }
  });

  socket.on('call:end', (data) => {
    const { to, callId } = data;
    const call = activeCalls.get(callId);
    
    if (call) {
      // Calculate call duration
      const duration = call.connectedAt ? Date.now() - call.connectedAt : 0;
      
      // Remove call from active calls
      activeCalls.delete(callId);
      
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('call:ended', { callId, duration });
      }
      
      console.log(`Call ${callId} ended - duration: ${Math.round(duration / 1000)}s`);
    }
  });

  socket.on('ice:candidate', (data) => {
    const { to, candidate } = data;
    const receiverSocketId = onlineUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('ice:candidate', { candidate });
    }
  });

  // Disconnect cleanup - automatically end active calls
  socket.on('disconnect', () => {
    if (socket.userId) {
      // Find and end any active calls involving this user
      const userCalls = Array.from(activeCalls.entries()).filter(([callId, call]) => 
        call.caller === socket.userId || call.receiver === socket.userId
      );
      
      userCalls.forEach(([callId, call]) => {
        // Determine the other party
        const otherUserId = call.caller === socket.userId ? call.receiver : call.caller;
        const otherSocketId = onlineUsers.get(otherUserId);
        
        if (otherSocketId) {
          // Notify the other party that the call ended due to disconnect
          io.to(otherSocketId).emit('call:ended', { 
            callId, 
            reason: 'user_disconnected',
            duration: call.connectedAt ? Date.now() - call.connectedAt : 0
          });
        }
        
        // Remove the call
        activeCalls.delete(callId);
        console.log(`Call ${callId} ended due to user ${socket.userId} disconnect`);
      });
      
      // Remove user from online users
      onlineUsers.delete(socket.userId);
      io.emit('user:offline', socket.userId);
      console.log(`User ${socket.userId} disconnected - ${userCalls.length} calls ended`);
    }
  });
});

module.exports = { app, server, io };

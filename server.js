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
app.use('/api/weather', weatherRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/user', userRoutes);
app.use('/api/trips', packingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/gear', gearRentalRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);

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

// Socket.IO setup for real-time messaging
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Store online users
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their ID
  socket.on('user:join', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`User ${userId} joined`);
    
    // Broadcast online status
    io.emit('user:online', userId);
  });

  // Send message
  socket.on('message:send', async (data) => {
    const { receiverId, senderId, text, image } = data;
    
    // Save message to database
    const Message = require('./models/Message');
    try {
      const messageData = {
        sender: senderId,
        receiver: receiverId,
        read: false
      };
      
      // Add text if provided
      if (text && text.trim()) {
        messageData.text = text.trim();
      }
      
      // Add image if provided
      if (image) {
        messageData.image = image;
        messageData.type = 'image';
      }
      
      const message = await Message.create(messageData);

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name profilePicture')
        .populate('receiver', 'name profilePicture');

      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('message:receive', populatedMessage);
      }

      // Send confirmation to sender
      socket.emit('message:sent', populatedMessage);
    } catch (error) {
      console.error('Error saving message:', error);
      socket.emit('message:error', { error: 'Failed to send message' });
    }
  });

  // Mark message as read
  socket.on('message:read', async (messageId) => {
    const Message = require('./models/Message');
    try {
      await Message.findByIdAndUpdate(messageId, { read: true });
      socket.emit('message:read:success', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
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

  // Call signaling
  socket.on('call:offer', (data) => {
    const { to, offer, type } = data;
    const receiverSocketId = onlineUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call:incoming', { 
        from: socket.userId, 
        offer,
        type 
      });
    }
  });

  socket.on('call:answer', (data) => {
    const { to, answer } = data;
    const receiverSocketId = onlineUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call:accepted', { answer });
    }
  });

  socket.on('call:reject', (data) => {
    const { to } = data;
    const receiverSocketId = onlineUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call:rejected');
    }
  });

  socket.on('call:end', (data) => {
    const { to } = data;
    const receiverSocketId = onlineUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call:ended');
    }
  });

  socket.on('ice:candidate', (data) => {
    const { to, candidate } = data;
    const receiverSocketId = onlineUsers.get(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('ice:candidate', { candidate });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('user:offline', socket.userId);
      console.log(`User ${socket.userId} disconnected`);
    }
  });
});

module.exports = { app, server, io };

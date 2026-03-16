/**
 * ===========================================
 * CineVest - Main Server Entry Point
 * ===========================================
 * 
 * This file initializes the Express server, connects to MongoDB,
 * sets up middleware, and mounts all API routes.
 */

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import ChatMessage from './models/ChatMessage.js';
import { setIO } from './config/socket.js';
import logger from './config/logger.js';
import morgan from 'morgan';

// Load environment variables
dotenv.config({ path: '../.env' });

// Import database connection
import connectDB from './config/db.js';

// Import route files
import authRoutes from './routes/authRoutes.js';
import filmRoutes from './routes/filmRoutes.js';
import investmentRoutes from './routes/investmentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import waitlistRoutes from './routes/waitlistRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Import middleware
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Initialize Express app
const app = express();
app.set('trust proxy', 1); // Trust first proxy (if behind a reverse proxy like Nginx or Heroku)
const httpServer = createServer(app);


const allowedOrigins = [
  process.env.CLIENT_URL, 
  'http://localhost:5173', 
  'https://cinevest.onrender.com' // Ensure this matches your ACTUAL frontend URL
].filter(Boolean); // Removes null/undefined values

// Initialize Socket.io for real-time chat
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true, // Required for authenticated handshakes
  },
});

// Store io instance for use in controllers
setIO(io);

// Connect to MongoDB
connectDB();

// ===========================================
// Middleware Setup
// ===========================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Set to false if you experience issues loading images/sockets
}));

// Enable CORS
// Enable CORS
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Body parser middleware with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP request logging via Morgan → Winston
app.use(
  morgan('short', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.url === '/api/health',
  }),
);

// Serve uploaded files as static assets
import path from 'path';
app.use('/uploads', express.static(path.resolve('public/uploads')));

// Global rate limiter — 100 req / 15 min per IP
app.use('/api', apiLimiter);

// ===========================================
// API Routes
// ===========================================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CineVest API is running' });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/films', filmRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/notifications', notificationRoutes);

// ===========================================
// Socket.io Setup for Real-time Chat
// ===========================================

// Authenticate socket connections with JWT
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name avatar role');

    if (!user) {
      return next(new Error('User not found'));
    }

    // Attach user data to the socket for later use
    socket.user = {
      _id: user._id.toString(),
      name: user.name,
      avatar: user.avatar,
      role: user.role,
    };

    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.user.name, socket.id);

  // Track which rooms this socket is in
  const joinedRooms = new Set();

  // Join a chat room
  socket.on('joinRoom', async (roomId) => {
    if (typeof roomId !== 'string' || roomId.length > 100) return;

    // Restrict non-subscribed users to the "general" room only
    const isSubscribed = socket.user.role === 'vip' || socket.user.role === 'admin';
    if (!isSubscribed && roomId !== 'general') {
      socket.emit('roomAccessDenied', {
        roomId,
        message: 'Subscription required to access this room',
      });
      return;
    }

    socket.join(roomId);
    joinedRooms.add(roomId);
    console.log(`User ${socket.user.name} joined room ${roomId}`);

    // Notify others in the room
    socket.to(roomId).emit('userJoined', {
      roomId,
      user: socket.user,
    });

    // Send online users in this room
    const sockets = await io.in(roomId).fetchSockets();
    const onlineUsers = [...new Map(sockets.map((s) => [s.user._id, s.user])).values()];
    io.to(roomId).emit('onlineUsers', { roomId, users: onlineUsers });

    // Load recent messages from DB
    try {
      const recentMessages = await ChatMessage.find({ roomId })
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(50);
      socket.emit('roomHistory', { roomId, messages: recentMessages.reverse() });
    } catch (err) {
      console.error('Failed to load room history:', err.message);
    }
  });

  // Leave a chat room
  socket.on('leaveRoom', async (roomId) => {
    if (typeof roomId !== 'string') return;
    socket.leave(roomId);
    joinedRooms.delete(roomId);

    socket.to(roomId).emit('userLeft', {
      roomId,
      user: socket.user,
    });

    // Update online users
    const sockets = await io.in(roomId).fetchSockets();
    const onlineUsers = [...new Map(sockets.map((s) => [s.user._id, s.user])).values()];
    io.to(roomId).emit('onlineUsers', { roomId, users: onlineUsers });
  });

  // Handle new messages — persist to DB then broadcast
  socket.on('sendMessage', async (data) => {
    if (!data?.roomId || (!data?.message && !data?.attachments?.length)) return;

    // Restrict non-subscribed users to the "general" room only
    const isSubscribed = socket.user.role === 'vip' || socket.user.role === 'admin';
    if (!isSubscribed && data.roomId !== 'general') {
      socket.emit('roomAccessDenied', {
        roomId: data.roomId,
        message: 'Subscription required to send messages in this room',
      });
      return;
    }

    // Optimistic: broadcast immediately with a temp ID
    const tempMessage = {
      _id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      roomId: data.roomId,
      message: data.message || '',
      messageType: data.messageType || 'text',
      attachments: data.attachments || [],
      sender: socket.user,
      createdAt: new Date().toISOString(),
    };

    // Broadcast to everyone in room immediately (including sender)
    io.to(data.roomId).emit('newMessage', tempMessage);

    // Persist to DB in background
    try {
      const saved = await ChatMessage.create({
        sender: socket.user._id,
        roomId: data.roomId,
        message: data.message || '',
        messageType: data.messageType || 'text',
        attachments: data.attachments || [],
      });
      const populated = await ChatMessage.findById(saved._id).populate('sender', 'name avatar');

      // Send a confirmation with the real _id so client can replace temp
      io.to(data.roomId).emit('messageConfirmed', {
        tempId: tempMessage._id,
        message: populated.toObject(),
      });
    } catch (err) {
      console.error('Failed to save message:', err.message);
    }
  });

  // Typing indicators
  socket.on('typing', (roomId) => {
    if (typeof roomId !== 'string') return;
    socket.to(roomId).emit('userTyping', {
      roomId,
      user: socket.user,
    });
  });

  socket.on('stopTyping', (roomId) => {
    if (typeof roomId !== 'string') return;
    socket.to(roomId).emit('userStoppedTyping', {
      roomId,
      user: socket.user,
    });
  });

  // Edit a message (own messages only)
  socket.on('editMessage', async ({ messageId, newText }) => {
    if (!messageId || !newText?.trim()) return;
    if (newText.length > 1000) return;

    try {
      const msg = await ChatMessage.findById(messageId);
      if (!msg) return;
      if (msg.sender.toString() !== socket.user._id) return;
      if (msg.messageType !== 'text') return;

      // Disallow editing after 5 minutes
      const FIVE_MINUTES = 5 * 60 * 1000;
      if (Date.now() - new Date(msg.createdAt).getTime() > FIVE_MINUTES) return;

      msg.message = newText.trim();
      msg.isEdited = true;
      msg.editedAt = new Date();
      await msg.save();

      const populated = await ChatMessage.findById(msg._id).populate('sender', 'name avatar');

      // Broadcast edit to everyone in the room
      io.to(msg.roomId).emit('messageEdited', {
        roomId: msg.roomId,
        message: populated.toObject(),
      });
    } catch (err) {
      console.error('Failed to edit message:', err.message);
    }
  });

  // Delete a message (own messages or admin)
  socket.on('deleteMessage', async ({ messageId }) => {
    if (!messageId) return;

    try {
      const msg = await ChatMessage.findById(messageId);
      if (!msg) return;

      const isOwner = msg.sender.toString() === socket.user._id;
      const isAdmin = socket.user.role === 'admin';
      if (!isOwner && !isAdmin) return;

      const { roomId, _id } = msg;
      await msg.deleteOne();

      // Broadcast deletion to everyone in the room
      io.to(roomId).emit('messageDeleted', {
        roomId,
        messageId: _id.toString(),
      });
    } catch (err) {
      console.error('Failed to delete message:', err.message);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.user.name, socket.id);

    // Update online users in all rooms this user was in
    for (const roomId of joinedRooms) {
      socket.to(roomId).emit('userLeft', {
        roomId,
        user: socket.user,
      });

      try {
        const sockets = await io.in(roomId).fetchSockets();
        const onlineUsers = [...new Map(sockets.map((s) => [s.user._id, s.user])).values()];
        io.to(roomId).emit('onlineUsers', { roomId, users: onlineUsers });
      } catch { /* ignore */ }
    }
  });
});

// ===========================================
// Error Handling Middleware
// ===========================================

app.use(notFound);
app.use(errorHandler);

// ===========================================
// Start Server
// ===========================================

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
  console.log(`
  ===========================================
  🎬 CineVest Server Running
  ===========================================
  Mode: ${process.env.NODE_ENV || 'development'}
  Port: ${PORT}
  API:  http://localhost:${PORT}/api
  ===========================================
  `);
});

export { io };

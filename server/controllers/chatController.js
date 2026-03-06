/**
 * ===========================================
 * Chat Controller
 * ===========================================
 * 
 * Handles chat-related operations:
 * - Get chat messages
 * - Send messages
 * - Manage chat rooms
 */

import asyncHandler from 'express-async-handler';
import ChatMessage from '../models/ChatMessage.js';

/**
 * @desc    Get messages for a chat room
 * @route   GET /api/chat/:roomId
 * @access  Private
 */
export const getChatMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { limit = 50, before } = req.query;

  // Restrict non-subscribed users to the "general" room only
  const isSubscribed = req.user.role === 'vip' || req.user.role === 'admin';
  if (!isSubscribed && roomId !== 'general') {
    res.status(403);
    throw new Error('Subscription required to access this room');
  }

  const query = { roomId };
  
  // Pagination: get messages before a certain timestamp
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await ChatMessage.find(query)
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  // Return in chronological order
  res.json(messages.reverse());
});

/**
 * @desc    Send a message to a chat room
 * @route   POST /api/chat
 * @access  Private
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { roomId, message, messageType, attachments } = req.body;

  if (!message || !roomId) {
    res.status(400);
    throw new Error('Room ID and message are required');
  }

  // Restrict non-subscribed users to the "general" room only
  const isSubscribed = req.user.role === 'vip' || req.user.role === 'admin';
  if (!isSubscribed && roomId !== 'general') {
    res.status(403);
    throw new Error('Subscription required to send messages in this room');
  }

  const chatMessage = await ChatMessage.create({
    sender: req.user._id,
    roomId,
    message,
    messageType: messageType || 'text',
    attachments: attachments || [],
  });

  const populatedMessage = await ChatMessage.findById(chatMessage._id).populate(
    'sender',
    'name avatar'
  );

  res.status(201).json(populatedMessage);
});

/**
 * @desc    Mark messages as read
 * @route   PUT /api/chat/:roomId/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  await ChatMessage.updateMany(
    {
      roomId,
      sender: { $ne: req.user._id },
      isRead: false,
    },
    { isRead: true }
  );

  res.json({ message: 'Messages marked as read' });
});

/**
 * @desc    Get chat rooms for user (based on their investments)
 * @route   GET /api/chat/rooms
 * @access  Private
 */
export const getChatRooms = asyncHandler(async (req, res) => {
  const isSubscribed = req.user.role === 'vip' || req.user.role === 'admin';

  // All available rooms
  const allRooms = [
    { id: 'general', name: 'General Discussion', description: 'Open chat for all investors', icon: 'general', requiresSubscription: false },
    { id: 'vip-lounge', name: 'VIP Lounge', description: 'Exclusive VIP investor chat', icon: 'vip', requiresSubscription: true },
    { id: 'announcements', name: 'Announcements', description: 'Official CineVest updates', icon: 'announcements', requiresSubscription: true },
    { id: 'film-talk', name: 'Film Talk', description: 'Discuss upcoming film projects', icon: 'film', requiresSubscription: true },
    { id: 'crypto', name: 'Crypto & Payments', description: 'Crypto investment discussion', icon: 'crypto', requiresSubscription: true },
  ];

  // Return all rooms with a `locked` flag so the client knows what's accessible
  const rooms = allRooms.map((room) => ({
    ...room,
    locked: room.requiresSubscription && !isSubscribed,
  }));

  res.json(rooms);
});

/**
 * @desc    Delete a message (own messages or admin can delete any)
 * @route   DELETE /api/chat/:messageId
 * @access  Private
 */
export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await ChatMessage.findById(req.params.messageId);

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  // Allow owner or admin to delete
  const isOwner = message.sender.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to delete this message');
  }

  const { roomId, _id: messageId } = message;
  await message.deleteOne();
  res.json({ message: 'Message deleted', messageId, roomId });
});

/**
 * @desc    Edit a message (own messages only)
 * @route   PUT /api/chat/:messageId
 * @access  Private
 */
export const editMessage = asyncHandler(async (req, res) => {
  const { message: newText } = req.body;

  if (!newText || !newText.trim()) {
    res.status(400);
    throw new Error('Message text is required');
  }

  if (newText.length > 1000) {
    res.status(400);
    throw new Error('Message cannot exceed 1000 characters');
  }

  const msg = await ChatMessage.findById(req.params.messageId);

  if (!msg) {
    res.status(404);
    throw new Error('Message not found');
  }

  // Disallow editing after 5 minutes
  const FIVE_MINUTES = 5 * 60 * 1000;
  if (Date.now() - new Date(msg.createdAt).getTime() > FIVE_MINUTES) {
    res.status(403);
    throw new Error('You can only edit messages within 5 minutes of sending.');
  }

  if (msg.sender.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to edit this message');
  }

  // Only allow editing text messages
  if (msg.messageType !== 'text') {
    res.status(400);
    throw new Error('Only text messages can be edited');
  }

  msg.message = newText.trim();
  msg.isEdited = true;
  msg.editedAt = new Date();
  await msg.save();

  const populated = await ChatMessage.findById(msg._id).populate('sender', 'name avatar');
  res.json(populated);
});

/**
 * @desc    Upload a file for chat
 * @route   POST /api/chat/upload
 * @access  Private
 */
export const uploadChatFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const isImage = req.file.mimetype.startsWith('image/');

  res.status(201).json({
    url: `/uploads/chat/${req.file.filename}`,
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    messageType: isImage ? 'image' : 'file',
  });
});

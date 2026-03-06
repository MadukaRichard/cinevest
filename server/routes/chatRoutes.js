/**
 * ===========================================
 * Chat Routes
 * ===========================================
 * 
 * Routes for investor chat functionality.
 * 
 * GET    /api/chat/rooms          - Get user's chat rooms
 * GET    /api/chat/:roomId        - Get room messages
 * POST   /api/chat                - Send message
 * PUT    /api/chat/:roomId/read   - Mark messages as read
 * DELETE /api/chat/:messageId     - Delete message
 */

import express from 'express';
import {
  getChatMessages,
  sendMessage,
  markAsRead,
  getChatRooms,
  deleteMessage,
  editMessage,
  uploadChatFile,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  validate,
  sendMessageRules,
  mongoIdParam,
} from '../middleware/validate.js';
import { chatUpload } from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Chat routes
router.get('/rooms', getChatRooms);
router.get('/:roomId', getChatMessages);
router.post('/', sendMessageRules, validate, sendMessage);
router.put('/:roomId/read', markAsRead);
router.delete('/:messageId', mongoIdParam('messageId'), validate, deleteMessage);
router.put('/:messageId', mongoIdParam('messageId'), validate, editMessage);

// File upload (single file, field name = "file")
router.post('/upload', chatUpload.single('file'), uploadChatFile);

export default router;

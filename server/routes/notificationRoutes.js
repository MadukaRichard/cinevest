/**
 * ===========================================
 * Notification Routes
 * ===========================================
 *
 * GET  /api/notifications          - Get user notifications
 * PUT  /api/notifications/read-all - Mark all as read
 * PUT  /api/notifications/:id/read - Mark one as read
 * DELETE /api/notifications/:id    - Delete notification
 */

import express from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, mongoIdParam } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', mongoIdParam('id'), validate, markNotificationRead);
router.delete('/:id', mongoIdParam('id'), validate, deleteNotification);

export default router;

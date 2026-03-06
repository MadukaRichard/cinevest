/**
 * ===========================================
 * Notification Controller
 * ===========================================
 *
 * Handles notification operations:
 * - Get user notifications
 * - Mark as read
 * - Create notifications (internal helper)
 */

import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';

/**
 * @desc    Get user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { limit = 20, unreadOnly } = req.query;

  const query = { user: req.user._id };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  res.json({ notifications, unreadCount });
});

/**
 * @desc    Mark a notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  notification.isRead = true;
  await notification.save();

  res.json({ message: 'Notification marked as read' });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ message: 'All notifications marked as read' });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (notification.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  await notification.deleteOne();
  res.json({ message: 'Notification deleted' });
});

/**
 * Helper: Create a notification (for internal use by other controllers)
 * @param {Object} opts - { userId, title, message, type, link, priority, expiresAt }
 */
export const createNotification = async ({ userId, title, message, type = 'system', link = '', priority = 'normal', expiresAt = null }) => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      link,
      priority,
      expiresAt,
    });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

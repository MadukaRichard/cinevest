/**
 * ===========================================
 * Notification Model
 * ===========================================
 * 
 * Defines the Notification schema for MongoDB.
 * Handles system notifications for users.
 */

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a notification title'],
    },
    message: {
      type: String,
      required: [true, 'Please add a notification message'],
    },
    type: {
      type: String,
      enum: ['investment', 'roi', 'film-update', 'chat', 'system', 'admin', 'promotion'],
      default: 'system',
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient user notification queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

// Auto-delete expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $type: 'date' } } });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;

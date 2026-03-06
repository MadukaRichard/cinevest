/**
 * ===========================================
 * Waitlist Controller
 * ===========================================
 * 
 * Handles waitlist email subscriptions.
 */

import asyncHandler from 'express-async-handler';
import Waitlist from '../models/Waitlist.js';

/**
 * @desc    Add email to waitlist
 * @route   POST /api/waitlist
 * @access  Public
 */
export const joinWaitlist = asyncHandler(async (req, res) => {
  const { email, source = 'homepage' } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  // Check if email already exists
  const existing = await Waitlist.findOne({ email: email.toLowerCase() });

  if (existing) {
    // If already subscribed, just return success
    if (existing.isSubscribed) {
      res.json({
        success: true,
        message: "You're already on the waitlist!",
      });
      return;
    }

    // Re-subscribe if previously unsubscribed
    existing.isSubscribed = true;
    await existing.save();

    res.json({
      success: true,
      message: 'Welcome back! You have been re-subscribed.',
    });
    return;
  }

  // Create new waitlist entry
  await Waitlist.create({
    email: email.toLowerCase(),
    source,
  });

  res.status(201).json({
    success: true,
    message: "You're on the list! We'll keep you updated.",
  });
});

/**
 * @desc    Unsubscribe from waitlist
 * @route   POST /api/waitlist/unsubscribe
 * @access  Public
 */
export const unsubscribeWaitlist = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const entry = await Waitlist.findOne({ email: email.toLowerCase() });

  if (!entry) {
    res.status(404);
    throw new Error('Email not found in waitlist');
  }

  entry.isSubscribed = false;
  await entry.save();

  res.json({
    success: true,
    message: 'You have been unsubscribed.',
  });
});

/**
 * @desc    Get all waitlist entries (Admin only)
 * @route   GET /api/waitlist
 * @access  Private/Admin
 */
export const getWaitlist = asyncHandler(async (req, res) => {
  const entries = await Waitlist.find({ isSubscribed: true })
    .select('email source createdAt')
    .sort('-createdAt');

  res.json({
    success: true,
    count: entries.length,
    data: entries,
  });
});

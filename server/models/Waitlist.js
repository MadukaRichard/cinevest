/**
 * ===========================================
 * Waitlist Model
 * ===========================================
 * 
 * Stores email addresses of users who want
 * to receive updates about CineVest.
 */

import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    source: {
      type: String,
      default: 'homepage',
      enum: ['homepage', 'footer', 'popup', 'other'],
    },
    isSubscribed: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

export default Waitlist;

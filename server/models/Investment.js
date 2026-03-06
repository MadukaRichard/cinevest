/**
 * ===========================================
 * Investment Model
 * ===========================================
 * 
 * Defines the Investment schema for MongoDB.
 * Tracks user investments in film projects.
 */

import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    film: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Film',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please add investment amount'],
      min: [1, 'Investment must be at least 1'],
    },
    currency: {
      type: String,
      enum: ['USD', 'ETH', 'BTC', 'USDT', 'USDC'],
      default: 'USD',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'crypto'],
      required: [true, 'Please specify payment method'],
    },
    transactionHash: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'failed', 'refunded'],
      default: 'pending',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verificationNote: {
      type: String,
      default: '',
    },
    roi: {
      type: Number,
      default: 0,
    },
    ownershipPercentage: {
      type: Number,
      default: 0,
    },
    dividendsPaid: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
investmentSchema.index({ user: 1, film: 1 });
investmentSchema.index({ status: 1 });
investmentSchema.index({ transactionHash: 1 }, { unique: true, sparse: true });

const Investment = mongoose.model('Investment', investmentSchema);

export default Investment;

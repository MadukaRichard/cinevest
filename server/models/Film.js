/**
 * ===========================================
 * Film Model
 * ===========================================
 * 
 * Defines the Film schema for MongoDB.
 * Represents film projects available for investment.
 */

import mongoose from 'mongoose';

const filmSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a film title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    genre: {
      type: [String],
      required: [true, 'Please add at least one genre'],
    },
    director: {
      type: String,
      required: [true, 'Please add director name'],
    },
    cast: {
      type: [String],
      default: [],
    },
    poster: {
      type: String,
      default: '',
    },
    trailer: {
      type: String,
      default: '',
    },
    targetBudget: {
      type: Number,
      required: [true, 'Please add target budget'],
    },
    currentFunding: {
      type: Number,
      default: 0,
    },
    minInvestment: {
      type: Number,
      required: [true, 'Please add minimum investment amount'],
    },
    expectedROI: {
      type: Number,
      required: [true, 'Please add expected ROI percentage'],
    },
    status: {
      type: String,
      enum: ['upcoming', 'funding', 'in-production', 'completed', 'released'],
      default: 'upcoming',
    },
    releaseDate: {
      type: Date,
    },
    fundingDeadline: {
      type: Date,
      required: [true, 'Please add funding deadline'],
    },
    totalInvestors: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    featuredOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for funding progress percentage
filmSchema.virtual('fundingProgress').get(function () {
  return Math.round((this.currentFunding / this.targetBudget) * 100);
});

// Include virtuals in JSON output
filmSchema.set('toJSON', { virtuals: true });
filmSchema.set('toObject', { virtuals: true });

const Film = mongoose.model('Film', filmSchema);

export default Film;

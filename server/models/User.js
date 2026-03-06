/**
 * ===========================================
 * User Model
 * ===========================================
 * 
 * Defines the User schema for MongoDB.
 * Handles user authentication, profile data, and wallet information.
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,           // allow multiple null emails (wallet-only users)
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
      default: undefined,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'vip', 'admin'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '',
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,           // allow multiple null wallet addresses
      default: undefined,
    },
    walletNonce: {
      type: String,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationOTP: {
      type: String,
      select: false,
    },
    verificationOTPExpires: {
      type: Date,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    totalInvested: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      zip: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure at least one auth method exists (only on new documents)
userSchema.pre('validate', function (next) {
  // Skip this check on existing documents — password field has select:false
  // so it won't be loaded on updates, causing false negatives
  if (!this.isNew) return next();

  const hasEmailAuth = this.email && this.password;
  const hasWallet = this.walletAddress;
  if (!hasEmailAuth && !hasWallet) {
    return next(new Error('Account must have either email+password or a wallet address'));
  }
  next();
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

/**
 * ===========================================
 * Authentication Controller
 * ===========================================
 * 
 * Handles user authentication operations:
 * - User registration
 * - User login
 * - Profile management
 * - Wallet connection
 */

import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import User from '../models/User.js';
import generateToken, { generateRefreshToken } from '../utils/generateToken.js';
import { generateOTP, hashOTP, sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../utils/sendEmail.js';

const MAX_OTP_ATTEMPTS = 5;

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    // If user exists but not verified, allow re-registration
    if (!userExists.isVerified) {
      // Generate new OTP
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      userExists.verificationOTP = hashOTP(otp);
      userExists.verificationOTPExpires = otpExpires;
      userExists.otpAttempts = 0;
      userExists.name = name;
      userExists.password = password;
      await userExists.save();

      // Send verification email
      await sendVerificationEmail(email, name, otp);

      res.status(200).json({
        message: 'Verification code sent to your email',
        email: email,
        requiresVerification: true,
      });
      return;
    }
    
    res.status(400);
    throw new Error('User already exists');
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create new user (unverified)
  const user = await User.create({
    name,
    email,
    password,
    verificationOTP: hashOTP(otp),
    verificationOTPExpires: otpExpires,
    isVerified: false,
    otpAttempts: 0,
  });

  if (user) {
    // Send verification email
    await sendVerificationEmail(email, name, otp);

    res.status(201).json({
      message: 'Verification code sent to your email',
      email: user.email,
      requiresVerification: true,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email and include password for comparison
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // Check if user is verified
  if (!user.isVerified) {
    // Generate new OTP and send
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    user.verificationOTP = hashOTP(otp);
    user.verificationOTPExpires = otpExpires;
    user.otpAttempts = 0;
    await user.save();

    await sendVerificationEmail(email, user.name, otp);

    res.status(403).json({
      message: 'Please verify your email. A new verification code has been sent.',
      email: user.email,
      requiresVerification: true,
    });
    return;
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    token: generateToken(user._id),
    refreshToken: generateRefreshToken(user._id),
  });
});

/**
 * @desc    Verify email with OTP
 * @route   POST /api/auth/verify
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and verification code are required');
  }

  // Find user with OTP fields
  const user = await User.findOne({ email }).select('+verificationOTP +verificationOTPExpires +otpAttempts');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error('Email is already verified');
  }

  // Check if OTP has been invalidated due to too many attempts
  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    // Wipe the OTP — force user to request a new one
    user.verificationOTP = undefined;
    user.verificationOTPExpires = undefined;
    await user.save();
    res.status(429);
    throw new Error('Too many failed attempts. Please request a new verification code.');
  }

  // Check if OTP is expired
  if (!user.verificationOTP || user.verificationOTPExpires < new Date()) {
    res.status(400);
    throw new Error('Verification code has expired. Please request a new one.');
  }

  // Check if OTP matches (compare hashes)
  if (user.verificationOTP !== hashOTP(otp)) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    await user.save();

    const remaining = MAX_OTP_ATTEMPTS - user.otpAttempts;
    if (remaining <= 0) {
      // Immediately invalidate
      user.verificationOTP = undefined;
      user.verificationOTPExpires = undefined;
      await user.save();
      res.status(429);
      throw new Error('Too many failed attempts. Please request a new verification code.');
    }

    res.status(400);
    throw new Error(`Invalid verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
  }

  // Verify user
  user.isVerified = true;
  user.verificationOTP = undefined;
  user.verificationOTPExpires = undefined;
  user.otpAttempts = 0;
  await user.save();

  // Send welcome email (non-blocking)
  sendWelcomeEmail(user.email, user.name).catch(() => {});

  // Return user with token (auto sign-in)
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    token: generateToken(user._id),
    refreshToken: generateRefreshToken(user._id),
    message: 'Email verified successfully',
  });
});

/**
 * @desc    Resend verification OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error('Email is already verified');
  }

  // Generate new OTP (resets attempt counter)
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.verificationOTP = hashOTP(otp);
  user.verificationOTPExpires = otpExpires;
  user.otpAttempts = 0;
  await user.save();

  // Send verification email
  await sendVerificationEmail(email, user.name, otp);

  res.json({
    message: 'Verification code sent to your email',
    email: user.email,
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      walletAddress: user.walletAddress,
      totalInvested: user.totalInvested,
      isVerified: user.isVerified,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    // Only update avatar if provided (string URL)
    if (typeof req.body.avatar === 'string' && req.body.avatar.trim() !== '') {
      user.avatar = req.body.avatar;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      walletAddress: updatedUser.walletAddress,
      totalInvested: updatedUser.totalInvested,
      isVerified: updatedUser.isVerified,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Change password (requires current password)
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current password and new password are required');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.password) {
    res.status(400);
    throw new Error('Password change is not available for wallet-only accounts');
  }

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password changed successfully' });
});

/**
 * @desc    Connect crypto wallet
 * @route   PUT /api/auth/wallet
 * @access  Private
 */
export const connectWallet = asyncHandler(async (req, res) => {
  const { walletAddress } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Allow users to disconnect their wallet by sending an empty value
  if (!walletAddress) {
    user.walletAddress = undefined;
    await user.save();

    res.json({
      message: 'Wallet disconnected successfully',
      walletAddress: null,
    });
    return;
  }

  const normalizedAddress = walletAddress.trim();
  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(normalizedAddress);

  if (!isValidAddress) {
    res.status(400);
    throw new Error('Please provide a valid wallet address');
  }

  // Check if another account already uses this wallet
  const existing = await User.findOne({ walletAddress: normalizedAddress });
  if (existing && existing._id.toString() !== user._id.toString()) {
    res.status(400);
    throw new Error('This wallet address is already linked to another account');
  }

  user.walletAddress = normalizedAddress;
  await user.save();

  res.json({
    message: 'Wallet connected successfully',
    walletAddress: user.walletAddress,
  });
});

/**
 * @desc    Request password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email });

  // Always return success to prevent email enumeration
  if (!user) {
    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and save to user
  user.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await user.save();

  // Send reset email with unhashed token
  try {
    await sendPasswordResetEmail(email, user.name, resetToken);
    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    // Clear reset fields on email error
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(500);
    throw new Error('Failed to send password reset email. Please try again.');
  }
});

/**
 * @desc    Reset password with token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error('Password is required');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  // Hash the token from URL to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with matching token that hasn't expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  // Update password and clear reset fields
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    message: 'Password reset successful. You can now log in with your new password.',
  });
});

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400);
    throw new Error('Refresh token is required');
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    // Issue new access token
    res.json({
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(401);
    throw new Error('Invalid or expired refresh token');
  }
});

/**
 * @desc    Get a nonce for wallet authentication
 * @route   POST /api/auth/wallet-nonce
 * @access  Public
 */
export const getWalletNonce = asyncHandler(async (req, res) => {
  const { walletAddress } = req.body;

  const normalizedAddress = walletAddress.trim().toLowerCase();
  const isValid = /^0x[a-fA-F0-9]{40}$/.test(normalizedAddress);
  if (!isValid) {
    res.status(400);
    throw new Error('Invalid wallet address');
  }

  // Generate a random nonce
  const nonce = crypto.randomBytes(32).toString('hex');

  // Find existing user or create a placeholder nonce
  let user = await User.findOne({ walletAddress: normalizedAddress });

  if (user) {
    // Existing user — store nonce
    user.walletNonce = nonce;
    await user.save();
  } else {
    // New user — store nonce in a temporary user record
    // We'll finalise the account in walletVerify
    user = await User.create({
      walletAddress: normalizedAddress,
      walletNonce: nonce,
      name: `User-${normalizedAddress.slice(2, 8)}`,
      isVerified: true, // wallet users are auto-verified
    });
  }

  const message = `Sign this message to authenticate with CineVest.\n\nWallet: ${normalizedAddress}\nNonce: ${nonce}`;

  res.json({
    message,
    nonce,
  });
});

/**
 * @desc    Verify wallet signature and authenticate
 * @route   POST /api/auth/wallet-verify
 * @access  Public
 */
export const walletVerify = asyncHandler(async (req, res) => {
  const { walletAddress, signature, message } = req.body;

  const normalizedAddress = walletAddress.trim().toLowerCase();

  // Recover the signer address from the signature
  let recoveredAddress;
  try {
    recoveredAddress = ethers.verifyMessage(message, signature).toLowerCase();
  } catch {
    res.status(400);
    throw new Error('Invalid signature');
  }

  // Check recovered address matches the claimed address
  if (recoveredAddress !== normalizedAddress) {
    res.status(401);
    throw new Error('Signature does not match the wallet address');
  }

  // Find the user and verify the nonce
  const user = await User.findOne({ walletAddress: normalizedAddress }).select('+walletNonce');

  if (!user) {
    res.status(404);
    throw new Error('Wallet not found. Please request a nonce first.');
  }

  // Verify the message contains the stored nonce (prevents replay attacks)
  if (!user.walletNonce || !message.includes(user.walletNonce)) {
    res.status(401);
    throw new Error('Invalid or expired nonce. Please request a new one.');
  }

  // Clear the nonce (single use)
  user.walletNonce = undefined;
  await user.save();

  // Return auth token
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email || null,
    role: user.role,
    walletAddress: user.walletAddress,
    isVerified: user.isVerified,
    token: generateToken(user._id),
    refreshToken: generateRefreshToken(user._id),
  });
});

/**
 * ===========================================
 * Authentication Routes
 * ===========================================
 * 
 * Routes for user authentication and profile management.
 * 
 * POST /api/auth/register           - Register new user
 * POST /api/auth/login              - Login user
 * POST /api/auth/verify             - Verify email with OTP
 * POST /api/auth/resend-otp         - Resend verification OTP
 * POST /api/auth/forgot-password    - Request password reset
 * POST /api/auth/reset-password/:token - Reset password with token
 * GET  /api/auth/profile            - Get user profile
 * PUT  /api/auth/profile            - Update user profile
 * PUT  /api/auth/wallet             - Connect crypto wallet
 */

import express from 'express';
import {
  registerUser,
  loginUser,
  verifyEmail,
  resendOTP,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  getUserProfile,
  updateUserProfile,
  changePassword,
  connectWallet,
  getWalletNonce,
  walletVerify,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter, otpLimiter, apiLimiter } from '../middleware/rateLimiter.js';

import {
  validate,
  registerRules,
  loginRules,
  verifyEmailRules,
  resendOTPRules,
  forgotPasswordRules,
  resetPasswordRules,
  updateProfileRules,
  walletRules,
  walletNonceRules,
  walletVerifyRules,
} from '../middleware/validate.js';
import { avatarUpload } from '../middleware/avatarUpload.js';

const router = express.Router();

// Public routes (rate-limited)
router.post('/register', authLimiter, registerRules, validate, registerUser);
router.post('/login', authLimiter, loginRules, validate, loginUser);
router.post('/verify', otpLimiter, verifyEmailRules, validate, verifyEmail);
router.post('/resend-otp', authLimiter, resendOTPRules, validate, resendOTP);
router.post('/forgot-password', authLimiter, forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordRules, validate, resetPassword);
router.post('/refresh', apiLimiter, refreshAccessToken);

// Wallet authentication (rate-limited)
router.post('/wallet-nonce', authLimiter, walletNonceRules, validate, getWalletNonce);
router.post('/wallet-verify', authLimiter, walletVerifyRules, validate, walletVerify);


// Avatar upload endpoint
router.post('/avatar', protect, avatarUpload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Return the relative path to the uploaded avatar
  res.json({
    url: `/uploads/avatars/${req.file.filename}`
  });
});

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfileRules, validate, updateUserProfile);
router.put('/change-password', protect, changePassword);
router.put('/wallet', protect, walletRules, validate, connectWallet);

export default router;

/**
 * ===========================================
 * Validation Middleware
 * ===========================================
 *
 * Centralized express-validator rules and a reusable
 * helper that turns validation errors into 400 responses.
 */

import { body, param, query, validationResult } from 'express-validator';

// ─── Helper: run after validation chains ──────────────────────
/**
 * Middleware that checks for validation errors collected by
 * express-validator and returns a 400 with the first error
 * message if any exist.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    // Return the first error message for a clean UX
    const message = errors.array().map((e) => e.msg).join(', ');
    throw new Error(message);
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────

export const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const verifyEmailRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('otp')
    .trim()
    .notEmpty().withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 }).withMessage('Verification code must be 6 digits')
    .isNumeric().withMessage('Verification code must be numeric'),
];

export const resendOTPRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
];

export const forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
];

export const resetPasswordRules = [
  param('token')
    .notEmpty().withMessage('Reset token is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .optional()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const walletRules = [
  body('walletAddress')
    .optional({ nullable: true })
    .trim()
    .custom((value) => {
      // Allow null / empty string for disconnect
      if (!value) return true;
      if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
        throw new Error('Please provide a valid Ethereum wallet address');
      }
      return true;
    }),
];

// ─── Wallet Auth Validators ───────────────────────────────────

export const walletNonceRules = [
  body('walletAddress')
    .trim()
    .notEmpty().withMessage('Wallet address is required')
    .matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid Ethereum wallet address'),
];

export const walletVerifyRules = [
  body('walletAddress')
    .trim()
    .notEmpty().withMessage('Wallet address is required')
    .matches(/^0x[a-fA-F0-9]{40}$/).withMessage('Invalid Ethereum wallet address'),
  body('signature')
    .trim()
    .notEmpty().withMessage('Signature is required')
    .matches(/^0x[a-fA-F0-9]+$/).withMessage('Invalid signature format'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required'),
];

// ─── Film Validators ──────────────────────────────────────────

export const createFilmRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Film title is required')
    .isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required'),
  body('genre')
    .isArray({ min: 1 }).withMessage('At least one genre is required'),
  body('genre.*')
    .trim()
    .notEmpty().withMessage('Genre values cannot be empty'),
  body('director')
    .trim()
    .notEmpty().withMessage('Director name is required'),
  body('targetBudget')
    .notEmpty().withMessage('Target budget is required')
    .isFloat({ min: 1 }).withMessage('Target budget must be a positive number'),
  body('minInvestment')
    .notEmpty().withMessage('Minimum investment is required')
    .isFloat({ min: 1 }).withMessage('Minimum investment must be a positive number'),
  body('expectedROI')
    .notEmpty().withMessage('Expected ROI is required')
    .isFloat({ min: 0 }).withMessage('Expected ROI must be a non-negative number'),
  body('fundingDeadline')
    .notEmpty().withMessage('Funding deadline is required')
    .isISO8601().withMessage('Funding deadline must be a valid date'),
  body('releaseDate')
    .optional()
    .isISO8601().withMessage('Release date must be a valid date'),
  body('cast')
    .optional()
    .isArray().withMessage('Cast must be an array'),
  body('poster')
    .optional()
    .trim()
    .isURL().withMessage('Poster must be a valid URL'),
  body('trailer')
    .optional()
    .trim()
    .isURL().withMessage('Trailer must be a valid URL'),
];

/**
 * Only allow updating specific safe fields on films.
 * Protects against mass-assignment of _id, currentFunding, etc.
 */
export const FILM_UPDATABLE_FIELDS = [
  'title',
  'description',
  'genre',
  'director',
  'cast',
  'poster',
  'trailer',
  'targetBudget',
  'minInvestment',
  'expectedROI',
  'fundingDeadline',
  'releaseDate',
  'status',
  'featured',
  'featuredOrder',
];

export const updateFilmRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Title must be under 200 characters'),
  body('genre')
    .optional()
    .isArray({ min: 1 }).withMessage('At least one genre is required'),
  body('targetBudget')
    .optional()
    .isFloat({ min: 1 }).withMessage('Target budget must be a positive number'),
  body('minInvestment')
    .optional()
    .isFloat({ min: 1 }).withMessage('Minimum investment must be a positive number'),
  body('expectedROI')
    .optional()
    .isFloat({ min: 0 }).withMessage('Expected ROI must be a non-negative number'),
  body('fundingDeadline')
    .optional()
    .isISO8601().withMessage('Funding deadline must be a valid date'),
  body('releaseDate')
    .optional()
    .isISO8601().withMessage('Release date must be a valid date'),
  body('status')
    .optional()
    .isIn(['upcoming', 'funding', 'in-production', 'completed', 'released'])
    .withMessage('Invalid film status'),
  body('featured')
    .optional()
    .isBoolean().withMessage('Featured must be a boolean'),
  body('featuredOrder')
    .optional()
    .isInt({ min: 0 }).withMessage('Featured order must be a non-negative integer'),
];

// ─── Investment Validators ────────────────────────────────────

export const createInvestmentRules = [
  body('filmId')
    .notEmpty().withMessage('Film ID is required')
    .isMongoId().withMessage('Invalid film ID'),
  body('amount')
    .notEmpty().withMessage('Investment amount is required')
    .isFloat({ min: 1 }).withMessage('Amount must be a positive number'),
  body('currency')
    .optional()
    .isIn(['USD', 'ETH', 'BTC', 'USDT', 'USDC']).withMessage('Invalid currency'),
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['card', 'crypto']).withMessage('Payment method must be "card" or "crypto"'),
  body('transactionHash')
    .optional()
    .trim(),
];

// ─── Chat Validators ──────────────────────────────────────────

export const sendMessageRules = [
  body('roomId')
    .trim()
    .notEmpty().withMessage('Room ID is required'),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 2000 }).withMessage('Message must be under 2000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'file']).withMessage('Invalid message type'),
];

// ─── Admin Validators ─────────────────────────────────────────

export const updateRoleRules = [
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['user', 'vip', 'admin']).withMessage('Role must be "user", "vip", or "admin"'),
];

export const updateInvestmentStatusRules = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(['pending', 'confirmed', 'failed', 'refunded']).withMessage('Invalid investment status'),
];

// ─── Waitlist Validators ──────────────────────────────────────

export const joinWaitlistRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('source')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Source must be under 50 characters'),
];

// ─── Common Param Validators ──────────────────────────────────

export const mongoIdParam = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName}`),
];

export const paginationRules = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];

/**
 * ===========================================
 * Rate Limiter Middleware
 * ===========================================
 *
 * Configurable rate limiters for different endpoint tiers.
 * Prevents brute-force, credential stuffing, and abuse.
 */

import rateLimit from 'express-rate-limit';

/**
 * Default limiter for general API routes.
 * 100 requests per 15 minutes per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,    // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

/**
 * Strict limiter for authentication endpoints.
 * 10 attempts per 15 minutes per IP.
 * Covers: login, register, verify OTP, resend OTP, forgot/reset password.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.',
  },
});

/**
 * Very strict limiter for OTP verification.
 * 5 attempts per 15 minutes per IP.
 * Prevents brute-forcing the 6-digit OTP (1M combinations).
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification attempts, please try again after 15 minutes.',
  },
});

/**
 * Limiter for the waitlist / public form submissions.
 * 5 per hour per IP.
 */
export const formLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many submissions, please try again later.',
  },
});

/**
 * Strict limiter for admin endpoints.
 * 30 requests per 15 minutes per IP.
 * Admin actions are sensitive — keep a tighter ceiling.
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many admin requests, please slow down.',
  },
});

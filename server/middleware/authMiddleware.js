/**
 * ===========================================
 * Authentication Middleware
 * ===========================================
 * 
 * Protects routes by verifying JWT tokens.
 * Also includes role-based access control.
 */

import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';

/**
 * Protect routes - verify JWT token
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }

      next();
    } catch (error) {
      console.error('Auth error:', error.message);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * Admin-only access
 */
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as admin');
  }
};

/**
 * VIP or Admin access
 */
export const vipOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'vip' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403);
    throw new Error('VIP membership required');
  }
};

// Rate limiting and input validation are handled in:
// - middleware/rateLimiter.js
// - middleware/validate.js

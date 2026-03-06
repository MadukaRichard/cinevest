/**
 * ===========================================
 * Waitlist Routes
 * ===========================================
 * 
 * POST /api/waitlist             - Join waitlist
 * POST /api/waitlist/unsubscribe - Unsubscribe from waitlist
 * GET  /api/waitlist             - Get all entries (Admin)
 */

import express from 'express';
import {
  joinWaitlist,
  unsubscribeWaitlist,
  getWaitlist,
} from '../controllers/waitlistController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { formLimiter } from '../middleware/rateLimiter.js';
import { validate, joinWaitlistRules } from '../middleware/validate.js';

const router = express.Router();

// Public routes (rate-limited)
router.post('/', formLimiter, joinWaitlistRules, validate, joinWaitlist);
router.post('/unsubscribe', formLimiter, unsubscribeWaitlist);

// Admin routes
router.get('/', protect, admin, getWaitlist);

export default router;

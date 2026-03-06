/**
 * ===========================================
 * Admin Routes
 * ===========================================
 * 
 * Routes for admin dashboard and platform management.
 * All routes require admin authentication.
 * Write operations require a short-lived admin session token
 * obtained via POST /api/admin/reauth (password re-confirmation).
 * 
 * POST   /api/admin/reauth            - Re-authenticate admin (get admin session token)
 * GET    /api/admin/stats              - Get platform statistics
 * GET    /api/admin/users              - Get all users
 * GET    /api/admin/users/:id          - Get user by ID
 * PUT    /api/admin/users/:id/role     - Update user role      (requires admin session)
 * DELETE /api/admin/users/:id          - Delete user            (requires admin session)
 * GET    /api/admin/investments        - Get all investments
 * PUT    /api/admin/investments/:id    - Update investment status (requires admin session)
 * GET    /api/admin/audit-logs         - Get audit trail
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import {
  reauthAdmin,
  getPlatformStats,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getAllInvestments,
  updateInvestmentStatus,
  getAuditLogs,
  getPlatformWallets,
  updatePlatformWallets,
  getAdminChatMessages,
  adminDeleteMessage,
  getChatStats,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { adminLimiter } from '../middleware/rateLimiter.js';
import {
  validate,
  updateRoleRules,
  updateInvestmentStatusRules,
  mongoIdParam,
  paginationRules,
} from '../middleware/validate.js';

const router = express.Router();

// All admin routes: auth + role check + stricter rate limit
router.use(protect, admin, adminLimiter);

// ──────────────────────────────────────────────
// Middleware: require valid admin-session token
// for all mutating (write) operations.
// ──────────────────────────────────────────────
const requireAdminSession = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken) {
    res.status(403);
    throw new Error('Admin session required. Please re-authenticate.');
  }

  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    if (!decoded.adminSession) {
      throw new Error('Invalid admin token');
    }
    // Ensure the token belongs to the same user
    if (decoded.id !== req.user._id.toString()) {
      throw new Error('Token/user mismatch');
    }
    next();
  } catch (err) {
    res.status(403);
    throw new Error('Admin session expired or invalid. Please re-authenticate.');
  }
};

// ──────────────────────────────────────────────
// Re-authentication (password confirmation)
// ──────────────────────────────────────────────
router.post('/reauth', reauthAdmin);

// ──────────────────────────────────────────────
// Read-only routes (no admin session token needed)
// ──────────────────────────────────────────────
router.get('/stats', getPlatformStats);
router.get('/users', paginationRules, validate, getAllUsers);
router.get('/users/:id', mongoIdParam('id'), validate, getUserById);
router.get('/investments', paginationRules, validate, getAllInvestments);
router.get('/audit-logs', paginationRules, validate, getAuditLogs);

// ──────────────────────────────────────────────
// Write routes (require admin session token)
// ──────────────────────────────────────────────
router.put('/users/:id/role', requireAdminSession, mongoIdParam('id'), updateRoleRules, validate, updateUserRole);
router.delete('/users/:id', requireAdminSession, mongoIdParam('id'), validate, deleteUser);
router.put('/investments/:id/status', requireAdminSession, mongoIdParam('id'), updateInvestmentStatusRules, validate, updateInvestmentStatus);

// ──────────────────────────────────────────────
// Platform wallet management
// ──────────────────────────────────────────────
router.get('/wallets', getPlatformWallets);
router.put('/wallets', requireAdminSession, updatePlatformWallets);

// ──────────────────────────────────────────────
// Chat management
// ──────────────────────────────────────────────
router.get('/chat/stats', getChatStats);
router.get('/chat/:roomId', getAdminChatMessages);
router.delete('/chat/:messageId', requireAdminSession, mongoIdParam('messageId'), validate, adminDeleteMessage);

export default router;

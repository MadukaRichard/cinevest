/**
 * ===========================================
 * Admin Controller
 * ===========================================
 * 
 * Handles admin-related operations:
 * - Password re-authentication for admin sessions
 * - User management (with self-protection)
 * - Platform statistics
 * - Audit logging for every write action
 */

import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Film from '../models/Film.js';
import Investment from '../models/Investment.js';
import AuditLog from '../models/AuditLog.js';
import PlatformSettings from '../models/PlatformSettings.js';
import ChatMessage from '../models/ChatMessage.js';
import jwt from 'jsonwebtoken';
import { sendInvestmentStatusEmail } from '../utils/sendEmail.js';
import { createNotification } from './notificationController.js';
import { getIO } from '../config/socket.js';
import { getCryptoRates } from '../utils/cryptoRates.js';

/**
 * Push a role update to all active sockets belonging to a user.
 * This ensures real-time chat access changes without requiring a
 * page refresh.
 */
const _pushRoleUpdate = (userId, newRole) => {
  try {
    const io = getIO();
    const sockets = io?.sockets?.sockets;
    if (!sockets) return;
    for (const [, sock] of sockets) {
      if (sock.user?._id === userId) {
        sock.user.role = newRole;
        sock.emit('roleUpdated', { role: newRole });
      }
    }
  } catch { /* non-critical */ }
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Write an audit-log entry (fire-and-forget). */
const audit = (adminId, action, { targetModel, targetId, details, ip } = {}) => {
  AuditLog.create({ admin: adminId, action, targetModel, targetId, details, ip }).catch(
    (err) => console.error('Audit log write failed:', err.message)
  );
};

/**
 * @desc    Re-authenticate admin with password
 * @route   POST /api/admin/reauth
 * @access  Private/Admin
 *
 * Returns a short-lived admin-session token (2 h)
 * that the client stores and sends as X-Admin-Token
 * for all subsequent admin requests.
 */
export const reauthAdmin = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password) {
    res.status(400);
    throw new Error('Password is required');
  }

  // Fetch full user with password hash
  const user = await User.findById(req.user._id).select('+password');

  if (!user || !user.password) {
    res.status(401);
    throw new Error('Password authentication not available for this account');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Incorrect password');
  }

  // Issue a short-lived admin session token (2 hours)
  const adminToken = jwt.sign(
    { id: user._id.toString(), adminSession: true },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  audit(user._id, 'admin_reauth', {
    targetModel: 'Session',
    ip: req.ip,
  });

  res.json({ adminToken, expiresIn: 2 * 60 * 60 * 1000 }); // ms
});

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role } = req.query;

  const query = {};
  if (role) query.role = role;

  const users = await User.find(query)
    .select('-password')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(query);

  res.json({
    users,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Update user role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private/Admin
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  // Prevent admins from changing their own role
  if (req.params.id === req.user._id.toString()) {
    res.status(403);
    throw new Error('You cannot change your own role');
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const previousRole = user.role;
  user.role = role;
  await user.save();

  audit(req.user._id, 'update_user_role', {
    targetModel: 'User',
    targetId: user._id,
    details: { previousRole, newRole: role, userName: user.name },
    ip: req.ip,
  });

  res.json({ message: 'User role updated', role: user.role });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
export const deleteUser = asyncHandler(async (req, res) => {
  // Prevent admins from deleting themselves
  if (req.params.id === req.user._id.toString()) {
    res.status(403);
    throw new Error('You cannot delete your own account from admin panel');
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Prevent deleting other admins
  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot delete another admin account');
  }

  audit(req.user._id, 'delete_user', {
    targetModel: 'User',
    targetId: user._id,
    details: { email: user.email, name: user.name },
    ip: req.ip,
  });

  await user.deleteOne();
  res.json({ message: 'User removed' });
});

/**
 * @desc    Get platform statistics
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
export const getPlatformStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalFilms,
    totalInvestments,
    totalFunding,
  ] = await Promise.all([
    User.countDocuments(),
    Film.countDocuments(),
    Investment.countDocuments({ status: 'confirmed' }),
    Investment.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const vipUsers = await User.countDocuments({ role: 'vip' });
  const activeFilms = await Film.countDocuments({ status: 'funding' });

  res.json({
    totalUsers,
    vipUsers,
    totalFilms,
    activeFilms,
    totalInvestments,
    totalFunding: totalFunding[0]?.total || 0,
  });
});

/**
 * @desc    Get all investments (admin view)
 * @route   GET /api/admin/investments
 * @access  Private/Admin
 */
export const getAllInvestments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const query = {};
  if (status) query.status = status;

  const investments = await Investment.find(query)
    .populate('user', 'name email')
    .populate('film', 'title')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await Investment.countDocuments(query);

  res.json({
    investments,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total,
  });
});

/**
 * @desc    Update investment status
 * @route   PUT /api/admin/investments/:id/status
 * @access  Private/Admin
 */
export const updateInvestmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const investment = await Investment.findById(req.params.id)
    .populate('user', 'name email')
    .populate('film', 'title');

  if (!investment) {
    res.status(404);
    throw new Error('Investment not found');
  }

  const previousStatus = investment.status;
  investment.status = status;
  if (status === 'confirmed' && !investment.verifiedAt) {
    investment.verifiedAt = new Date();
  }
  await investment.save();

  audit(req.user._id, 'update_investment_status', {
    targetModel: 'Investment',
    targetId: investment._id,
    details: { previousStatus, newStatus: status },
    ip: req.ip,
  });

  // ── Notify the investor via email + in-app notification ──
  const userName = investment.user?.name || 'Investor';
  const userEmail = investment.user?.email;
  const filmTitle = investment.film?.title || 'a film';
  const amount = investment.amount;

  const statusLabels = {
    confirmed: 'approved and confirmed',
    failed: 'rejected',
    refunded: 'refunded',
    pending: 'set back to pending',
  };

  // In-app notification
  if (investment.user?._id) {
    const notifTitles = {
      confirmed: 'Investment Approved \u2713',
      failed: 'Investment Rejected',
      refunded: 'Investment Refunded',
      pending: 'Investment Updated',
    };
    await createNotification({
      userId: investment.user._id,
      title: notifTitles[status] || 'Investment Updated',
      message: `Your $${amount.toLocaleString()} investment in "${filmTitle}" has been ${statusLabels[status] || 'updated'}.`,
      type: 'investment',
      link: '/dashboard/investments',
    });
  }

  // Email notification (non-blocking)
  if (userEmail && status !== 'pending') {
    sendInvestmentStatusEmail(userEmail, userName, filmTitle, amount, status).catch(() => {});
  }

  // ── Auto-promote / demote VIP based on confirmed investment threshold ──
  const VIP_THRESHOLD = 20_000; // $20,000 USD equivalent

  // Fetch live USD conversion rates (cached 10 min, falls back to hardcoded)
  const rates = await getCryptoRates();

  if (investment.user?._id) {
    const investor = await User.findById(investment.user._id);
    if (investor) {
      // Sum confirmed investments converted to USD
      const confirmedInvestments = await Investment.find({
        user: investor._id,
        status: 'confirmed',
      }).select('amount currency');

      const confirmedTotalUSD = confirmedInvestments.reduce((sum, inv) => {
        const rate = rates[inv.currency] || 1;
        return sum + inv.amount * rate;
      }, 0);

      if (status === 'confirmed' && investor.role === 'user' && confirmedTotalUSD >= VIP_THRESHOLD) {
        // ── Promote to VIP ──
        investor.role = 'vip';
        await investor.save();

        audit(req.user._id, 'auto_promote_vip', {
          targetModel: 'User',
          targetId: investor._id,
          details: { confirmedTotalUSD, threshold: VIP_THRESHOLD },
          ip: req.ip,
        });

        await createNotification({
          userId: investor._id,
          title: 'VIP Status Unlocked! 🎉',
          message: `Congratulations! Your confirmed investments have reached $${Math.round(confirmedTotalUSD).toLocaleString()}, unlocking VIP access to all chat rooms and exclusive features.`,
          type: 'promotion',
          link: '/chat',
        });

        // Push role update to any active sockets for this user
        _pushRoleUpdate(investor._id.toString(), 'vip');

      } else if (
        (status === 'refunded' || status === 'failed') &&
        investor.role === 'vip' &&
        confirmedTotalUSD < VIP_THRESHOLD
      ) {
        // ── Demote from VIP ──
        investor.role = 'user';
        await investor.save();

        audit(req.user._id, 'auto_demote_vip', {
          targetModel: 'User',
          targetId: investor._id,
          details: { confirmedTotalUSD, threshold: VIP_THRESHOLD },
          ip: req.ip,
        });

        await createNotification({
          userId: investor._id,
          title: 'VIP Status Changed',
          message: `Your confirmed investments have dropped below $${VIP_THRESHOLD.toLocaleString()}. VIP chat access has been paused — invest more to regain it!`,
          type: 'promotion',
          link: '/dashboard/investments',
        });

        // Push role update to any active sockets for this user
        _pushRoleUpdate(investor._id.toString(), 'user');
      }
    }
  }

  res.json({ message: 'Investment status updated', status: investment.status });
});

/**
 * @desc    Get recent audit logs
 * @route   GET /api/admin/audit-logs
 * @access  Private/Admin
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, action } = req.query;

  const query = {};
  if (action) query.action = action;

  const logs = await AuditLog.find(query)
    .populate('admin', 'name email')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const total = await AuditLog.countDocuments(query);

  res.json({
    logs,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
    total,
  });
});

// ──────────────────────────────────────────────
// Platform Wallet Management
// ──────────────────────────────────────────────

/**
 * @desc    Get platform wallet addresses
 * @route   GET /api/admin/wallets
 * @access  Private/Admin
 */
export const getPlatformWallets = asyncHandler(async (req, res) => {
  const settings = await PlatformSettings.getSettings();
  res.json({
    wallets: settings.wallets,
    updatedAt: settings.updatedAt,
    updatedBy: settings.updatedBy,
  });
});

/**
 * @desc    Update platform wallet addresses
 * @route   PUT /api/admin/wallets
 * @access  Private/Admin (requires admin session)
 *
 * Body: { wallets: { ETH?: string, BTC?: string, USDT?: string, USDC?: string } }
 */
export const updatePlatformWallets = asyncHandler(async (req, res) => {
  const { wallets } = req.body;

  if (!wallets || typeof wallets !== 'object') {
    res.status(400);
    throw new Error('wallets object is required');
  }

  // Basic format validation
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  const btcRegex = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/;

  const errors = [];
  if (wallets.ETH && !ethRegex.test(wallets.ETH.trim())) {
    errors.push('ETH address must be a valid 0x… address (42 characters)');
  }
  if (wallets.BTC && !btcRegex.test(wallets.BTC.trim())) {
    errors.push('BTC address format is invalid');
  }
  // USDT & USDC are ERC-20 on Ethereum — same format as ETH
  if (wallets.USDT && !ethRegex.test(wallets.USDT.trim())) {
    errors.push('USDT address must be a valid Ethereum 0x… address');
  }
  if (wallets.USDC && !ethRegex.test(wallets.USDC.trim())) {
    errors.push('USDC address must be a valid Ethereum 0x… address');
  }

  if (errors.length > 0) {
    res.status(400);
    throw new Error(errors.join('; '));
  }

  const settings = await PlatformSettings.getSettings();
  const previousWallets = { ...settings.wallets.toObject() };

  // Merge — only update provided keys (allow clearing with empty string)
  for (const currency of ['ETH', 'BTC', 'USDT', 'USDC']) {
    if (currency in wallets) {
      settings.wallets[currency] = wallets[currency]?.trim() || '';
    }
  }
  settings.updatedBy = req.user._id;
  await settings.save();

  audit(req.user._id, 'update_platform_wallets', {
    targetModel: 'PlatformSettings',
    targetId: settings._id,
    details: { previousWallets, newWallets: settings.wallets.toObject() },
    ip: req.ip,
  });

  res.json({
    message: 'Platform wallet addresses updated',
    wallets: settings.wallets,
  });
});

// ──────────────────────────────────────────────
// Chat Management
// ──────────────────────────────────────────────

/**
 * @desc    Get chat messages for a room (admin)
 * @route   GET /api/admin/chat/:roomId
 * @access  Admin
 */
export const getAdminChatMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { page = 1, limit = 50, search } = req.query;

  const query = { roomId };
  if (search) {
    query.message = { $regex: search, $options: 'i' };
  }

  const total = await ChatMessage.countDocuments(query);
  const messages = await ChatMessage.find(query)
    .populate('sender', 'name email avatar role')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({
    messages: messages.reverse(),
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
  });
});

/**
 * @desc    Delete a chat message (admin)
 * @route   DELETE /api/admin/chat/:messageId
 * @access  Admin (requires admin session)
 */
export const adminDeleteMessage = asyncHandler(async (req, res) => {
  const message = await ChatMessage.findById(req.params.messageId);

  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }

  const { roomId, _id: messageId, sender, message: text } = message;
  await message.deleteOne();

  audit(req.user._id, 'delete_chat_message', {
    targetModel: 'ChatMessage',
    targetId: messageId,
    details: { roomId, sender, messagePreview: text?.substring(0, 100) },
    ip: req.ip,
  });

  res.json({ message: 'Message deleted', messageId, roomId });
});

/**
 * @desc    Get chat stats for admin dashboard
 * @route   GET /api/admin/chat/stats
 * @access  Admin
 */
export const getChatStats = asyncHandler(async (req, res) => {
  const totalMessages = await ChatMessage.countDocuments();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const messagesToday = await ChatMessage.countDocuments({ createdAt: { $gte: today } });

  // Messages per room
  const roomStats = await ChatMessage.aggregate([
    { $group: { _id: '$roomId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Active users (unique senders in last 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const activeUsers = await ChatMessage.distinct('sender', { createdAt: { $gte: oneDayAgo } });

  res.json({
    totalMessages,
    messagesToday,
    roomStats,
    activeUsersCount: activeUsers.length,
  });
});

/**
 * ===========================================
 * Investment Controller
 * ===========================================
 * 
 * Handles investment-related operations:
 * - Create investments
 * - Get user investments
 * - Calculate and track ROI
 */

import asyncHandler from 'express-async-handler';
import Investment from '../models/Investment.js';
import Film from '../models/Film.js';
import User from '../models/User.js';
import { calculateROI } from '../utils/calculateROI.js';
import { createNotification } from './notificationController.js';
import { sendInvestmentEmail } from '../utils/sendEmail.js';
import { verifyTransaction } from '../utils/verifyTransaction.js';
import { getCryptoRates } from '../utils/cryptoRates.js';

/**
 * @desc    Create a new investment
 * @route   POST /api/investments
 * @access  Private
 */
export const createInvestment = asyncHandler(async (req, res) => {
  const { filmId, amount, currency, paymentMethod, transactionHash } = req.body;

  // Verify film exists and is open for funding
  const film = await Film.findById(filmId);
  if (!film) {
    res.status(404);
    throw new Error('Film not found');
  }

  if (film.status !== 'funding') {
    res.status(400);
    throw new Error('This film is not currently accepting investments');
  }

  if (amount < film.minInvestment) {
    res.status(400);
    throw new Error(`Minimum investment is ${film.minInvestment}`);
  }

  // ── Crypto-specific checks ──
  let verificationResult = null;
  let investmentStatus = 'pending';
  let verificationNote = '';

  if (paymentMethod === 'crypto') {
    if (!transactionHash || !transactionHash.trim()) {
      res.status(400);
      throw new Error('Transaction hash is required for crypto payments');
    }

    // Prevent duplicate transaction hashes
    const existingTx = await Investment.findOne({
      transactionHash: transactionHash.trim(),
    });
    if (existingTx) {
      res.status(400);
      throw new Error('This transaction hash has already been used for another investment');
    }

    // Verify on-chain (only for blockchain-native currencies)
    const verifiableCurrencies = ['ETH', 'BTC', 'USDT', 'USDC'];
    if (!verifiableCurrencies.includes(currency)) {
      // Non-crypto currency (e.g. USD) with crypto payment — skip verification
      investmentStatus = 'pending';
      verificationNote = `Currency ${currency} cannot be verified on-chain — pending manual review`;
    } else {
      verificationResult = await verifyTransaction(transactionHash, currency, amount);

    if (verificationResult.verified) {
      // Tx is legit on-chain — still pending admin approval
      investmentStatus = 'pending';
      verificationNote = `Verified on-chain — block ${verificationResult.details?.blockNumber || verificationResult.details?.blockHeight || 'N/A'}, ${verificationResult.details?.confirmations ?? '—'} confirmations. Awaiting admin approval.`;
    } else if (verificationResult.skipped) {
      // RPC not configured — fall back to pending (admin can verify manually)
      investmentStatus = 'pending';
      verificationNote = verificationResult.reason;
    } else if (verificationResult.pending) {
      // Tx exists but not yet mined — allow as pending
      investmentStatus = 'pending';
      verificationNote = verificationResult.reason;
    } else {
      // Tx not found or failed on-chain — reject
      res.status(400);
      throw new Error(verificationResult.reason || 'Transaction could not be verified on the blockchain');
    }
    } // end verifiable currency check
  }

  // Calculate ownership percentage = investment / target budget
  const ownershipPercentage = (amount / film.targetBudget) * 100;

  // Create investment
  const investment = await Investment.create({
    user: req.user._id,
    film: filmId,
    amount,
    currency,
    paymentMethod,
    transactionHash: transactionHash?.trim() || null,
    ownershipPercentage,
    status: investmentStatus,
    verifiedAt: null,
    verificationNote,
  });

  // Update film funding
  film.currentFunding += amount;
  film.totalInvestors += 1;
  await film.save();

  // Update user total invested
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalInvested: amount },
  });

  // Create notification for the investor
  await createNotification({
    userId: req.user._id,
    title: 'Investment Submitted',
    message: `Your $${amount.toLocaleString()} investment in "${film.title}" has been submitted and is pending admin approval.`,
    type: 'investment',
    link: `/dashboard/investments`,
  });

  // Send investment confirmation email (non-blocking)
  if (req.user.email) {
    sendInvestmentEmail(req.user.email, req.user.name, film.title, amount).catch(() => {});
  }

  // Return populated investment
  const populated = await Investment.findById(investment._id)
    .populate('film', 'title poster status expectedROI targetBudget revenue currentFunding');

  res.status(201).json(populated);
});

/**
 * @desc    Get user's investments
 * @route   GET /api/investments
 * @access  Private
 */
export const getUserInvestments = asyncHandler(async (req, res) => {
  const investments = await Investment.find({ user: req.user._id })
    .populate('film', 'title poster status expectedROI targetBudget revenue currentFunding')
    .sort({ createdAt: -1 });

  res.json(investments);
});

/**
 * @desc    Get single investment
 * @route   GET /api/investments/:id
 * @access  Private
 */
export const getInvestmentById = asyncHandler(async (req, res) => {
  const investment = await Investment.findById(req.params.id).populate(
    'film',
    'title poster status expectedROI currentFunding targetBudget'
  );

  if (investment && investment.user.toString() === req.user._id.toString()) {
    res.json(investment);
  } else {
    res.status(404);
    throw new Error('Investment not found');
  }
});

/**
 * @desc    Get ROI statistics for user
 * @route   GET /api/investments/roi
 * @access  Private
 */
export const getROIStatistics = asyncHandler(async (req, res) => {
  const investments = await Investment.find({
    user: req.user._id,
    status: { $in: ['confirmed', 'pending'] },
  }).populate('film', 'expectedROI status title targetBudget revenue');

  const stats = calculateROI(investments);

  res.json(stats);
});

/**
 * @desc    Get all investments for a specific film
 * @route   GET /api/investments/film/:filmId
 * @access  Private/Admin
 */
export const getFilmInvestments = asyncHandler(async (req, res) => {
  const investments = await Investment.find({ film: req.params.filmId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  res.json(investments);
});

/**
 * @desc    Cancel a pending investment (user can cancel their own)
 * @route   PUT /api/investments/:id/cancel
 * @access  Private
 */
export const cancelInvestment = asyncHandler(async (req, res) => {
  const investment = await Investment.findById(req.params.id).populate('film', 'title currentFunding totalInvestors');

  if (!investment) {
    res.status(404);
    throw new Error('Investment not found');
  }

  // Only the owner can cancel
  if (investment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  // Can only cancel pending investments
  if (investment.status !== 'pending') {
    res.status(400);
    throw new Error('Only pending investments can be cancelled. Contact support for confirmed investments.');
  }

  investment.status = 'failed';
  investment.verificationNote = 'Cancelled by investor';
  await investment.save();

  // Reverse the film funding stats
  if (investment.film) {
    await Film.findByIdAndUpdate(investment.film._id, {
      $inc: { currentFunding: -investment.amount, totalInvestors: -1 },
    });
  }

  // Reverse user total invested
  await User.findByIdAndUpdate(req.user._id, {
    $inc: { totalInvested: -investment.amount },
  });

  await createNotification({
    userId: req.user._id,
    title: 'Investment Cancelled',
    message: `Your $${investment.amount.toLocaleString()} investment in "${investment.film?.title || 'a film'}" has been cancelled.`,
    type: 'investment',
    link: '/dashboard/investments',
  });

  res.json({ message: 'Investment cancelled', status: investment.status });
});

/**
 * @desc    Request a refund for a confirmed investment
 * @route   PUT /api/investments/:id/refund-request
 * @access  Private
 */
export const requestRefund = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const investment = await Investment.findById(req.params.id).populate('film', 'title');

  if (!investment) {
    res.status(404);
    throw new Error('Investment not found');
  }

  if (investment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (investment.status !== 'confirmed') {
    res.status(400);
    throw new Error('Only confirmed investments can request a refund');
  }

  // Mark as pending refund review (keep confirmed status — admin will process)
  investment.verificationNote = `Refund requested: ${reason || 'No reason provided'}. Previous note: ${investment.verificationNote}`;
  await investment.save();

  await createNotification({
    userId: req.user._id,
    title: 'Refund Request Submitted',
    message: `Your refund request for the $${investment.amount.toLocaleString()} investment in "${investment.film?.title}" has been submitted and is under review.`,
    type: 'investment',
    link: '/dashboard/investments',
  });

  res.json({ message: 'Refund request submitted. An admin will review it shortly.' });
});

/**
 * @desc    Distribute dividends for a film to all confirmed investors
 * @route   POST /api/investments/film/:filmId/dividends
 * @access  Private/Admin
 */
export const distributeDividends = asyncHandler(async (req, res) => {
  const { totalPayout } = req.body;

  if (!totalPayout || totalPayout <= 0) {
    res.status(400);
    throw new Error('Total payout amount is required and must be greater than 0');
  }

  const film = await Film.findById(req.params.filmId);
  if (!film) {
    res.status(404);
    throw new Error('Film not found');
  }

  // Get all confirmed investments for this film
  const investments = await Investment.find({
    film: req.params.filmId,
    status: 'confirmed',
  }).populate('user', 'name email');

  if (investments.length === 0) {
    res.status(400);
    throw new Error('No confirmed investments found for this film');
  }

  // Calculate total invested to determine each investor's share
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

  const payouts = [];

  for (const inv of investments) {
    // Each investor's share = (their investment / total invested) * totalPayout
    const share = (inv.amount / totalInvested) * totalPayout;
    const roundedShare = Math.round(share * 100) / 100;

    inv.dividendsPaid = (inv.dividendsPaid || 0) + roundedShare;
    inv.roi = inv.amount > 0
      ? Math.round(((inv.dividendsPaid - inv.amount) / inv.amount) * 10000) / 100
      : 0;
    await inv.save();

    payouts.push({
      userId: inv.user?._id,
      userName: inv.user?.name,
      invested: inv.amount,
      payout: roundedShare,
      totalDividendsPaid: inv.dividendsPaid,
      roi: inv.roi,
    });

    // Notify each investor
    if (inv.user?._id) {
      await createNotification({
        userId: inv.user._id,
        title: 'Dividend Payment 💰',
        message: `You received a $${roundedShare.toLocaleString()} dividend payout from "${film.title}". Total dividends received: $${inv.dividendsPaid.toLocaleString()}.`,
        type: 'roi',
        link: '/dashboard/investments',
      });
    }
  }

  res.json({
    message: 'Dividends distributed successfully',
    film: film.title,
    totalPayout,
    investorCount: payouts.length,
    payouts,
  });
});

/**
 * @desc    Get user's investment portfolio summary
 * @route   GET /api/investments/portfolio
 * @access  Private
 */
export const getPortfolio = asyncHandler(async (req, res) => {
  const investments = await Investment.find({
    user: req.user._id,
    status: 'confirmed',
  }).populate('film', 'title poster status expectedROI targetBudget revenue currentFunding genre');

  const rates = await getCryptoRates();

  let totalInvestedUSD = 0;
  let totalDividends = 0;

  const holdings = investments.map((inv) => {
    const rate = rates[inv.currency] || 1;
    const investedUSD = inv.amount * rate;
    totalInvestedUSD += investedUSD;
    totalDividends += inv.dividendsPaid || 0;

    return {
      investmentId: inv._id,
      filmTitle: inv.film?.title,
      filmPoster: inv.film?.poster,
      filmStatus: inv.film?.status,
      amount: inv.amount,
      currency: inv.currency,
      amountUSD: Math.round(investedUSD * 100) / 100,
      ownershipPercentage: inv.ownershipPercentage,
      dividendsPaid: inv.dividendsPaid,
      roi: inv.roi,
      createdAt: inv.createdAt,
    };
  });

  res.json({
    totalInvestedUSD: Math.round(totalInvestedUSD * 100) / 100,
    totalDividends: Math.round(totalDividends * 100) / 100,
    overallROI: totalInvestedUSD > 0
      ? Math.round(((totalDividends - totalInvestedUSD) / totalInvestedUSD) * 10000) / 100
      : 0,
    holdingsCount: holdings.length,
    holdings,
  });
});

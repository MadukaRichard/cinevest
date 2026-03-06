/**
 * ===========================================
 * Investment Routes
 * ===========================================
 * 
 * Routes for investment operations and ROI tracking.
 * 
 * GET  /api/investments          - Get user's investments
 * POST /api/investments          - Create new investment
 * GET  /api/investments/roi      - Get ROI statistics
 * GET  /api/investments/:id      - Get single investment
 * GET  /api/investments/film/:id - Get film's investors (Admin)
 */

import express from 'express';
import {
  createInvestment,
  getUserInvestments,
  getInvestmentById,
  getROIStatistics,
  getFilmInvestments,
  cancelInvestment,
  requestRefund,
  distributeDividends,
  getPortfolio,
} from '../controllers/investmentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  validate,
  createInvestmentRules,
  mongoIdParam,
} from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// User routes
router.get('/', getUserInvestments);
router.post('/', createInvestmentRules, validate, createInvestment);
router.get('/roi', getROIStatistics);
router.get('/portfolio', getPortfolio);
router.get('/:id', mongoIdParam('id'), validate, getInvestmentById);
router.put('/:id/cancel', mongoIdParam('id'), validate, cancelInvestment);
router.put('/:id/refund-request', mongoIdParam('id'), validate, requestRefund);

// Admin routes
router.get('/film/:filmId', admin, mongoIdParam('filmId'), validate, getFilmInvestments);
router.post('/film/:filmId/dividends', admin, mongoIdParam('filmId'), validate, distributeDividends);

export default router;

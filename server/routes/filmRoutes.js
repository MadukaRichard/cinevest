/**
 * ===========================================
 * Film Routes
 * ===========================================
 * 
 * Routes for film project management.
 * 
 * GET    /api/films              - Get all films
 * GET    /api/films/featured     - Get featured films (public)
 * GET    /api/films/:id          - Get single film
 * POST   /api/films              - Create film (Admin + admin session)
 * PUT    /api/films/:id          - Update film (Admin + admin session)
 * PUT    /api/films/:id/featured - Toggle featured (Admin + admin session)
 * PUT    /api/films/featured/reorder - Reorder featured (Admin + admin session)
 * DELETE /api/films/:id          - Delete film (Admin + admin session)
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import {
  getFilms,
  getFeaturedFilms,
  getFilmById,
  getFilmRecommendations,
  createFilm,
  updateFilm,
  deleteFilm,
  toggleFeaturedFilm,
  reorderFeaturedFilms,
} from '../controllers/filmController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  validate,
  createFilmRules,
  updateFilmRules,
  mongoIdParam,
} from '../middleware/validate.js';

const router = express.Router();

// Reusable admin-session check (same logic as adminRoutes)
const requireAdminSession = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken) {
    res.status(403);
    throw new Error('Admin session required. Please re-authenticate.');
  }
  try {
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    if (!decoded.adminSession || decoded.id !== req.user._id.toString()) {
      throw new Error('Invalid admin token');
    }
    next();
  } catch (err) {
    res.status(403);
    throw new Error('Admin session expired or invalid. Please re-authenticate.');
  }
};

// Public routes - NOTE: /featured must come before /:id
router.get('/', getFilms);
router.get('/featured', getFeaturedFilms);
router.get('/:id', mongoIdParam('id'), validate, getFilmById);
router.get('/:id/recommendations', mongoIdParam('id'), validate, getFilmRecommendations);

// Admin-only routes (require admin session token)
router.post('/', protect, admin, requireAdminSession, createFilmRules, validate, createFilm);
router.put('/featured/reorder', protect, admin, requireAdminSession, reorderFeaturedFilms);
router.put('/:id', protect, admin, requireAdminSession, mongoIdParam('id'), updateFilmRules, validate, updateFilm);
router.put('/:id/featured', protect, admin, requireAdminSession, mongoIdParam('id'), toggleFeaturedFilm);
router.delete('/:id', protect, admin, requireAdminSession, mongoIdParam('id'), validate, deleteFilm);

export default router;

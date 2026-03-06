/**
 * ===========================================
 * Film Controller
 * ===========================================
 * 
 * Handles film-related operations:
 * - Get all films
 * - Get single film
 * - Create/Update/Delete films (Admin)
 */

import asyncHandler from 'express-async-handler';
import Film from '../models/Film.js';
import AuditLog from '../models/AuditLog.js';
import { FILM_UPDATABLE_FIELDS } from '../middleware/validate.js';

/** Fire-and-forget audit entry */
const audit = (adminId, action, opts = {}) => {
  AuditLog.create({ admin: adminId, action, ...opts }).catch(
    (err) => console.error('Audit log write failed:', err.message)
  );
};

/**
 * @desc    Get all films
 * @route   GET /api/films
 * @access  Public
 */
export const getFilms = asyncHandler(async (req, res) => {
  const { status, genre, sort, search, page = 1, limit = 20 } = req.query;

  // Build query
  const query = {};
  if (status) query.status = status;
  if (genre) query.genre = { $in: [genre] };

  // Text search across title, description, director, cast
  if (search && search.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { title: regex },
      { description: regex },
      { director: regex },
      { cast: regex },
    ];
  }

  // Build sort options
  let sortOptions = { createdAt: -1 };
  if (sort === 'funding') sortOptions = { currentFunding: -1 };
  if (sort === 'deadline') sortOptions = { fundingDeadline: 1 };
  if (sort === 'popular') sortOptions = { totalInvestors: -1 };
  if (sort === 'roi') sortOptions = { expectedROI: -1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [films, total] = await Promise.all([
    Film.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit)),
    Film.countDocuments(query),
  ]);

  res.json({
    films,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
  });
});

/**
 * @desc    Get featured films (public)
 * @route   GET /api/films/featured
 * @access  Public
 */
export const getFeaturedFilms = asyncHandler(async (req, res) => {
  const films = await Film.find({ featured: true }).sort({ featuredOrder: 1, createdAt: -1 });
  res.json(films);
});

/**
 * @desc    Get single film by ID
 * @route   GET /api/films/:id
 * @access  Public
 */
export const getFilmById = asyncHandler(async (req, res) => {
  const film = await Film.findById(req.params.id);

  if (film) {
    res.json(film);
  } else {
    res.status(404);
    throw new Error('Film not found');
  }
});

/**
 * @desc    Create a new film
 * @route   POST /api/films
 * @access  Private/Admin
 */
export const createFilm = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    genre,
    director,
    cast,
    poster,
    trailer,
    targetBudget,
    minInvestment,
    expectedROI,
    fundingDeadline,
    releaseDate,
  } = req.body;

  const film = await Film.create({
    title,
    description,
    genre,
    director,
    cast,
    poster,
    trailer,
    targetBudget,
    minInvestment,
    expectedROI,
    fundingDeadline,
    releaseDate,
  });

  audit(req.user._id, 'create_film', {
    targetModel: 'Film',
    targetId: film._id,
    details: { title },
    ip: req.ip,
  });

  res.status(201).json(film);
});

/**
 * @desc    Update a film
 * @route   PUT /api/films/:id
 * @access  Private/Admin
 */
export const updateFilm = asyncHandler(async (req, res) => {
  const film = await Film.findById(req.params.id);

  if (film) {
    // Only allow updating safe fields — prevents mass-assignment
    // of _id, currentFunding, totalInvestors, etc.
    for (const key of FILM_UPDATABLE_FIELDS) {
      if (req.body[key] !== undefined) {
        film[key] = req.body[key];
      }
    }
    const updatedFilm = await film.save();

    audit(req.user._id, 'update_film', {
      targetModel: 'Film',
      targetId: film._id,
      details: { title: film.title, updatedFields: Object.keys(req.body) },
      ip: req.ip,
    });

    res.json(updatedFilm);
  } else {
    res.status(404);
    throw new Error('Film not found');
  }
});

/**
 * @desc    Delete a film
 * @route   DELETE /api/films/:id
 * @access  Private/Admin
 */
export const deleteFilm = asyncHandler(async (req, res) => {
  const film = await Film.findById(req.params.id);

  if (film) {
    audit(req.user._id, 'delete_film', {
      targetModel: 'Film',
      targetId: film._id,
      details: { title: film.title },
      ip: req.ip,
    });

    await film.deleteOne();
    res.json({ message: 'Film removed' });
  } else {
    res.status(404);
    throw new Error('Film not found');
  }
});

/**
 * @desc    Toggle featured status of a film
 * @route   PUT /api/films/:id/featured
 * @access  Private/Admin
 */
export const toggleFeaturedFilm = asyncHandler(async (req, res) => {
  const { featured, featuredOrder } = req.body;

  const film = await Film.findById(req.params.id);
  if (!film) {
    res.status(404);
    throw new Error('Film not found');
  }

  if (typeof featured === 'boolean') film.featured = featured;
  if (typeof featuredOrder === 'number') film.featuredOrder = featuredOrder;

  await film.save();

  audit(req.user._id, 'update_film', {
    targetModel: 'Film',
    targetId: film._id,
    details: { title: film.title, featured: film.featured, featuredOrder: film.featuredOrder },
    ip: req.ip,
  });

  res.json({
    _id: film._id,
    title: film.title,
    featured: film.featured,
    featuredOrder: film.featuredOrder,
  });
});

/**
 * @desc    Bulk update featured order for multiple films
 * @route   PUT /api/films/featured/reorder
 * @access  Private/Admin
 */
export const reorderFeaturedFilms = asyncHandler(async (req, res) => {
  const { items } = req.body; // [{ id, featuredOrder }]

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Items array is required');
  }

  const bulkOps = items.map(({ id, featuredOrder }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { featuredOrder } },
    },
  }));

  await Film.bulkWrite(bulkOps);

  audit(req.user._id, 'update_film', {
    targetModel: 'Film',
    details: { action: 'reorder_featured', count: items.length },
    ip: req.ip,
  });

  res.json({ message: 'Featured order updated', count: items.length });
});

/**
 * @desc    Get film recommendations based on a film's genre
 * @route   GET /api/films/:id/recommendations
 * @access  Public
 */
export const getFilmRecommendations = asyncHandler(async (req, res) => {
  const film = await Film.findById(req.params.id);
  if (!film) {
    res.status(404);
    throw new Error('Film not found');
  }

  const { limit = 4 } = req.query;

  // Find films that share genres, excluding the current film
  const recommendations = await Film.find({
    _id: { $ne: film._id },
    genre: { $in: film.genre },
    status: { $in: ['funding', 'upcoming', 'in-production'] },
  })
    .sort({ totalInvestors: -1, createdAt: -1 })
    .limit(parseInt(limit));

  // If not enough recommendations from genre, pad with popular films
  if (recommendations.length < parseInt(limit)) {
    const existing = [film._id, ...recommendations.map((f) => f._id)];
    const extra = await Film.find({
      _id: { $nin: existing },
      status: { $in: ['funding', 'upcoming', 'in-production'] },
    })
      .sort({ totalInvestors: -1 })
      .limit(parseInt(limit) - recommendations.length);
    recommendations.push(...extra);
  }

  res.json(recommendations);
});

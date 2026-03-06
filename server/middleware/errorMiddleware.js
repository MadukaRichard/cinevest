/**
 * ===========================================
 * Error Handling Middleware
 * ===========================================
 * 
 * Centralized error handling for the API.
 * Formats error responses consistently.
 * Logs errors via Winston.
 */

import logger from '../config/logger.js';

/**
 * Handle 404 - Route not found
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global error handler
 */
export const errorHandler = (err, req, res, next) => {
  // Sometimes error comes with 200 status, convert to 500
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0];
    if (field === 'walletAddress') {
      message = 'This wallet address is already linked to another account';
    } else if (field === 'email') {
      message = 'An account with this email already exists';
    } else {
      message = `Duplicate value for ${field || 'field'}`;
    }
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });

  // Log the error (warn for 4xx, error for 5xx)
  const logData = { statusCode, url: req.originalUrl, method: req.method, ip: req.ip };
  if (statusCode >= 500) {
    logger.error(message, { ...logData, stack: err.stack });
  } else {
    logger.warn(message, logData);
  }
};

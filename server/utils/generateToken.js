/**
 * ===========================================
 * JWT Token Generator Utility
 * ===========================================
 * 
 * Generates JWT tokens for user authentication.
 */

import jwt from 'jsonwebtoken';

/**
 * Generate short-lived access token
 * @param {string} id - User ID
 * @returns {string} JWT access token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

/**
 * Generate long-lived refresh token
 * @param {string} id - User ID
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '90d',
  });
};

export default generateToken;

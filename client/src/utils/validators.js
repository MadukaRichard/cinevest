/**
 * ===========================================
 * Validation Utilities
 * ===========================================
 * 
 * Helper functions for form validation.
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with strength score
 */
export const validatePassword = (password) => {
  const result = {
    isValid: false,
    score: 0,
    errors: [],
  };

  if (password.length < 6) {
    result.errors.push('Password must be at least 6 characters');
  } else {
    result.score += 1;
  }

  if (password.length >= 8) {
    result.score += 1;
  }

  if (/[A-Z]/.test(password)) {
    result.score += 1;
  } else {
    result.errors.push('Add uppercase letter for stronger password');
  }

  if (/[0-9]/.test(password)) {
    result.score += 1;
  } else {
    result.errors.push('Add number for stronger password');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    result.score += 1;
  }

  result.isValid = result.errors.length === 0 || result.score >= 3;

  return result;
};

/**
 * Validate Ethereum wallet address
 * @param {string} address - Wallet address to validate
 * @returns {boolean} Is valid address
 */
export const isValidWalletAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Validate investment amount
 * @param {number} amount - Amount to validate
 * @param {number} minInvestment - Minimum allowed
 * @param {number} maxInvestment - Maximum allowed (optional)
 * @returns {object} Validation result
 */
export const validateInvestmentAmount = (amount, minInvestment, maxInvestment) => {
  const result = {
    isValid: true,
    error: null,
  };

  if (!amount || amount <= 0) {
    result.isValid = false;
    result.error = 'Please enter a valid amount';
  } else if (amount < minInvestment) {
    result.isValid = false;
    result.error = `Minimum investment is $${minInvestment}`;
  } else if (maxInvestment && amount > maxInvestment) {
    result.isValid = false;
    result.error = `Maximum investment is $${maxInvestment}`;
  }

  return result;
};

/**
 * Validate required fields
 * @param {object} data - Form data object
 * @param {array} requiredFields - Array of required field names
 * @returns {object} Validation result
 */
export const validateRequired = (data, requiredFields) => {
  const errors = {};
  
  requiredFields.forEach((field) => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      errors[field] = 'This field is required';
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

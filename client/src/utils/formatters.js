/**
 * ===========================================
 * Format Utilities
 * ===========================================
 * 
 * Helper functions for formatting data.
 */

/**
 * Format currency value
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format large numbers with abbreviations
 * @param {number} num - Number to format
 * @returns {string} Formatted number (e.g., 1.5M, 2.3K)
 */
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Format percentage
 * @param {number} value - Value to format
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 2) => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format date
 * @param {Date|string} date - Date to format
 * @param {string} format - Format style (default: 'medium')
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = 'medium') => {
  const dateObj = new Date(date);
  
  const options = {
    short: { month: 'short', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  };

  return dateObj.toLocaleDateString('en-US', options[format] || options.medium);
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format wallet address
 * @param {string} address - Wallet address
 * @param {number} chars - Characters to show at start/end
 * @returns {string} Formatted address
 */
export const formatWalletAddress = (address, chars = 6) => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

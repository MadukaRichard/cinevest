/**
 * ===========================================
 * useLocalStorage Hook
 * ===========================================
 * 
 * Custom hook for persistent local storage state.
 */

import { useState, useEffect } from 'react';

/**
 * Use local storage with React state
 * @param {string} key - Storage key
 * @param {any} initialValue - Initial value
 * @returns {array} [value, setValue]
 */
export function useLocalStorage(key, initialValue) {
  // Get initial value from storage or use provided initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

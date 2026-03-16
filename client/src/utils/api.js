/**
 * ===========================================
 * API Utility
 * ===========================================
 * 
 * Axios instance with interceptors for API calls.
 * Includes silent refresh on 401 errors.
 */

import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000, // 15s timeout — prevents infinite loading on cold-start/SMTP hangs
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if a refresh is in-flight to avoid thundering herd
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Attach admin session token if present (for admin write operations)
    const adminToken = sessionStorage.getItem('cinevest-admin-token');
    if (adminToken) {
      config.headers['X-Admin-Token'] = adminToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — silent refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh for 401 errors, not for auth routes themselves
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/register')
    ) {
      if (isRefreshing) {
        // Queue this request until the refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Get refresh token from persisted store
        const stored = JSON.parse(localStorage.getItem('cinevest-auth') || '{}');
        const refreshToken = stored?.state?.refreshToken;

        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );

        const newToken = data.token;

        // Update stored token
        if (stored?.state) {
          stored.state.token = newToken;
          localStorage.setItem('cinevest-auth', JSON.stringify(stored));
        }

        // Update default header
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

        processQueue(null, newToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh failed — full logout
        localStorage.removeItem('cinevest-auth');
        sessionStorage.removeItem('cinevest-admin-token');
        sessionStorage.removeItem('cinevest-admin-token-expiry');
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
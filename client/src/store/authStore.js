/**
 * ===========================================
 * Auth Store
 * ===========================================
 * 
 * Zustand store for authentication state management.
 * Handles user login, registration, and session.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';
import { useChatStore } from './chatStore';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, refreshToken, ...user } = response.data;

          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          // Set token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          return { user, requiresVerification: false };
        } catch (error) {
          const data = error.response?.data;
          const message = data?.message || 'Login failed';
          set({ isLoading: false, error: message });
          
          // Check if verification is required
          if (data?.requiresVerification) {
            const verificationError = new Error(message);
            verificationError.requiresVerification = true;
            verificationError.email = data.email;
            throw verificationError;
          }
          
          throw new Error(message);
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', {
            name,
            email,
            password,
          });

          // Don't sign in - just return response for verification flow
          set({ isLoading: false });
          
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      // Set auth data after verification
      setAuthData: ({ user, token, refreshToken }) => {
        set({
          user,
          token,
          refreshToken: refreshToken || get().refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      // Update user's role (called when server pushes a role change via socket)
      setUserRole: (role) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, role } });
        }
      },

      logout: () => {
        // Disconnect chat socket so next user gets a fresh connection
        useChatStore.getState().disconnect();

        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        delete api.defaults.headers.common['Authorization'];
        // Clear admin session
        sessionStorage.removeItem('cinevest-admin-token');
        sessionStorage.removeItem('cinevest-admin-token-expiry');
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put('/auth/profile', data);
          const currentUser = get().user || {};
          set({ user: { ...currentUser, ...response.data }, isLoading: false });
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Update failed';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      connectWallet: async (walletAddress) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put('/auth/wallet', { walletAddress });
          const currentUser = get().user || {};
          set({
            user: { ...currentUser, walletAddress: response.data.walletAddress },
            isLoading: false,
          });
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Wallet connection failed';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      disconnectWallet: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put('/auth/wallet', { walletAddress: null });
          const currentUser = get().user || {};
          set({
            user: { ...currentUser, walletAddress: null },
            isLoading: false,
          });
          return response.data;
        } catch (error) {
          const message = error.response?.data?.message || 'Wallet disconnection failed';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      /**
       * Wallet-based authentication (sign-in / sign-up via wallet signature)
       * 1. Request a nonce from the server
       * 2. Sign the nonce with the wallet
       * 3. Send signature for verification → receive JWT
       */
      walletAuth: async (walletAddress, signMessageFn) => {
        set({ isLoading: true, error: null });
        try {
          // Step 1: Get nonce
          const nonceRes = await api.post('/auth/wallet-nonce', { walletAddress });
          const { message } = nonceRes.data;

          // Step 2: Sign the message (callback to the wallet provider)
          const signature = await signMessageFn(message);

          // Step 3: Verify signature
          const verifyRes = await api.post('/auth/wallet-verify', {
            walletAddress,
            signature,
            message,
          });

          const { token, refreshToken, ...user } = verifyRes.data;

          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          return { user };
        } catch (error) {
          const message = error.response?.data?.message || error.message || 'Wallet authentication failed';
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      // Initialize auth from stored token
      initAuth: () => {
        const token = get().token;
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      },
    }),
    {
      name: 'cinevest-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth on app load
useAuthStore.getState().initAuth();

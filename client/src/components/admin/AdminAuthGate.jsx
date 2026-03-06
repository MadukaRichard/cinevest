/**
 * ===========================================
 * Admin Auth Gate Component
 * ===========================================
 *
 * Requires the admin to re-enter their password
 * before accessing the admin panel. Stores a
 * short-lived admin session token in sessionStorage
 * that expires after 2 hours. The token is sent
 * automatically on every API request via the
 * X-Admin-Token header (see utils/api.js).
 */

import { useState, useEffect, useCallback } from 'react';
import { Lock, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';

const TOKEN_KEY = 'cinevest-admin-token';
const EXPIRY_KEY = 'cinevest-admin-token-expiry';

function AdminAuthGate({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remaining, setRemaining] = useState('');

  // Check if a valid session already exists
  const checkExistingSession = useCallback(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    const expiry = sessionStorage.getItem(EXPIRY_KEY);

    if (token && expiry && Date.now() < Number(expiry)) {
      setIsAuthorized(true);
      return true;
    }

    // Clean up expired tokens
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(EXPIRY_KEY);
    setIsAuthorized(false);
    return false;
  }, []);

  useEffect(() => {
    checkExistingSession();
  }, [checkExistingSession]);

  // Countdown timer for remaining session time
  useEffect(() => {
    if (!isAuthorized) return;

    const tick = () => {
      const expiry = Number(sessionStorage.getItem(EXPIRY_KEY));
      const diff = expiry - Date.now();
      if (diff <= 0) {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(EXPIRY_KEY);
        setIsAuthorized(false);
        setRemaining('');
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}m ${secs.toString().padStart(2, '0')}s`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isAuthorized]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await api.post('/admin/reauth', { password });
      const { adminToken, expiresIn } = res.data;

      sessionStorage.setItem(TOKEN_KEY, adminToken);
      sessionStorage.setItem(EXPIRY_KEY, String(Date.now() + expiresIn));

      setIsAuthorized(true);
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Already authorized → render admin content + session badge
  if (isAuthorized) {
    return (
      <>
        {/* Floating session indicator */}
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs font-medium rounded-full shadow-lg backdrop-blur">
          <ShieldCheck className="w-3.5 h-3.5" />
          Admin session: {remaining}
        </div>
        {children}
      </>
    );
  }

  // Gate: password prompt
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary-500/10 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Admin Verification
            </h1>
            <p className="text-muted-foreground text-sm">
              For security, please re-enter your password to access the admin panel.
              Your session will last 2 hours.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-muted-foreground mb-1.5"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                required
                autoFocus
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Access Admin Panel
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminAuthGate;

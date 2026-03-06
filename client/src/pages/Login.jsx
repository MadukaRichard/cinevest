/**
 * ===========================================
 * Login Page
 * ===========================================
 * 
 * User authentication page for existing users.
 * Handles email/password login and wallet-based sign-in.
 */

import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Wallet, ChevronDown, Loader2 } from 'lucide-react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SEO from '../components/ui/SEO';
import { useAuthStore } from '../store/authStore';
import { useAvailableWallets } from '../hooks';

function Login() {
  const navigate = useNavigate();
  const { login, walletAuth, isLoading } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);

  const { wallets, getProvider } = useAvailableWallets();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await login(formData.email, formData.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      // Check if verification is required
      if (error.requiresVerification) {
        toast.error(error.message);
        navigate('/verify', { state: { email: error.email } });
        return;
      }
      toast.error(error.message || 'Login failed');
    }
  };

  const handleWalletConnect = useCallback(
    async (walletId) => {
      setWalletLoading(true);
      try {
        let rawProvider = walletId ? getProvider(walletId) : null;
        if (!rawProvider) rawProvider = window.ethereum;

        if (!rawProvider) {
          toast.error('No wallet detected. Please install MetaMask or another browser wallet.');
          return;
        }

        const provider = new ethers.BrowserProvider(rawProvider);
        const accounts = await provider.send('eth_requestAccounts', []);
        if (!accounts?.length) {
          toast.error('No accounts found. Please unlock your wallet.');
          return;
        }

        const walletAddress = accounts[0];
        const signer = await provider.getSigner();

        await walletAuth(walletAddress, async (message) => {
          return await signer.signMessage(message);
        });

        toast.success('Welcome back!');
        navigate('/dashboard');
      } catch (err) {
        const msg = err.message || 'Wallet authentication failed';
        if (!msg.includes('user rejected') && !msg.includes('User denied')) {
          toast.error(msg);
        }
      } finally {
        setWalletLoading(false);
        setShowWalletPicker(false);
      }
    },
    [getProvider, walletAuth, navigate],
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <SEO title="Log In" description="Sign in to your CineVest account to manage investments and track your portfolio." />
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">
            Sign in to access your investment dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              icon={<Mail className="w-5 h-5" />}
              required
            />

            {/* Password Input */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                icon={<Lock className="w-5 h-5" />}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-500 hover:text-primary-400"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Wallet Connect Button */}
          <div className="relative">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (wallets.length > 1) {
                  setShowWalletPicker(!showWalletPicker);
                } else {
                  handleWalletConnect(wallets[0]?.id);
                }
              }}
              disabled={walletLoading}
            >
              {walletLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Wallet className="w-5 h-5 mr-2" />
              )}
              {walletLoading ? 'Connecting…' : 'Connect Wallet'}
              {wallets.length > 1 && !walletLoading && (
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showWalletPicker ? 'rotate-180' : ''}`} />
              )}
            </Button>

            {/* Wallet picker dropdown */}
            {showWalletPicker && wallets.length > 1 && (
              <div className="absolute z-10 mt-2 w-full rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {wallets.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleWalletConnect(w.id)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    {w.icon ? (
                      <img src={w.icon} alt={w.name} className="w-6 h-6 rounded" />
                    ) : (
                      <Wallet className="w-6 h-6 text-muted-foreground" />
                    )}
                    {w.name}
                  </button>
                ))}
              </div>
            )}

            {wallets.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                No wallet detected —{' '}
                <a
                  href="https://metamask.io/download"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:text-primary-400"
                >
                  Install MetaMask
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-muted-foreground">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-primary-500 hover:text-primary-400 font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

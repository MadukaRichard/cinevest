/**
 * ===========================================
 * Verify Account Page
 * ===========================================
 * 
 * Email verification page where users enter 6-digit OTP
 * After successful verification, auto signs in and redirects to dashboard
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import SEO from '../components/ui/SEO';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

function VerifyAccount() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  
  const { setAuthData } = useAuthStore();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const inputRefs = useRef([]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle OTP input change
  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    
    // Handle paste
    if (value.length > 1) {
      const pastedValues = value.slice(0, 6).split('');
      pastedValues.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      // Focus last filled or next empty
      const nextIndex = Math.min(index + pastedValues.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle verify
  const handleVerify = async (e) => {
    e?.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/verify', {
        email,
        otp: otpCode,
      });

      // Auto sign in - store auth data
      setAuthData({
        user: {
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role,
          isVerified: response.data.isVerified,
        },
        token: response.data.token,
      });

      toast.success('Account verified successfully!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      toast.error(message);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when all digits entered
  useEffect(() => {
    if (otp.every(digit => digit !== '')) {
      handleVerify();
    }
  }, [otp]);

  // Handle resend OTP
  const handleResend = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('New verification code sent!');
      setCountdown(60); // 60 second cooldown
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resend code';
      toast.error(message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <SEO title="Verify Account" noIndex />
      <div className="w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate('/signup')}
          className="flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sign Up
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-500/20 text-primary-500 mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
          <p className="text-muted-foreground">
            We've sent a 6-digit code to
          </p>
          <p className="font-medium text-foreground">{email}</p>
        </div>

        {/* OTP Input */}
        <div className="card">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-4 text-center">
                Enter verification code
              </label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold 
                      bg-input border border-border rounded-lg
                      focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                      transition-all duration-200"
                    disabled={isLoading}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              disabled={otp.some(digit => !digit)}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Verify Account
            </Button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className={`inline-flex items-center text-sm font-medium transition-colors
                ${countdown > 0 
                  ? 'text-muted-foreground cursor-not-allowed' 
                  : 'text-primary-500 hover:text-primary-400'
                }`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
              {countdown > 0 
                ? `Resend in ${countdown}s` 
                : isResending 
                  ? 'Sending...' 
                  : 'Resend Code'
              }
            </button>
          </div>

          {/* Info */}
          <p className="mt-6 text-xs text-muted-foreground text-center">
            The code expires in 10 minutes. Check your spam folder if you don't see it.
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyAccount;

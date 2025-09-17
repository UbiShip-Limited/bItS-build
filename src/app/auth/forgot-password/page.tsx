'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Loader2, ArrowLeft, AlertCircle, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { getSiteURL } from '@/src/lib/utils/siteUrl';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
        if (cooldownTime === 1) {
          setIsRateLimited(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      // Get the site URL and log it for debugging
      const siteUrl = getSiteURL();
      const redirectUrl = `${siteUrl}/auth/callback`;

      console.log('Password reset redirect URL:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        // Check for rate limiting
        if (error.message.toLowerCase().includes('rate') ||
            error.message.toLowerCase().includes('too many') ||
            error.message.toLowerCase().includes('exceeded')) {
          setIsRateLimited(true);
          setCooldownTime(300); // 5 minute cooldown
          setError('');
        } else {
          setError(error.message);
        }
      } else {
        setMessage('Check your email for the password reset link. Please open it in this same browser window for best results.');
        // Don't redirect, let user stay on this page
        setEmail('');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080808] text-white flex flex-col justify-center w-full max-w-full">
      {/* Background layer */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-[#080808] to-[#080808]/95"></div>
      </div>

      {/* Central ornamental divider */}
      <div className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 z-10 hidden sm:block">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-[#C9A449]/30 to-transparent"></div>
      </div>

      {/* Main content container */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 flex flex-col items-center justify-center w-full h-full py-8 px-4"
      >
        <div className="w-full max-w-md">
          {/* Main card with ornamental styling */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative bg-[#080808]/90 backdrop-blur-xl rounded-lg border border-[#C9A449]/20 shadow-2xl overflow-hidden"
          >
            {/* Ornamental border effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#C9A449]/5 via-transparent to-[#C9A449]/5 pointer-events-none"></div>
            
            <div className="relative p-8">
              {/* Header with ornamental design */}
              <div className="text-center mb-8">
                {/* Ornamental line above icon */}
                <div className="mb-6">
                  <OrnamentalLine
                    centerElement={
                      <div className="flex items-center justify-center w-6 h-6">
                        <div className="w-4 h-4 border border-[#C9A449]/80 rotate-45"></div>
                        <div className="absolute w-2 h-2 bg-[#C9A449]/30 rotate-45"></div>
                      </div>
                    }
                    lineWidth="w-20"
                  />
                </div>

                {/* Icon with elegant styling */}
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#C9A449]/20 to-[#C9A449]/10 rounded-full flex items-center justify-center mb-6 border border-[#C9A449]/30">
                  <Mail className="w-8 h-8 text-[#C9A449]" />
                </div>

                {/* Title with sophisticated typography */}
                <h1 className="font-heading text-2xl sm:text-3xl tracking-wide text-white mb-2 uppercase">
                  Reset Password
                </h1>
                <p className="font-body text-[#FFFFFF]/70 italic">
                  Enter your email to receive a password reset link
                </p>

                {/* Ornamental line below title */}
                <div className="mt-6">
                  <OrnamentalLine
                    centerElement={
                      <div className="relative flex items-center justify-center">
                        <span className="text-[#C9A449] text-sm z-10">✦</span>
                        <span className="absolute transform scale-150 text-[#C9A449]/20 text-sm">✦</span>
                      </div>
                    }
                    lineWidth="w-16"
                  />
                </div>
              </div>

              {/* Back to Login */}
              <div className="mb-6">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center text-sm text-[#C9A449]/70 hover:text-[#C9A449] transition-colors tracking-wider"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Link>
              </div>

              {/* Success Message */}
              {message && (
                <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg backdrop-blur-sm">
                  <p className="text-green-300 text-sm text-center">{message}</p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Rate Limit Warning */}
              {isRateLimited && (
                <div className="mb-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg backdrop-blur-sm">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-amber-300 text-sm font-medium mb-2">
                        Email Rate Limit Reached
                      </p>
                      <p className="text-amber-200/80 text-xs mb-3">
                        Too many password reset attempts. For security, please wait before trying again.
                      </p>
                      <div className="flex items-center space-x-2 mb-3">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-300 text-sm font-mono">
                          {Math.floor(cooldownTime / 60)}:{String(cooldownTime % 60).padStart(2, '0')} remaining
                        </span>
                      </div>
                      <div className="border-t border-amber-500/20 pt-3">
                        <p className="text-amber-200/80 text-xs mb-2">
                          <strong>Alternative Options:</strong>
                        </p>
                        <ul className="space-y-2 text-xs text-amber-200/70">
                          <li className="flex items-start">
                            <Shield className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
                            <span>If you can still log in, go to Settings → Account & Security to change your password</span>
                          </li>
                          <li className="flex items-start">
                            <Mail className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0" />
                            <span>Contact an administrator at bowenislandtattooshop@gmail.com for assistance</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reset Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#C9A449]/90 mb-3 tracking-wider uppercase">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-4 bg-[#080808]/50 border border-[#C9A449]/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/50 focus:border-[#C9A449]/70 transition-all backdrop-blur-sm"
                    placeholder="Enter your email address"
                    disabled={isLoading || !!message || isRateLimited}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email || !!message || isRateLimited}
                  className="w-full bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/60 text-[#080808] py-4 px-6 rounded-lg font-medium hover:from-[#C9A449] hover:to-[#C9A449]/80 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center tracking-wider uppercase text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <div className="mb-4">
                  <OrnamentalLine
                    centerElement={
                      <div className="w-2 h-2 bg-[#C9A449]/30 rotate-45"></div>
                    }
                    lineWidth="w-12"
                  />
                </div>
                <p className="text-white/50 text-sm italic">
                  Remember your password?{' '}
                  <Link 
                    href="/auth/login"
                    className="text-[#C9A449]/70 hover:text-[#C9A449] transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-white/30 text-xs italic">
              Password reset links expire after 1 hour for security.
            </p>
          </div>
        </div>

        {/* Corner ornaments */}
        <CornerOrnament position="top-left" />
        <CornerOrnament position="top-right" />
        <CornerOrnament position="bottom-left" />
        <CornerOrnament position="bottom-right" />
      </motion.div>
    </div>
  );
}

// Ornamental Line Component
interface OrnamentalLineProps {
  centerElement: React.ReactNode;
  lineWidth?: string;
}

const OrnamentalLine: React.FC<OrnamentalLineProps> = ({
  centerElement,
  lineWidth = "w-16",
}) => {
  return (
    <div className="flex items-center justify-center">
      <div className={`${lineWidth} h-[0.5px] bg-gradient-to-r from-transparent via-[#C9A449]/60 to-[#C9A449]/40`}></div>
      <div className="mx-4">{centerElement}</div>
      <div className={`${lineWidth} h-[0.5px] bg-gradient-to-l from-transparent via-[#C9A449]/60 to-[#C9A449]/40`}></div>
    </div>
  );
};

// Corner Ornament Component
interface CornerOrnamentProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const CornerOrnament: React.FC<CornerOrnamentProps> = ({ position }) => {
  const baseClasses = "absolute w-[8%] h-[8%] m-6 hidden sm:block";
  let positionClasses = "";
  let horizontalLineClasses = "";
  let verticalLineClasses = "";

  switch (position) {
    case "top-left":
      positionClasses = "top-0 left-0";
      horizontalLineClasses = "absolute top-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-[#C9A449]/50 to-transparent";
      verticalLineClasses = "absolute top-0 left-0 h-full w-[0.5px] bg-gradient-to-b from-[#C9A449]/50 to-transparent";
      break;
    case "top-right":
      positionClasses = "top-0 right-0";
      horizontalLineClasses = "absolute top-0 right-0 w-full h-[0.5px] bg-gradient-to-l from-[#C9A449]/50 to-transparent";
      verticalLineClasses = "absolute top-0 right-0 h-full w-[0.5px] bg-gradient-to-b from-[#C9A449]/50 to-transparent";
      break;
    case "bottom-left":
      positionClasses = "bottom-0 left-0";
      horizontalLineClasses = "absolute bottom-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-[#C9A449]/50 to-transparent";
      verticalLineClasses = "absolute bottom-0 left-0 h-full w-[0.5px] bg-gradient-to-t from-[#C9A449]/50 to-transparent";
      break;
    case "bottom-right":
      positionClasses = "bottom-0 right-0";
      horizontalLineClasses = "absolute bottom-0 right-0 w-full h-[0.5px] bg-gradient-to-l from-[#C9A449]/50 to-transparent";
      verticalLineClasses = "absolute bottom-0 right-0 h-full w-[0.5px] bg-gradient-to-t from-[#C9A449]/50 to-transparent";
      break;
  }

  return (
    <div className={`${baseClasses} ${positionClasses}`}>
      <div className={horizontalLineClasses}></div>
      <div className={verticalLineClasses}></div>
    </div>
  );
};
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@supabase/ssr';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize Supabase client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Handle authentication and session check
  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Let Supabase handle the URL automatically
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if we have a valid session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError('An error occurred. Please try again.');
          setIsVerifying(false);
          return;
        }
        
        if (session) {
          console.log('Password reset session active');
          setIsVerifying(false);
        } else {
          // No session means the link didn't work
          const code = searchParams.get('code');
          if (code) {
            setError('The reset link must be opened in the same browser where you requested it. Please request a new password reset and open the link in this browser.');
          } else {
            setError('You must use a valid password reset link to access this page.');
          }
          setIsVerifying(false);
          setTimeout(() => {
            router.push('/auth/forgot-password');
          }, 5000);
        }
      } catch (err) {
        console.error('Error in auth handler:', err);
        setError('An error occurred. Please try again.');
        setIsVerifying(false);
      }
    };

    handleAuth();
  }, [searchParams, supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Password successfully reset! Redirecting to dashboard...');
        
        // User is now authenticated with their new password, redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Password update error:', err);
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
                  <Lock className="w-8 h-8 text-[#C9A449]" />
                </div>

                {/* Title with sophisticated typography */}
                <h1 className="font-heading text-2xl sm:text-3xl tracking-wide text-white mb-2 uppercase">
                  Set New Password
                </h1>
                <p className="font-body text-[#FFFFFF]/70 italic">
                  Choose a strong password for your account
                </p>

                {/* Ornamental line below title */}
                <div className="mt-6">
                  <OrnamentalLine
                    centerElement={
                      <div className="relative flex items-center justify-center">
                        <span className="text-[#C9A449] text-sm z-10">&</span>
                        <span className="absolute transform scale-150 text-[#C9A449]/20 text-sm">&</span>
                      </div>
                    }
                    lineWidth="w-16"
                  />
                </div>
              </div>

              {/* Verifying Token State */}
              {isVerifying && (
                <div className="mb-6 p-8 text-center">
                  <Loader2 className="w-8 h-8 text-[#C9A449] animate-spin mx-auto mb-4" />
                  <p className="text-[#C9A449]/80 text-sm">Verifying reset link...</p>
                </div>
              )}

              {/* Success Message */}
              {!isVerifying && message && (
                <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-300 mr-2" />
                    <p className="text-green-300 text-sm">{message}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                  <p className="text-red-300 text-sm text-center">{error}</p>
                </div>
              )}

              {/* Password Reset Form */}
              {!isVerifying && !error && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#C9A449]/90 mb-3 tracking-wider uppercase">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full px-4 py-4 pr-12 bg-[#080808]/50 border border-[#C9A449]/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/50 focus:border-[#C9A449]/70 transition-all backdrop-blur-sm"
                      placeholder="Enter new password"
                      disabled={isLoading || !!message}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#C9A449]/60 hover:text-[#C9A449] transition-colors"
                      disabled={isLoading || !!message}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-white/50 mt-2">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#C9A449]/90 mb-3 tracking-wider uppercase">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-4 py-4 pr-12 bg-[#080808]/50 border border-[#C9A449]/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/50 focus:border-[#C9A449]/70 transition-all backdrop-blur-sm"
                      placeholder="Confirm new password"
                      disabled={isLoading || !!message}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#C9A449]/60 hover:text-[#C9A449] transition-colors"
                      disabled={isLoading || !!message}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword || !!message}
                  className="w-full bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/60 text-[#080808] py-4 px-6 rounded-lg font-medium hover:from-[#C9A449] hover:to-[#C9A449]/80 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center tracking-wider uppercase text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Reset Password
                    </>
                  )}
                </button>
              </form>
              )}

              {/* Footer */}
              {!isVerifying && (
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
                  Keep your password safe and secure
                </p>
              </div>
              )}
            </div>
          </motion.div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-white/30 text-xs italic">
              Your password is encrypted and stored securely.
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

// Export wrapped component with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#C9A449] animate-spin mx-auto mb-4" />
          <p className="text-[#C9A449]/80 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Loader2, Shield, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [step, setStep] = useState<'access' | 'login'>('access');
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useAuth();
  const router = useRouter();

  // Check if access code is already verified in this session
  useEffect(() => {
    const accessVerified = sessionStorage.getItem('staff_access_verified');
    if (accessVerified === 'true') {
      setStep('login');
    }
  }, []);

  const handleAccessCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccessError('');
    setIsCheckingAccess(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/auth/verify-staff-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode })
      });

      const result = await response.json();

      if (result.success) {
        sessionStorage.setItem('staff_access_verified', 'true');
        setStep('login');
        setAccessCode('');
      } else {
        setAccessError('Invalid access code. Please try again.');
      }
    } catch (err) {
      setAccessError('Unable to verify access code. Please try again.');
      console.error('Access code verification error:', err);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        sessionStorage.removeItem('staff_access_verified');
        router.push('/dashboard');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToAccessCode = () => {
    sessionStorage.removeItem('staff_access_verified');
    setStep('access');
    setAccessCode('');
    setEmail('');
    setPassword('');
    setError('');
    setAccessError('');
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
                  {step === 'access' ? (
                    <Shield className="w-8 h-8 text-[#C9A449]" />
                  ) : (
                    <LogIn className="w-8 h-8 text-[#C9A449]" />
                  )}
                </div>

                {/* Title with sophisticated typography */}
                <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white mb-2 uppercase">
                  Bowen Island Tattoo
                </h1>
                <p className="font-body text-[#FFFFFF]/70 italic">
                  {step === 'access' 
                    ? 'Staff Portal - Access Required' 
                    : 'Staff Portal - Sign in to continue'
                  }
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

              <AnimatePresence mode="wait">
                {step === 'access' ? (
                  <motion.div
                    key="access"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Access Code Form */}
                    {accessError && (
                      <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                        <p className="text-red-300 text-sm text-center">{accessError}</p>
                      </div>
                    )}

                    <form onSubmit={handleAccessCodeSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="accessCode" className="block text-sm font-medium text-[#C9A449]/90 mb-3 tracking-wider uppercase">
                          Staff Access Code
                        </label>
                        <div className="relative">
                          <input
                            id="accessCode"
                            type="password"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            required
                            className="w-full px-4 py-4 pl-12 bg-[#080808]/50 border border-[#C9A449]/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/50 focus:border-[#C9A449]/70 transition-all backdrop-blur-sm"
                            placeholder="Enter staff access code"
                            disabled={isCheckingAccess}
                          />
                          <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#C9A449]/60" />
                        </div>
                        <p className="text-xs text-white/50 mt-3 text-center italic">
                          Contact your administrator if you don't have the current access code.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isCheckingAccess || !accessCode.trim()}
                        className="w-full bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/60 text-[#080808] py-4 px-6 rounded-lg font-medium hover:from-[#C9A449] hover:to-[#C9A449]/80 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center tracking-wider uppercase text-sm"
                      >
                        {isCheckingAccess ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Shield className="w-5 h-5 mr-2" />
                            Verify Access
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Back to Access Code */}
                    <div className="mb-6">
                      <button
                        onClick={resetToAccessCode}
                        className="text-sm text-[#C9A449]/70 hover:text-[#C9A449] transition-colors tracking-wider"
                      >
                        ← Back to access verification
                      </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                        <p className="text-red-300 text-sm text-center">{error}</p>
                      </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleLoginSubmit} className="space-y-6">
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
                          placeholder="Enter your email"
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[#C9A449]/90 mb-3 tracking-wider uppercase">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-4 pr-12 bg-[#080808]/50 border border-[#C9A449]/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/50 focus:border-[#C9A449]/70 transition-all backdrop-blur-sm"
                            placeholder="Enter your password"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#C9A449]/60 hover:text-[#C9A449] transition-colors"
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading || !email || !password}
                        className="w-full bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/60 text-[#080808] py-4 px-6 rounded-lg font-medium hover:from-[#C9A449] hover:to-[#C9A449]/80 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center tracking-wider uppercase text-sm"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            <LogIn className="w-5 h-5 mr-2" />
                            Sign In
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

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
                  {step === 'access' 
                    ? 'This portal is for authorized staff members only.'
                    : 'Need access? Contact your administrator'
                  }
                </p>
              </div>
            </div>
          </motion.div>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-white/30 text-xs italic">
              This is a secure staff portal. Unauthorized access is prohibited.
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

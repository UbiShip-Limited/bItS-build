'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, Loader2, ArrowLeft, Shield, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type UserRole = 'artist' | 'assistant' | 'admin';

export default function RegisterPage() {
  const [step, setStep] = useState<'access' | 'register'>('access');
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('artist');
  const [password, setPassword] = useState('');
  const [sendInvite, setSendInvite] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  // Check if access code is already verified in this session
  useEffect(() => {
    const accessVerified = sessionStorage.getItem('staff_access_verified');
    if (accessVerified === 'true') {
      setStep('register');
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
        setStep('register');
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

  const resetToAccessCode = () => {
    sessionStorage.removeItem('staff_access_verified');
    setStep('access');
    setAccessCode('');
    setAccessError('');
  };

  // Only admins can access this page (after access code verification)
  if (step === 'register' && (!user || user.role !== 'admin')) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#080808] text-white flex flex-col justify-center w-full max-w-full">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-[#080808] to-[#080808]/95"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-20 flex flex-col items-center justify-center w-full h-full py-8 px-4"
        >
          <div className="w-full max-w-md text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative bg-[#080808]/90 backdrop-blur-xl rounded-lg border border-[#C9A449]/20 shadow-2xl overflow-hidden p-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#C9A449]/5 via-transparent to-[#C9A449]/5 pointer-events-none"></div>
              
              <div className="relative">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/30">
                  <Shield className="w-8 h-8 text-red-400" />
                </div>
                
                <h1 className="font-heading text-2xl font-bold text-white mb-4 tracking-wide uppercase">Access Denied</h1>
                <p className="text-white/70 mb-6 italic">
                  Only administrators can create staff accounts.
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/60 text-[#080808] py-3 px-4 rounded-lg hover:from-[#C9A449] hover:to-[#C9A449]/80 transition-all font-medium tracking-wider uppercase text-sm"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={resetToAccessCode}
                    className="w-full text-[#C9A449]/70 hover:text-[#C9A449] transition-colors py-2 tracking-wider text-sm"
                  >
                    Back to Access Verification
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!sendInvite && !password) {
      setError('Password is required when not sending an invitation');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          email,
          role,
          ...(sendInvite ? { sendInvite: true } : { password })
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setEmail('');
        setPassword('');
        setRole('artist');
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
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
        <div className="w-full max-w-lg">
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
                    <UserPlus className="w-8 h-8 text-[#C9A449]" />
                  )}
                </div>

                {/* Title with sophisticated typography */}
                <h1 className="font-heading text-2xl md:text-3xl tracking-wide text-white mb-2 uppercase">
                  {step === 'access' ? 'Staff Access Required' : 'Invite Staff Member'}
                </h1>
                <p className="font-body text-[#FFFFFF]/70 italic">
                  {step === 'access' 
                    ? 'Admin Portal - Access Required' 
                    : 'Create an account for a new team member'
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
                          Admin Access Code
                        </label>
                        <div className="relative">
                          <input
                            id="accessCode"
                            type="password"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value)}
                            required
                            className="w-full px-4 py-4 pl-12 bg-[#080808]/50 border border-[#C9A449]/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/50 focus:border-[#C9A449]/70 transition-all backdrop-blur-sm"
                            placeholder="Enter admin access code"
                            disabled={isCheckingAccess}
                          />
                          <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#C9A449]/60" />
                        </div>
                        <p className="text-xs text-white/50 mt-3 text-center italic">
                          This area is restricted to administrators only.
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

                    {/* Back to Login */}
                    <div className="mt-6 text-center">
                      <div className="mb-4">
                        <OrnamentalLine
                          centerElement={<div className="w-1 h-1 bg-[#C9A449]/30 rotate-45"></div>}
                          lineWidth="w-8"
                        />
                      </div>
                      <button
                        onClick={() => router.push('/auth/login')}
                        className="text-[#C9A449]/70 hover:text-[#C9A449] transition-colors text-sm tracking-wider"
                      >
                        ← Back to Staff Login
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="register"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Back Buttons */}
                    <div className="mb-6 flex justify-between items-center">
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center text-[#C9A449]/70 hover:text-[#C9A449] transition-colors tracking-wider text-sm"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Dashboard
                      </button>
                      <button
                        onClick={resetToAccessCode}
                        className="text-sm text-[#C9A449]/50 hover:text-[#C9A449]/70 transition-colors tracking-wider"
                      >
                        ← Access verification
                      </button>
                    </div>

                    {/* Success Message */}
                    {success && (
                      <div className="mb-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg backdrop-blur-sm">
                        <p className="text-green-300 text-sm text-center">{success}</p>
                      </div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                        <p className="text-red-300 text-sm text-center">{error}</p>
                      </div>
                    )}

                    {/* Registration Form */}
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
                          placeholder="Enter staff member's email"
                          disabled={isLoading}
                        />
                      </div>

                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-[#C9A449]/90 mb-3 tracking-wider uppercase">
                          Role
                        </label>
                        <select
                          id="role"
                          value={role}
                          onChange={(e) => setRole(e.target.value as UserRole)}
                          className="w-full px-4 py-4 bg-[#080808]/50 border border-[#C9A449]/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#C9A449]/50 focus:border-[#C9A449]/70 transition-all backdrop-blur-sm"
                          disabled={isLoading}
                        >
                          <option value="artist" className="bg-[#080808]">Artist</option>
                          <option value="assistant" className="bg-[#080808]">Assistant</option>
                          <option value="admin" className="bg-[#080808]">Administrator</option>
                        </select>
                      </div>

                      {/* Invitation Method */}
                      <div>
                        <label className="block text-sm font-medium text-[#C9A449]/90 mb-4 tracking-wider uppercase">
                          Account Setup Method
                        </label>
                        <div className="space-y-4">
                          <label className="flex items-start text-white/80 cursor-pointer group">
                            <input
                              type="radio"
                              checked={sendInvite}
                              onChange={() => setSendInvite(true)}
                              className="mt-1 mr-4 text-[#C9A449] bg-[#080808]/50 border-[#C9A449]/30 focus:ring-[#C9A449]/50"
                              disabled={isLoading}
                            />
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <Mail className="w-4 h-4 mr-2 text-[#C9A449]/70" />
                                <span className="font-medium">Send Invitation Email</span>
                              </div>
                              <p className="text-xs text-white/50 italic">
                                They'll receive an email to set up their password
                              </p>
                            </div>
                          </label>
                          
                          <label className="flex items-start text-white/80 cursor-pointer group">
                            <input
                              type="radio"
                              checked={!sendInvite}
                              onChange={() => setSendInvite(false)}
                              className="mt-1 mr-4 text-[#C9A449] bg-[#080808]/50 border-[#C9A449]/30 focus:ring-[#C9A449]/50"
                              disabled={isLoading}
                            />
                            <div className="flex-1">
                              <div className="flex items-center mb-1">
                                <Lock className="w-4 h-4 mr-2 text-[#C9A449]/70" />
                                <span className="font-medium">Set Password Now</span>
                              </div>
                              <p className="text-xs text-white/50 italic">
                                Create the account with a password you provide
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Password Field (shown only when not sending invite) */}
                      {!sendInvite && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <label htmlFor="password" className="block text-sm font-medium text-[#C9A449]/90 mb-3 tracking-wider uppercase">
                            Temporary Password
                          </label>
                          <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required={!sendInvite}
                            minLength={8}
                            className="w-full px-4 py-4 bg-[#080808]/50 border border-[#C9A449]/30 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/50 focus:border-[#C9A449]/70 transition-all backdrop-blur-sm"
                            placeholder="Enter a temporary password"
                            disabled={isLoading}
                          />
                          <p className="text-xs text-white/50 mt-2 italic">
                            Minimum 8 characters. They can change this later.
                          </p>
                        </motion.div>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading || !email}
                        className="w-full bg-gradient-to-r from-[#C9A449]/80 to-[#C9A449]/60 text-[#080808] py-4 px-6 rounded-lg font-medium hover:from-[#C9A449] hover:to-[#C9A449]/80 focus:outline-none focus:ring-2 focus:ring-[#C9A449]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center tracking-wider uppercase text-sm"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            {sendInvite ? 'Sending Invitation...' : 'Creating Account...'}
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-5 h-5 mr-2" />
                            {sendInvite ? 'Send Invitation' : 'Create Account'}
                          </>
                        )}
                      </button>
                    </form>

                    {/* Role Descriptions */}
                    <div className="mt-8 p-4 bg-[#080808]/30 rounded-lg border border-[#C9A449]/10 backdrop-blur-sm">
                      <div className="mb-3">
                        <OrnamentalLine
                          centerElement={
                            <span className="text-[#C9A449]/70 text-xs tracking-widest uppercase px-2">Role Permissions</span>
                          }
                          lineWidth="w-8"
                        />
                      </div>
                      <div className="space-y-2 text-xs text-white/60">
                        <div><strong className="text-[#C9A449]/80">Artist:</strong> Manage own bookings and view tattoo requests</div>
                        <div><strong className="text-[#C9A449]/80">Assistant:</strong> Help with bookings and access analytics</div>
                        <div><strong className="text-[#C9A449]/80">Admin:</strong> Full system access and user management</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
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

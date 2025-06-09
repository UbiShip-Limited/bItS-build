'use client';

import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';

type UserRole = 'artist' | 'assistant' | 'admin';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('artist');
  const [password, setPassword] = useState('');
  const [sendInvite, setSendInvite] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const router = useRouter();

  // Only admins can access this page
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
            <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
            <p className="text-gray-300 mb-6">
              Only administrators can create staff accounts.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Invite Staff Member
            </h1>
            <p className="text-gray-300">
              Create an account for a new team member
            </p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-6 flex items-center text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="Enter staff member's email"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                disabled={isLoading}
              >
                <option value="artist" className="bg-gray-800">Artist</option>
                <option value="assistant" className="bg-gray-800">Assistant</option>
                <option value="admin" className="bg-gray-800">Administrator</option>
              </select>
            </div>

            {/* Invitation Method */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Account Setup Method
              </label>
              <div className="space-y-3">
                <label className="flex items-center text-gray-300">
                  <input
                    type="radio"
                    checked={sendInvite}
                    onChange={() => setSendInvite(true)}
                    className="mr-3 text-green-500 bg-white/10 border-gray-600 focus:ring-green-500"
                    disabled={isLoading}
                  />
                  <div>
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invitation Email
                    </div>
                    <p className="text-xs text-gray-400 ml-6">
                      They'll receive an email to set up their password
                    </p>
                  </div>
                </label>
                <label className="flex items-center text-gray-300">
                  <input
                    type="radio"
                    checked={!sendInvite}
                    onChange={() => setSendInvite(false)}
                    className="mr-3 text-green-500 bg-white/10 border-gray-600 focus:ring-green-500"
                    disabled={isLoading}
                  />
                  <div>
                    <div className="flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Set Password Now
                    </div>
                    <p className="text-xs text-gray-400 ml-6">
                      Create the account with a password you provide
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Password Field (shown only when not sending invite) */}
            {!sendInvite && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!sendInvite}
                  minLength={8}
                  className="w-full px-4 py-3 bg-white/10 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Enter a temporary password"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Minimum 8 characters. They can change this later.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
          <div className="mt-8 p-4 bg-white/5 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Role Permissions:</h3>
            <div className="space-y-2 text-xs text-gray-400">
              <div><strong className="text-gray-300">Artist:</strong> Manage own bookings and view tattoo requests</div>
              <div><strong className="text-gray-300">Assistant:</strong> Help with bookings and access analytics</div>
              <div><strong className="text-gray-300">Admin:</strong> Full system access and user management</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // TODO: Implement password reset functionality with Supabase
      // For now, just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setIsSuccess(true);
      setMessage('If an account with that email exists, we\'ve sent a password reset link.');
    } catch (error) {
      setMessage('Something went wrong. Please try again.');
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 to-base-300">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary">Reset Password</h1>
            <p className="text-base-content/70 mt-2">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            {message && (
              <div className={`alert ${isSuccess ? 'alert-success' : 'alert-error'}`}>
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="divider">OR</div>

          <div className="text-center space-y-2">
            <Link href="/auth/login" className="link link-primary">
              Back to Login
            </Link>
            <br />
            <span className="text-sm text-base-content/70">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="link link-primary">
                Sign up
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

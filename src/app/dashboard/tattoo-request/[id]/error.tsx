'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error details for debugging
    console.error('Tattoo request page error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });

    // Report to error tracking service if available
    if (typeof window !== 'undefined' && window.location.hostname === 'www.bowenislandtattooshop.com') {
      // Production error tracking
      console.error('[Production Error] Tattoo request page:', error);
    }
  }, [error]);

  // Determine if this is a module loading error
  const isModuleError = error.message?.includes('Cannot find module') ||
                        error.message?.includes('Module not found');

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-b from-obsidian/95 to-obsidian/90 border border-gold-500/30 rounded-3xl shadow-2xl p-8">
          <div className="flex items-center gap-3 text-red-400 mb-4">
            <AlertCircle className="w-8 h-8" />
            <h2 className="text-2xl font-semibold">Error Loading Request</h2>
          </div>

          <p className="text-white/70 mb-6">
            {isModuleError
              ? 'A temporary loading issue occurred. Please refresh the page to try again.'
              : (error.message || 'Failed to load tattoo request details. This might be a temporary issue.')
            }
          </p>

          {error.digest && (
            <p className="text-xs text-white/50 mb-4 font-mono">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3 justify-between">
            <Link
              href="/dashboard/tattoo-request"
              className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 rounded-lg font-medium tracking-[0.02em] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Requests
            </Link>

            <button
              onClick={() => {
                // Clear any cached data and reset
                if (typeof window !== 'undefined') {
                  window.location.reload();
                } else {
                  reset();
                }
              }}
              className="flex-1 px-4 py-3 bg-gold-500/20 hover:bg-gold-500/30 text-gold-500 hover:text-gold-400 border border-gold-500/50 hover:border-gold-500 rounded-lg font-medium tracking-[0.02em] transition-all duration-300 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
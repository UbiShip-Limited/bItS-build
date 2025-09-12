'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Tattoo request page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="flex items-center gap-3 text-error mb-4">
              <AlertCircle className="w-8 h-8" />
              <h2 className="card-title">Error Loading Request</h2>
            </div>
            
            <p className="text-base-content/70 mb-6">
              {error.message || 'Failed to load tattoo request details. This might be a temporary issue.'}
            </p>
            
            <div className="card-actions justify-between">
              <Link href="/dashboard/tattoo-request" className="btn btn-ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Requests
              </Link>
              
              <button onClick={reset} className="btn btn-primary">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
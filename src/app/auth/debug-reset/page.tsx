'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function DebugResetContent() {
  const searchParams = useSearchParams();
  const [urlInfo, setUrlInfo] = useState<any>({});
  const [hashInfo, setHashInfo] = useState<any>({});

  useEffect(() => {
    // Get all URL search params
    const params: any = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    setUrlInfo(params);

    // Get hash params
    const hashParams: any = {};
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = new URLSearchParams(window.location.hash.substring(1));
      hash.forEach((value, key) => {
        hashParams[key] = value;
      });
    }
    setHashInfo(hashParams);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Password Reset Debug Info</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Current URL</h2>
          <code className="block bg-black p-3 rounded text-sm break-all">
            {typeof window !== 'undefined' && window.location.href}
          </code>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Search Parameters</h2>
          {Object.keys(urlInfo).length > 0 ? (
            <pre className="bg-black p-3 rounded text-sm overflow-auto">
              {JSON.stringify(urlInfo, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-400">No search parameters found</p>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Hash Parameters</h2>
          {Object.keys(hashInfo).length > 0 ? (
            <pre className="bg-black p-3 rounded text-sm overflow-auto">
              {JSON.stringify(hashInfo, null, 2)}
            </pre>
          ) : (
            <p className="text-gray-400">No hash parameters found</p>
          )}
        </div>

        <div className="bg-blue-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">What to Check</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>If you see <code>error_code: "otp_expired"</code> - Your link has expired</li>
            <li>If you see <code>type: "recovery"</code> and <code>access_token</code> - Link is valid</li>
            <li>If URL shows localhost but you're in production - Supabase redirect URL is misconfigured</li>
          </ol>
        </div>

        <div className="bg-yellow-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Supabase Configuration</h2>
          <p className="mb-3">In your Supabase dashboard:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Go to Authentication → URL Configuration</li>
            <li>Add to "Redirect URLs": <code className="bg-black px-2 py-1 rounded">https://your-domain.com/auth/reset-password</code></li>
            <li>Set "Site URL" to: <code className="bg-black px-2 py-1 rounded">https://your-domain.com</code></li>
            <li>Check email template uses: <code className="bg-black px-2 py-1 rounded">{'{{ .SiteURL }}/auth/reset-password'}</code></li>
          </ol>
        </div>

        <div className="flex gap-4">
          <Link 
            href="/auth/forgot-password"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition"
          >
            Request New Reset Link
          </Link>
          <Link 
            href="/auth/reset-password"
            className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg transition"
          >
            Try Reset Password Page
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function DebugResetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="text-xl">Loading debug info...</div>
      </div>
    }>
      <DebugResetContent />
    </Suspense>
  );
}
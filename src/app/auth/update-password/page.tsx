'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function UpdatePasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to our existing reset-password page
    // This allows us to keep our existing UI while matching Supabase's expected endpoint
    console.log('🔄 Redirecting from /auth/update-password to /auth/reset-password');
    router.replace('/auth/reset-password');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-[#C9A449] animate-spin mx-auto mb-4" />
        <p className="text-[#C9A449]/80 text-sm">Redirecting to password reset...</p>
      </div>
    </div>
  );
}
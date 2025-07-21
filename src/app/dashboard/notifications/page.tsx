'use client';

import { Suspense } from 'react';
import NotificationCenter from '@/src/components/dashboard/notifications/NotificationCenter';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto relative">
        <div className="relative border border-[#C9A449]/30 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-sm p-8">
          <Suspense fallback={
            <div className="flex items-center justify-center h-96">
              <div className="loading loading-spinner loading-lg text-primary"></div>
            </div>
          }>
            <NotificationCenter />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
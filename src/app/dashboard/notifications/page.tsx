'use client';

import { Suspense } from 'react';
import NotificationCenter from '@/src/components/dashboard/notifications/NotificationCenter';
import { DashboardPageLayout } from '../components/DashboardPageLayout';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

export default function NotificationsPage() {
  return (
    <DashboardPageLayout
      title="Notifications"
      description="Manage your notification preferences and view recent alerts"
      breadcrumbs={[{ label: 'Notifications' }]}
    >
      <Suspense fallback={
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colors.borderDefault} mx-auto mb-4`}></div>
            <p className={`${colors.textSecondary}`}>Loading notifications...</p>
          </div>
        </div>
      }>
        <NotificationCenter />
      </Suspense>
    </DashboardPageLayout>
  );
}
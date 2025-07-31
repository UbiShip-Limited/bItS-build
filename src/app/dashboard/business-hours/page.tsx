'use client';

import { Suspense } from 'react';
import BusinessHoursManager from '@/src/components/dashboard/business-hours/BusinessHoursManager';
import { DashboardPageLayout } from '../components/DashboardPageLayout';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

export default function BusinessHoursPage() {
  return (
    <DashboardPageLayout
      title="Business Hours"
      description="Manage your shop's operating hours and special schedules"
      breadcrumbs={[{ label: 'Business Hours' }]}
    >
      <Suspense fallback={
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colors.borderDefault} mx-auto mb-4`}></div>
            <p className={`${colors.textSecondary}`}>Loading business hours...</p>
          </div>
        </div>
      }>
        <BusinessHoursManager />
      </Suspense>
    </DashboardPageLayout>
  );
}
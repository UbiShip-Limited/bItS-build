'use client';

import { useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
// Temporarily comment out complex imports to fix build
// import { useDashboardData } from './hooks/useDashboardData';
// import { DashboardHeader, DashboardContent, DashboardLoading, DashboardError } from './components';

// Component imports
import OperationsStatsGrid from '@/src/components/dashboard/OperationsStatsGrid';
import PriorityActionsBar from '@/src/components/dashboard/PriorityActionsBar';
import SimplifiedActivityTimeline from '@/src/components/dashboard/SimplifiedActivityTimeline';
import QuickActionsPanel from '@/src/components/dashboard/QuickActionsPanel';

export default function DashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--obsidian, #0A0A0A)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="bg-[#111111] rounded-lg p-6 border border-[#C9A449]/20">
          <h1 className="text-2xl font-semibold text-white mb-4">Dashboard</h1>
          <p className="text-gray-300">
            Welcome to your dashboard. 
            {isAuthenticated ? `Hello, ${(user as any)?.name || 'User'}!` : 'Please log in to access dashboard features.'}
          </p>
        </div>
      </div>
    </div>
  );
}

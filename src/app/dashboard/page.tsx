'use client';

import { useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { useDashboardData } from './hooks/useDashboardData';
import { DashboardHeader, DashboardContent, DashboardLoading, DashboardError } from './components';

// Component imports
import OperationsStatsGrid from '@/src/components/dashboard/OperationsStatsGrid';
import PriorityActionsBar from '@/src/components/dashboard/PriorityActionsBar';
import SimplifiedActivityTimeline from '@/src/components/dashboard/SimplifiedActivityTimeline';
import QuickActionsPanel from '@/src/components/dashboard/QuickActionsPanel';

export default function DashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const {
    loading,
    dataLoading,
    error,
    stats,
    actionableMetrics,
    appointments,
    customers,
    requests,
    priorityActions,
    recentActivity,
    loadDashboardData,
    handleRefreshMetrics
  } = useDashboardData(isAuthenticated, user);

  // Wait for authentication before loading dashboard data
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      console.log('🔐 Authentication complete, loading dashboard data...');
      loadDashboardData();
    } else if (!authLoading && !isAuthenticated) {
      console.log('❌ Not authenticated, redirecting...');
    }
  }, [authLoading, isAuthenticated, user, loadDashboardData]);

  if (loading || dataLoading) {
    return <DashboardLoading dataLoading={dataLoading} />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={loadDashboardData} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Priority Actions Bar - Only show if there are actions */}
        {priorityActions && priorityActions.length > 0 && (
          <div className="mb-6">
            <PriorityActionsBar actions={priorityActions} />
          </div>
        )}

        {/* Page Header */}
        <DashboardHeader />

        {/* Main Layout - Three sections */}
        <div className="space-y-8">
          {/* Section 1: Daily Operations Stats */}
          {actionableMetrics && (
            <OperationsStatsGrid 
              metrics={actionableMetrics} 
              loading={dataLoading}
              onRefresh={handleRefreshMetrics}
            />
          )}

          {/* Section 2: Quick Actions and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Quick Actions - Left side on desktop */}
            <div className="lg:col-span-1">
              <QuickActionsPanel />
            </div>

            {/* Activity Timeline - Right side on desktop, takes 2 columns */}
            <div className="lg:col-span-2">
              <SimplifiedActivityTimeline 
                activities={recentActivity || []}
                className=""
              />
            </div>
          </div>

          {/* Section 3: Data Tables */}
          <DashboardContent 
            appointments={appointments}
            requests={requests}
            customers={customers}
          />
        </div>
      </div>
    </div>
  );
}

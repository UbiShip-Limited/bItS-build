'use client';

import { useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { useDashboardData } from './hooks/useDashboardData';
import { DashboardHeader, DashboardContent, DashboardLoading, DashboardError } from './components';

// Component imports
import StatsGrid from '@/src/components/dashboard/StatsGrid';
import EnhancedStatsGrid from '@/src/components/dashboard/EnhancedStatsGrid';
import WorkflowGuide from '@/src/components/dashboard/WorkflowGuide';

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
    <div className="min-h-screen">
      {/* Professional Container with Gold Border */}
      <div className="max-w-7xl mx-auto relative">
        {/* Main container with gold border */}
        <div className="relative border border-[#C9A449]/30 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-sm p-8">
          {/* Page Header */}
          <DashboardHeader />

          {/* Stats Grid with Professional Spacing */}
          <div className="mb-10">
            {actionableMetrics ? (
              <EnhancedStatsGrid 
                metrics={actionableMetrics} 
                loading={dataLoading}
                onRefresh={handleRefreshMetrics}
              />
            ) : (
              <StatsGrid stats={stats} />
            )}
          </div>

          {/* Workflow Guide */}
          <div className="mb-8">
            <WorkflowGuide />
          </div>

          {/* Main Content */}
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

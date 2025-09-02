'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';
import { dashboardService, type DashboardData } from '@/src/lib/api/services/dashboardService';

// Component imports
import OperationsStatsGrid from '@/src/components/dashboard/OperationsStatsGrid';
import PriorityActionsBar from '@/src/components/dashboard/PriorityActionsBar';
import SimplifiedActivityTimeline from '@/src/components/dashboard/SimplifiedActivityTimeline';
import QuickActionsPanel from '@/src/components/dashboard/QuickActionsPanel';
import SquareSyncStatus from '@/src/components/dashboard/SquareSyncStatus';
import { DashboardCard } from './components/DashboardCard';

export default function DashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    metrics: {
      todayAppointments: {
        total: 0,
        completed: 0,
        remaining: 0
      },
      actionItems: {
        overdueRequests: 0,
        unconfirmedAppointments: 0,
        followUpsNeeded: 0
      },
      requests: {
        newCount: 0,
        urgentCount: 0,
        todayCount: 0
      },
      revenue: {
        today: 0,
        thisWeek: 0,
        thisMonth: 0
      }
    },
    priorityActions: [],
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (isAutoRefresh = false) => {
    try {
      if (isAutoRefresh) {
        setIsUpdating(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Fetch real dashboard data from the API
      const data = await dashboardService.getDashboardData();
      
      // Log the data for debugging
      console.log('📊 Dashboard data updated:', {
        todayAppointments: data.metrics?.todayAppointments?.total,
        newRequests: data.metrics?.requests?.newCount,
        todayRevenue: data.metrics?.revenue?.today,
        priorityActions: data.priorityActions?.length
      });
      
      setDashboardData(data);
      setLastUpdateTime(new Date());
      setIsLoading(false);
      setIsUpdating(false);
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('Failed to load dashboard data');
      setIsLoading(false);
      setIsUpdating(false);
    }
  };

  // TODO: Implement actual data fetching from API
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  // Listen for real-time updates via SSE and auto-refresh dashboard
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
    const eventSource = new EventSource(`${apiUrl}/events?userId=admin-user`);

    // Handle connection open
    eventSource.onopen = () => {
      console.log('✅ Dashboard connected to real-time updates');
    };

    // Auto-refresh dashboard on key events
    eventSource.addEventListener('appointment_created', (event) => {
      console.log('📅 New appointment created:', event.data);
      fetchDashboardData(true);
    });

    eventSource.addEventListener('request_submitted', (event) => {
      console.log('🎨 New tattoo request submitted:', event.data);
      fetchDashboardData(true);
    });

    eventSource.addEventListener('payment_received', (event) => {
      console.log('💰 Payment received:', event.data);
      fetchDashboardData(true);
    });

    // Also listen for request status changes
    eventSource.addEventListener('request_reviewed', () => {
      fetchDashboardData(true);
    });

    eventSource.addEventListener('request_approved', () => {
      fetchDashboardData(true);
    });

    eventSource.addEventListener('request_rejected', () => {
      fetchDashboardData(true);
    });

    eventSource.addEventListener('appointment_approved', () => {
      fetchDashboardData(true);
    });

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('❌ Dashboard SSE error:', error);
      // Will automatically reconnect
    };

    return () => {
      eventSource.close();
    };
  }, [isAuthenticated]);

  if (authLoading || isLoading) {
    return (
      <div className={`min-h-screen ${colors.bgPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${colors.borderDefault} mx-auto mb-4`}></div>
          <div className={`${colors.textSecondary}`}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${colors.bgPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`${colors.textAccent} mb-4`}>⚠️</div>
          <div className={`${colors.textPrimary}`}>{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className={`mt-4 ${components.button.base} ${components.button.sizes.small} ${components.button.variants.secondary}`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check if we have any data
  const hasData = dashboardData.metrics?.todayAppointments?.total > 0 || 
                  dashboardData.metrics?.requests?.newCount > 0 || 
                  dashboardData.recentActivity?.length > 0;

  return (
    <div className="space-y-6">
      {/* Real-time update indicator */}
      {isUpdating && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 ${components.radius.medium} 
                        bg-gold-500/20 backdrop-blur-sm border ${colors.borderDefault} animate-fadeIn`}>
          <div className="animate-pulse w-2 h-2 rounded-full bg-gold-500"></div>
          <span className={`${typography.textSm} ${colors.textAccent}`}>Updating dashboard...</span>
        </div>
      )}
      
      {/* Last update time */}
      {lastUpdateTime && !isLoading && (
        <div className={`text-right ${typography.textXs} ${colors.textMuted}`}>
          Last updated: {lastUpdateTime.toLocaleTimeString()}
        </div>
      )}
      
      {/* Welcome message for empty state */}
      {!hasData && (
        <div className={`text-center py-12 px-6 bg-gradient-to-b from-obsidian/95 to-obsidian/90 ${components.radius.large} border ${colors.borderSubtle}`}>
          <h2 className={`${typography.h3} ${colors.textPrimary} mb-2`}>Welcome to your Dashboard</h2>
          <p className={`${typography.paragraph} ${colors.textSecondary} mb-6`}>
            Start by creating your first appointment or reviewing tattoo requests
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/dashboard/appointments?action=new" 
              className={`${components.button.base} ${components.button.sizes.medium} ${components.button.variants.primary}`}
            >
              New Appointment
            </Link>
            <Link 
              href="/dashboard/tattoo-request" 
              className={`${components.button.base} ${components.button.sizes.medium} ${components.button.variants.secondary}`}
            >
              View Requests
            </Link>
          </div>
        </div>
      )}

      {/* Priority Actions Bar - Only show if there are actions */}
      {dashboardData.priorityActions?.length > 0 && (
        <PriorityActionsBar actions={dashboardData.priorityActions.map(action => ({
          ...action,
          urgency: action.priority === 'high' ? 'high' : 'medium',
          type: action.type as any // Type casting needed due to slight differences in enum values
        }))} />
      )}

      {/* Stats Grid - Always show, will display zeros */}
      <OperationsStatsGrid metrics={dashboardData.metrics || {
        todayAppointments: { total: 0, completed: 0, remaining: 0 },
        actionItems: { overdueRequests: 0, unconfirmedAppointments: 0, followUpsNeeded: 0 },
        requests: { newCount: 0, urgentCount: 0, todayCount: 0 },
        revenue: { today: 0, thisWeek: 0, thisMonth: 0 }
      }} loading={isLoading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline - Takes up 2 columns */}
        <div className="lg:col-span-2">
          <DashboardCard
            title="Recent Activity"
            subtitle="Your latest updates and notifications"
            viewDetailsHref="/dashboard/notifications"
            noPadding
          >
            <SimplifiedActivityTimeline activities={dashboardData.recentActivity || []} />
          </DashboardCard>
        </div>

        {/* Right Column - Quick Actions and Square Sync */}
        <div className="lg:col-span-1 space-y-6">
          {/* Square Sync Status */}
          <DashboardCard
            title="Square Integration"
            subtitle="Sync appointments with Square"
            noPadding
          >
            <SquareSyncStatus />
          </DashboardCard>
          
          {/* Quick Actions Panel */}
          <DashboardCard
            title="Quick Actions"
            subtitle="Common tasks and shortcuts"
          >
            <QuickActionsPanel 
              onSendPaymentLink={() => router.push('/dashboard/payments?action=new-link')}
              newRequestsCount={dashboardData.metrics?.requests?.newCount || 0}
            />
          </DashboardCard>
        </div>
      </div>
    </div>
  );
}

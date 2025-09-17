'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import { typography, colors,components } from '@/src/lib/styles/globalStyleConstants';
import { dashboardService, type DashboardData } from '@/src/lib/api/services/dashboardService';

// Component imports
import OperationsStatsGrid from '@/src/components/dashboard/OperationsStatsGrid';
import PriorityActionsBar from '@/src/components/dashboard/PriorityActionsBar';
import SimplifiedActivityTimeline from '@/src/components/dashboard/SimplifiedActivityTimeline';
import QuickActionsPanel from '@/src/components/dashboard/QuickActionsPanel';
import SquareSyncStatus from '@/src/components/dashboard/SquareSyncStatus';
import RevenueWidget from '@/src/components/dashboard/RevenueWidget';
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
      
      // Fetch real dashboard data from the API with current timeframe
      const data = await dashboardService.getDashboardData('today', true);
      
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

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  // Listen for real-time updates via SSE and auto-refresh dashboard
  useEffect(() => {
    if (!isAuthenticated) return;

    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
    const userId = user?.id || 'admin-user'; // Use authenticated user ID or fallback

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const BASE_RECONNECT_DELAY = 1000; // 1 second

    const connectSSE = () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource(`${apiUrl}/events?userId=${userId}`);

      // Handle connection open
      eventSource.onopen = () => {
        console.log('✅ Dashboard connected to real-time updates');
        reconnectAttempts = 0; // Reset attempts on successful connection
      };

      // Listen for the unified dashboard metrics update event
      eventSource.addEventListener('dashboard_metrics_updated', (event) => {
        console.log('📊 Dashboard metrics updated:', event.data);
        fetchDashboardData(true);
      });

      // Auto-refresh dashboard on key events (fallback for immediate feedback)
      const handleDashboardRefresh = (eventType: string, eventData?: any) => {
        console.log(`🔄 Dashboard refresh triggered by: ${eventType}`, eventData);
        fetchDashboardData(true);
      };

      eventSource.addEventListener('appointment_created', (event) => {
        console.log('📅 New appointment created:', event.data);
        handleDashboardRefresh('appointment_created', event.data);
      });

      eventSource.addEventListener('request_submitted', (event) => {
        console.log('🎨 New tattoo request submitted:', event.data);
        handleDashboardRefresh('request_submitted', event.data);
      });

      eventSource.addEventListener('payment_received', (event) => {
        console.log('💰 Payment received:', event.data);
        handleDashboardRefresh('payment_received', event.data);
      });

      eventSource.addEventListener('request_reviewed', (event) => {
        handleDashboardRefresh('request_reviewed', event.data);
      });

      eventSource.addEventListener('request_approved', (event) => {
        handleDashboardRefresh('request_approved', event.data);
      });

      eventSource.addEventListener('request_rejected', (event) => {
        handleDashboardRefresh('request_rejected', event.data);
      });

      eventSource.addEventListener('appointment_approved', (event) => {
        handleDashboardRefresh('appointment_approved', event.data);
      });

      // Handle errors and connection issues with exponential backoff
      eventSource.onerror = (error) => {
        console.error('❌ Dashboard SSE error:', error);

        // Check connection state and handle reconnection
        if (eventSource!.readyState === EventSource.CONNECTING) {
          console.log('🔄 Dashboard reconnecting to real-time updates...');
        } else if (eventSource!.readyState === EventSource.CLOSED) {
          console.log('❌ Dashboard real-time connection closed');

          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1);
            console.log(`🔄 Attempting reconnection ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms...`);

            reconnectTimeout = setTimeout(() => {
              connectSSE();
            }, delay);
          } else {
            console.error('❌ Max reconnection attempts reached. Please refresh the page.');
          }
        }
      };
    };

    // Initial connection
    connectSSE();

    return () => {
      console.log('🔌 Closing dashboard real-time connection');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isAuthenticated, user?.id]); // Include user.id to reconnect on user change

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
      
      {/* Header with last update time and refresh button */}
      {(lastUpdateTime || process.env.NODE_ENV === 'development') && !isLoading && (
        <div className={`flex items-center justify-between ${typography.textXs} ${colors.textMuted}`}>
          {/* Last update time */}
          <div>
            {lastUpdateTime && `Last updated: ${lastUpdateTime.toLocaleTimeString()}`}
          </div>
          
          {/* Manual refresh button for testing */}
          {process.env.NODE_ENV === 'development' && (
            <button 
              onClick={() => fetchDashboardData(true)}
              className={`${components.button.base} ${components.button.sizes.small} ${components.button.variants.ghost} 
                          text-xs px-3 py-1.5 opacity-60 hover:opacity-100 transition-opacity`}
              disabled={isUpdating}
              title="Development: Refresh dashboard data"
            >
              🔄 {isUpdating ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
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

        {/* Right Column - Revenue, Quick Actions and Square Sync */}
        <div className="lg:col-span-1 space-y-6">
          {/* Revenue Widget - NEW */}
          <RevenueWidget />

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

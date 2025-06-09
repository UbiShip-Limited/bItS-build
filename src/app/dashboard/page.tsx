'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/src/hooks/useAuth';
import { AppointmentApiClient,BookingStatus } from '@/src/lib/api/services/appointmentApiClient';
import { TattooRequestApiClient, type TattooRequest } from '@/src/lib/api/services/tattooRequestApiClient';
import { apiClient } from '@/src/lib/api/apiClient';

// Component imports
import StatsGrid from '@/src/components/dashboard/StatsGrid';
import EnhancedStatsGrid from '@/src/components/dashboard/EnhancedStatsGrid';
import AppointmentsTable from '@/src/components/dashboard/AppointmentsTable';
import TattooRequestsTable from '@/src/components/dashboard/TattooRequestsTable';
import CustomersTable from '@/src/components/dashboard/CustomersTable';
import WorkflowGuide from '@/src/components/dashboard/WorkflowGuide';

interface DashboardStats {
  todayAppointments: number;
  weeklyRevenue: number;
  activeCustomers: number;
  pendingRequests: number;
}

// Simplified actionable metrics that focus on what needs attention
interface ActionableMetrics {
  todayAppointments: {
    total: number;
    completed: number;
    remaining: number;
    nextAppointment?: string;
  };
  requests: {
    newCount: number;
    urgentCount: number;
    totalPending: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    currency: string;
  };
  actionItems: {
    overdueRequests: number;
    unconfirmedAppointments: number;
    followUpsNeeded: number;
  };
}

interface Appointment {
  id: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
  status: 'confirmed' | 'pending' | 'completed';
}

interface RecentCustomer {
  id: string;
  name: string;
  email: string;
  lastVisit: string;
  totalSpent: number;
}

interface DashboardData {
  recentAppointments: Appointment[];
  recentTattooRequests: TattooRequest[];
  stats: {
    totalAppointments: number;
    totalTattooRequests: number;
    totalRevenue: number;
    pendingRequests: number;
  };
}

export default function DashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false); // Prevent concurrent loads
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weeklyRevenue: 0,
    activeCustomers: 0,
    pendingRequests: 0,
  });
  const [actionableMetrics, setActionableMetrics] = useState<ActionableMetrics | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<RecentCustomer[]>([]);
  const [requests, setRequests] = useState<TattooRequest[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    recentAppointments: [],
    recentTattooRequests: [],
    stats: {
      totalAppointments: 0,
      totalTattooRequests: 0,
      totalRevenue: 0,
      pendingRequests: 0
    }
  });

  // Memoize the clients to prevent recreation on every render
  const appointmentClient = useMemo(() => new AppointmentApiClient(apiClient), []);
  const tattooRequestClient = useMemo(() => new TattooRequestApiClient(apiClient), []);

  // Wait for authentication before loading dashboard data
  useEffect(() => {
    if (!authLoading && isAuthenticated && user && !dataLoading) {
      console.log('🔐 Authentication complete, loading dashboard data...');
      loadDashboardData();
    } else if (!authLoading && !isAuthenticated) {
      console.log('❌ Not authenticated, redirecting...');
      setError('Authentication required');
    }
  }, [authLoading, isAuthenticated, user]); // Removed dataLoading from deps to prevent loops

  const handleRefreshMetrics = async () => {
    if (dataLoading) {
      console.log('⏳ Refresh already in progress, skipping...');
      return;
    }
    await loadDashboardData();
  };

  const loadDashboardData = async () => {
    // Prevent concurrent loads
    if (dataLoading) {
      console.log('⏳ Data already loading, skipping...');
      return;
    }

    console.log('📊 Starting optimized dashboard data load...');
    setDataLoading(true);
    setLoading(true);
    setError(null);
    
    if (!isAuthenticated || !user) {
      console.log('❌ Cannot load dashboard data: not authenticated');
      setError('Authentication required');
      setLoading(false);
      setDataLoading(false);
      return;
    }
    
    try {
      // Calculate all date ranges once
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);

      console.log('📅 Making optimized API calls...');
      
      // OPTIMIZED: Make only 3 main API calls instead of 15+
      const [
        // 1. Get ALL appointments for the month (completed + scheduled)
        monthlyAppointments,
        
        // 2. Get tattoo requests
        requestsResponse,
        
        // 3. Get upcoming appointments
        upcomingAppointments
      ] = await Promise.all([
        // Single call for all monthly appointments
        appointmentClient.getAppointments({
          from: startOfMonth.toISOString(),
          to: nextWeek.toISOString() // Get through next week
        }),
        
        // Single call for tattoo requests
        tattooRequestClient.getAll({
          status: 'new',
          limit: 10
        }),
        
        // Single call for upcoming scheduled appointments
        appointmentClient.getAppointments({
          from: now.toISOString(),
          to: nextWeek.toISOString(),
          status: BookingStatus.SCHEDULED
        })
      ]);

      console.log('✅ All API calls completed, processing data...');

      // PROCESS DATA: Extract what we need from the single API calls
      const allAppointments = monthlyAppointments.data;
      
      // Filter appointments by time periods from the single dataset
      const todayAppointments = allAppointments.filter(apt => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= startOfToday && aptDate < endOfToday;
      });
      
      const completedToday = todayAppointments.filter(apt => apt.status === BookingStatus.COMPLETED);
      const remainingToday = todayAppointments.filter(apt => 
        apt.status !== BookingStatus.CANCELLED && 
        apt.status !== BookingStatus.COMPLETED &&
        apt.status !== BookingStatus.NO_SHOW
      );
      
      const completedThisWeek = allAppointments.filter(apt => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= startOfWeek && 
               aptDate <= now && 
               apt.status === BookingStatus.COMPLETED;
      });
      
      const completedThisMonth = allAppointments.filter(apt => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= startOfMonth && 
               aptDate <= now && 
               apt.status === BookingStatus.COMPLETED;
      });

      // Find next appointment
      const nextAppointment = remainingToday
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
      
      // Calculate revenue
      const todayRevenue = completedToday.reduce((sum, apt) => sum + (apt.priceQuote || 0), 0);
      const weekRevenue = completedThisWeek.reduce((sum, apt) => sum + (apt.priceQuote || 0), 0);
      const monthlyRevenue = completedThisMonth.reduce((sum, apt) => sum + (apt.priceQuote || 0), 0);
      
      // Build actionable metrics
      const actionableMetrics: ActionableMetrics = {
        todayAppointments: {
          total: todayAppointments.length,
          completed: completedToday.length,
          remaining: remainingToday.length,
          nextAppointment: nextAppointment ? format(new Date(nextAppointment.startTime), 'h:mm a') : undefined
        },
        requests: {
          newCount: requestsResponse.data.length,
          urgentCount: 0, // Could be enhanced with urgency logic
          totalPending: requestsResponse.pagination.total
        },
        revenue: {
          today: todayRevenue,
          thisWeek: weekRevenue,
          currency: '$'
        },
        actionItems: {
          overdueRequests: 0, // Could be enhanced with date analysis
          unconfirmedAppointments: remainingToday.filter(apt => apt.status === BookingStatus.PENDING).length,
          followUpsNeeded: 0 // Could be enhanced with follow-up logic
        }
      };
      
      setActionableMetrics(actionableMetrics);
      
      // Set basic stats for fallback
      setStats({
        todayAppointments: upcomingAppointments.data.length,
        weeklyRevenue: monthlyRevenue,
        activeCustomers: completedThisMonth.length,
        pendingRequests: requestsResponse.pagination.total,
      });

      // Format recent appointments for display
      const recentAppointments = upcomingAppointments.data.slice(0, 3);
      const formattedAppointments = recentAppointments.map((appointment) => ({
        id: appointment.id,
        clientName: appointment.customer?.name || 'Anonymous',
        date: format(new Date(appointment.startTime), 'MMM dd'),
        time: format(new Date(appointment.startTime), 'h:mm a'),
        service: appointment.type.replace('_', ' '),
        status: appointment.status as 'confirmed' | 'pending' | 'completed'
      }));

      // Build customer map from completed appointments
      const customerMap = new Map<string, RecentCustomer>();
      completedThisMonth.forEach((apt) => {
        if (apt.customer?.id) {
          const existing = customerMap.get(apt.customer.id);
          if (!existing) {
            customerMap.set(apt.customer.id, {
              id: apt.customer.id,
              name: apt.customer.name || 'Anonymous',
              email: apt.customer.email || 'N/A',
              lastVisit: apt.startTime,
              totalSpent: apt.priceQuote || 0
            });
          } else {
            existing.totalSpent += apt.priceQuote || 0;
            if (new Date(apt.startTime) > new Date(existing.lastVisit)) {
              existing.lastVisit = apt.startTime;
            }
          }
        }
      });
      
      const formattedCustomers = Array.from(customerMap.values())
        .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())
        .slice(0, 2);

      // Set all data
      setAppointments(formattedAppointments);
      setCustomers(formattedCustomers);
      setRequests(requestsResponse.data.slice(0, 3));
      
      console.log('🎉 Dashboard data loaded successfully!');
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <span className="loading loading-spinner loading-lg text-[#C9A449]"></span>
          <p className="text-gray-400 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white">Unable to Load Dashboard</h2>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={loadDashboardData} 
            className="mt-4 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-[#C9A449]/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Professional Container with Gold Border */}
      <div className="max-w-7xl mx-auto relative">
        {/* Main container with gold border */}
        <div className="relative border border-[#C9A449]/30 rounded-2xl bg-[#0a0a0a]/90 backdrop-blur-sm p-8">
          {/* Page Header - Dark theme version */}
          <div className="mb-8 border border-[#C9A449]/20 bg-gradient-to-r from-[#080808]/80 to-[#0a0a0a]/40 rounded-xl p-6 backdrop-blur-sm">
            <h1 className="text-3xl font-heading font-bold text-white mb-2 tracking-wide">Dashboard Overview</h1>
            <p className="text-base text-gray-400">Welcome back! Here's what's happening at your shop today.</p>
          </div>

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

          {/* Main Content Grid with Enhanced Layout */}
          <div className="space-y-8">
            {/* Row 1: Appointments and Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Today's Appointments Card */}
              <div className="bg-[#111111] border border-[#C9A449]/20 rounded-2xl p-6 transition-all duration-300 hover:border-[#C9A449]/30 backdrop-blur-sm">
                <div className="mb-5 pb-4 border-b border-[#1a1a1a]">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Today's Appointments</h2>
                    <Link 
                      href="/dashboard/appointments" 
                      className="text-sm text-[#C9A449] font-medium transition-all duration-200 hover:text-[#E5B563] group flex items-center gap-1"
                    >
                      View details 
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </Link>
                  </div>
                </div>
                <div>
                  <AppointmentsTable appointments={appointments} />
                </div>
              </div>

              {/* Recent Tattoo Requests Card */}
              <div className="bg-[#111111] border border-[#C9A449]/20 rounded-2xl p-6 transition-all duration-300 hover:border-[#C9A449]/30 backdrop-blur-sm">
                <div className="mb-5 pb-4 border-b border-[#1a1a1a]">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Recent Tattoo Requests</h2>
                    <Link 
                      href="/dashboard/tattoo-request" 
                      className="text-sm text-[#C9A449] font-medium transition-all duration-200 hover:text-[#E5B563] group flex items-center gap-1"
                    >
                      View details 
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </Link>
                  </div>
                </div>
                <div>
                  <TattooRequestsTable requests={requests} />
                </div>
              </div>
            </div>

            {/* Row 2: Recent Customers - Full Width */}
            <div className="bg-[#111111] border border-[#C9A449]/20 rounded-2xl p-6 transition-all duration-300 hover:border-[#C9A449]/30 backdrop-blur-sm">
              <div className="mb-5 pb-4 border-b border-[#1a1a1a]">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">Recent Customers</h2>
                  <Link 
                    href="/dashboard/customers" 
                    className="text-sm text-[#C9A449] font-medium transition-all duration-200 hover:text-[#E5B563] group flex items-center gap-1"
                  >
                    View details 
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </Link>
                </div>
              </div>
              <div>
                <CustomersTable customers={customers} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

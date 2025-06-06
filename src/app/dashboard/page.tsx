'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useAuth } from '@/src/hooks/useAuth';
import { AppointmentApiClient, type AppointmentData, BookingStatus, BookingType } from '@/src/lib/api/services/appointmentApiClient';
import { TattooRequestApiClient, type TattooRequest } from '@/src/lib/api/services/tattooRequestApiClient';
import { apiClient } from '@/src/lib/api/apiClient';

// Component imports
import StatsGrid from '@/src/components/dashboard/StatsGrid';
import EnhancedStatsGrid from '@/src/components/dashboard/EnhancedStatsGrid';
import AppointmentsTable from '@/src/components/dashboard/AppointmentsTable';
import TattooRequestsTable from '@/src/components/dashboard/TattooRequestsTable';
import CustomersTable from '@/src/components/dashboard/CustomersTable';

interface DashboardStats {
  todayAppointments: number;
  weeklyRevenue: number;
  activeCustomers: number;
  pendingRequests: number;
}

interface EnhancedMetrics {
  revenue: {
    today: { amount: number; trend: number; currency: string };
    week: { amount: number; trend: number; target: number };
    month: { amount: number; trend: number; forecast: number };
  };
  appointments: {
    today: { count: number; completed: number; remaining: number };
    week: { scheduled: number; completed: number; cancelled: number };
    metrics: {
      averageDuration: number;
      conversionRate: number;
      noShowRate: number;
    };
  };
  customers: {
    total: number;
    new: { today: number; week: number; month: number };
    segments: {
      newCustomers: number;
      regularCustomers: number;
      vipCustomers: number;
    };
  };
  requests: {
    pending: { count: number; urgent: number; overdue: number };
    processed: { today: number; week: number; month: number };
    conversion: {
      rate: number;
      averageTimeToConvert: number;
    };
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

export default function DashboardPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weeklyRevenue: 0,
    activeCustomers: 0,
    pendingRequests: 0,
  });
  const [enhancedMetrics, setEnhancedMetrics] = useState<EnhancedMetrics | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<RecentCustomer[]>([]);
  const [requests, setRequests] = useState<TattooRequest[]>([]);

  const appointmentClient = new AppointmentApiClient(apiClient);
  const tattooRequestClient = new TattooRequestApiClient(apiClient);

  // Wait for authentication before loading dashboard data
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      console.log('🔐 Authentication complete, loading dashboard data...');
      loadDashboardData();
    } else if (!authLoading && !isAuthenticated) {
      console.log('❌ Not authenticated, redirecting...');
      setError('Authentication required');
    }
  }, [authLoading, isAuthenticated, user]);

  const handleRefreshMetrics = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeframe: 'current' })
      });
      
      if (response.ok) {
        const { metrics } = await response.json();
        setEnhancedMetrics(metrics);
      }
    } catch (error) {
      console.warn('Failed to refresh metrics:', error);
    }
  };

  const loadDashboardData = async () => {
    console.log('📊 Starting dashboard data load...');
    setLoading(true);
    setError(null);
    
    if (!isAuthenticated || !user) {
      console.log('❌ Cannot load dashboard data: not authenticated');
      setError('Authentication required');
      setLoading(false);
      return;
    }
    
    try {
      // Load enhanced metrics first (with error handling)
      let analyticsData = null;
      try {
        console.log('📈 Loading analytics data...');
        const analyticsResponse = await fetch('/api/analytics/dashboard');
        if (analyticsResponse.ok) {
          analyticsData = await analyticsResponse.json();
          setEnhancedMetrics(analyticsData);
          console.log('✅ Analytics data loaded');
        }
      } catch (analyticsError) {
        console.warn('⚠️ Failed to load analytics data:', analyticsError);
        // Continue with basic dashboard even if analytics fail
      }
      // Load appointments
      console.log('📅 Loading appointments...');
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const appointmentsResponse = await appointmentClient.getAppointments({
        from: today.toISOString(),
        to: nextWeek.toISOString(),
        status: BookingStatus.SCHEDULED
      });
      console.log('✅ Appointments loaded:', appointmentsResponse.data.length);
      
      // Count upcoming appointments
      const upcomingCount = appointmentsResponse.data.filter(
        apt => apt.status !== BookingStatus.CANCELLED && apt.status !== BookingStatus.COMPLETED
      ).length;
      
      // Get recent appointments
      const recentAppointments = appointmentsResponse.data.slice(0, 3);
      
      // Load tattoo requests
      console.log('🎨 Loading tattoo requests...');
      const requestsResponse = await tattooRequestClient.getAll({
        status: 'new',
        limit: 10
      });
      console.log('✅ Tattoo requests loaded:', requestsResponse.data.length);
      
      const recentRequests = requestsResponse.data.slice(0, 3);
      
      // Calculate monthly revenue (from completed appointments)
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const completedAppointments = await appointmentClient.getAppointments({
        status: BookingStatus.COMPLETED,
        from: firstDayOfMonth.toISOString(),
        to: today.toISOString()
      });
      
      const monthlyRevenue = completedAppointments.data.reduce(
        (sum, apt) => sum + (apt.priceQuote || 0), 
        0
      );
      
      setStats({
        todayAppointments: upcomingCount,
        weeklyRevenue: monthlyRevenue,
        activeCustomers: completedAppointments.data.length, // Based on actual completed appointments
        pendingRequests: requestsResponse.pagination.total,
      });

      // Convert appointments to the new format
      const formattedAppointments = recentAppointments.map((appointment) => ({
        id: appointment.id,
        clientName: appointment.customer?.name || 'Anonymous',
        date: format(new Date(appointment.startTime), 'MMM dd'),
        time: format(new Date(appointment.startTime), 'h:mm a'),
        service: appointment.type.replace('_', ' '),
        status: appointment.status as 'confirmed' | 'pending' | 'completed'
      }));

      // Get customers from appointments
      const customerMap = new Map<string, RecentCustomer>();
      completedAppointments.data.forEach((apt) => {
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

      setAppointments(formattedAppointments);
      setCustomers(formattedCustomers);
      setRequests(recentRequests);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
            {enhancedMetrics ? (
              <EnhancedStatsGrid 
                metrics={enhancedMetrics} 
                loading={loading}
                onRefresh={handleRefreshMetrics}
              />
            ) : (
              <StatsGrid stats={stats} />
            )}
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

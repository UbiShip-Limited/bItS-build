'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';

// Enhanced components
import EnhancedStatsGrid from '@/src/components/dashboard/EnhancedStatsGrid';
import NotificationCenter from '@/src/components/dashboard/NotificationCenter';

// Existing components
import AppointmentsTable from '@/src/components/dashboard/AppointmentsTable';
import TattooRequestsTable from '@/src/components/dashboard/TattooRequestsTable';
import CustomersTable from '@/src/components/dashboard/CustomersTable';

// Services
import { AppointmentApiClient, type AppointmentData, BookingStatus, BookingType } from '@/src/lib/api/services/appointmentApiClient';
import { TattooRequestApiClient, type TattooRequest } from '@/src/lib/api/services/tattooRequestApiClient';
import { apiClient } from '@/src/lib/api/apiClient';

interface DashboardData {
  metrics?: any; // Enhanced metrics from analytics service
  appointments: AppointmentData[];
  requests: TattooRequest[];
  customers: any[];
}

interface RecentCustomer {
  id: string;
  name: string;
  email: string;
  lastVisit: string;
  totalSpent: number;
}

export default function EnhancedDashboardPage() {
  const [data, setData] = useState<DashboardData>({
    appointments: [],
    requests: [],
    customers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const appointmentClient = new AppointmentApiClient(apiClient);
  const requestClient = new TattooRequestApiClient(apiClient);

  const loadDashboardData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      // Load enhanced metrics from analytics service
      const metricsResponse = await fetch('/api/analytics/dashboard');
      const metrics = metricsResponse.ok ? await metricsResponse.json() : null;

      // Load existing data with improved error handling
      const [appointmentsResponse, requestsResponse] = await Promise.allSettled([
        appointmentClient.list({ limit: 10 }),
        requestClient.list({ limit: 5 })
      ]);

      // Process appointments
      const appointments = appointmentsResponse.status === 'fulfilled' 
        ? appointmentsResponse.value.data.map(apt => ({
            ...apt,
            date: apt.startAt ? format(new Date(apt.startAt), 'MMM dd, yyyy') : 'No date',
            time: apt.startAt ? format(new Date(apt.startAt), 'HH:mm') : 'No time',
            customer: apt.customerId ? { name: 'Customer' } : null,
            formattedDate: apt.startAt ? apt.startAt : null
          }))
        : [];

      // Process requests  
      const requests = requestsResponse.status === 'fulfilled'
        ? requestsResponse.value.data.slice(0, 5)
        : [];

      // Process customers (simplified for demo)
      const customers: RecentCustomer[] = [];

      setData({
        metrics,
        appointments,
        requests,
        customers
      });

      setLastRefresh(new Date());

    } catch (error) {
      console.error('Failed to load enhanced dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(false); // Refresh without showing loading
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    loadDashboardData();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white">Unable to Load Dashboard</h2>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={handleRefresh} 
            className="mt-4 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-[#C9A449]/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Stats Grid */}
      <EnhancedStatsGrid 
        metrics={data.metrics} 
        loading={loading}
        onRefresh={handleRefresh}
      />

      {/* Quick Actions Bar */}
      <div className="bg-[#111111] rounded-2xl p-6 border border-[#C9A449]/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <div className="text-sm text-gray-400">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/dashboard/appointments"
            className="bg-[#080808] hover:bg-[#0a0a0a] border border-[#C9A449]/20 hover:border-[#C9A449]/40 rounded-lg p-4 transition-all duration-200 group"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <div className="text-sm font-medium text-white group-hover:text-[#C9A449]">
                New Appointment
              </div>
            </div>
          </Link>

          <Link 
            href="/dashboard/tattoo-request"
            className="bg-[#080808] hover:bg-[#0a0a0a] border border-[#C9A449]/20 hover:border-[#C9A449]/40 rounded-lg p-4 transition-all duration-200 group"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🎨</div>
              <div className="text-sm font-medium text-white group-hover:text-[#C9A449]">
                Review Requests
              </div>
            </div>
          </Link>

          <Link 
            href="/dashboard/customers"
            className="bg-[#080808] hover:bg-[#0a0a0a] border border-[#C9A449]/20 hover:border-[#C9A449]/40 rounded-lg p-4 transition-all duration-200 group"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium text-white group-hover:text-[#C9A449]">
                Manage Customers
              </div>
            </div>
          </Link>

          <Link 
            href="/dashboard/payments"
            className="bg-[#080808] hover:bg-[#0a0a0a] border border-[#C9A449]/20 hover:border-[#C9A449]/40 rounded-lg p-4 transition-all duration-200 group"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">💳</div>
              <div className="text-sm font-medium text-white group-hover:text-[#C9A449]">
                Payment Links
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <div className="bg-[#111111] rounded-2xl p-6 border border-[#C9A449]/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Appointments</h3>
            <Link 
              href="/dashboard/appointments" 
              className="text-sm text-[#C9A449] hover:text-white transition-colors"
            >
              View All
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-700 h-16 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data.appointments.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No recent appointments</p>
                </div>
              ) : (
                data.appointments.slice(0, 3).map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="bg-[#080808] rounded-lg p-4 border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {appointment.customer?.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {appointment.date} • {appointment.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.status === BookingStatus.CONFIRMED
                            ? 'bg-green-500/20 text-green-400'
                            : appointment.status === BookingStatus.PENDING
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Recent Requests */}
        <div className="bg-[#111111] rounded-2xl p-6 border border-[#C9A449]/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Requests</h3>
            <Link 
              href="/dashboard/tattoo-request" 
              className="text-sm text-[#C9A449] hover:text-white transition-colors"
            >
              View All
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-700 h-16 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data.requests.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No recent requests</p>
                </div>
              ) : (
                data.requests.map((request) => (
                  <div 
                    key={request.id} 
                    className="bg-[#080808] rounded-lg p-4 border border-[#1a1a1a] hover:border-[#C9A449]/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {request.customer?.name || request.contactEmail || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-48">
                          {request.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'new'
                            ? 'bg-blue-500/20 text-blue-400'
                            : request.status === 'approved'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Performance Summary */}
        <div className="bg-[#111111] rounded-2xl p-6 border border-[#C9A449]/20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Today's Performance</h3>
          </div>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-700 h-8 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Appointments</span>
                <span className="text-sm font-medium text-white">
                  {data.metrics?.appointments?.today?.count || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Revenue</span>
                <span className="text-sm font-medium text-white">
                  ${data.metrics?.revenue?.today?.amount?.toLocaleString() || '0'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Completion Rate</span>
                <span className="text-sm font-medium text-white">
                  {data.metrics?.appointments?.metrics?.conversionRate || 0}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Utilization</span>
                <span className="text-sm font-medium text-white">
                  {data.metrics?.business?.efficiency?.bookingUtilization || 0}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legacy Tables (can be enhanced later) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#111111] rounded-2xl p-6 border border-[#C9A449]/20">
          <h3 className="text-lg font-semibold text-white mb-6">All Appointments</h3>
          <AppointmentsTable appointments={data.appointments} />
        </div>
        
        <div className="bg-[#111111] rounded-2xl p-6 border border-[#C9A449]/20">
          <h3 className="text-lg font-semibold text-white mb-6">All Requests</h3>
          <TattooRequestsTable requests={data.requests} />
        </div>
      </div>
    </div>
  );
} 
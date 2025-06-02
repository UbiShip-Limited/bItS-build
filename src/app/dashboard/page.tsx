'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { AppointmentService, type AppointmentData, BookingStatus, BookingType } from '@/src/lib/api/services/appointmentService';
import { TattooRequestService, type TattooRequest } from '@/src/lib/api/services/tattooRequestService';
import { apiClient } from '@/src/lib/api/apiClient';

// Component imports
import StatsGrid from '@/src/components/dashboard/StatsGrid';
import AppointmentsTable from '@/src/components/dashboard/AppointmentsTable';
import TattooRequestsTable from '@/src/components/dashboard/TattooRequestsTable';
import CustomersTable from '@/src/components/dashboard/CustomersTable';

interface DashboardStats {
  todayAppointments: number;
  weeklyRevenue: number;
  activeCustomers: number;
  pendingRequests: number;
}

interface Appointment {
  id: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
  status: 'confirmed' | 'pending' | 'completed';
}

interface DashboardTattooRequest {
  id: string;
  clientName: string;
  design: string;
  submittedAt: string;
  status: 'new' | 'reviewing' | 'quoted' | 'approved';
}

interface RecentCustomer {
  id: string;
  name: string;
  email: string;
  lastVisit: string;
  totalSpent: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weeklyRevenue: 0,
    activeCustomers: 0,
    pendingRequests: 0,
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<RecentCustomer[]>([]);
  const [requests, setRequests] = useState<DashboardTattooRequest[]>([]);

  const appointmentService = new AppointmentService(apiClient);
  const tattooRequestService = new TattooRequestService(apiClient);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load appointments
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const appointmentsResponse = await appointmentService.getAppointments({
        from: today.toISOString(),
        to: nextWeek.toISOString(),
        status: BookingStatus.SCHEDULED
      });
      
      // Count upcoming appointments
      const upcomingCount = appointmentsResponse.data.filter(
        apt => apt.status !== BookingStatus.CANCELLED && apt.status !== BookingStatus.COMPLETED
      ).length;
      
      // Get recent appointments
      const recentAppointments = appointmentsResponse.data.slice(0, 3);
      
      // Load tattoo requests
      const requestsResponse = await tattooRequestService.getAll({
        status: 'new',
        limit: 10
      });
      
      const recentRequests = requestsResponse.data.slice(0, 3) as unknown as TattooRequest[];
      
      // Calculate monthly revenue (from completed appointments)
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const completedAppointments = await appointmentService.getAppointments({
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

      // Convert requests to the new format
      const formattedRequests = recentRequests.map((request: any) => ({
        id: request.id,
        clientName: request.clientName || 'Anonymous',
        design: request.style || request.placement || 'Custom Design',
        submittedAt: request.createdAt || new Date().toISOString(),
        status: (request.status || 'new') as 'new' | 'reviewing' | 'quoted' | 'approved'
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
      setRequests(formattedRequests);
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
          <span className="loading loading-spinner loading-lg text-[#5F6368]"></span>
          <p className="text-[#5F6368] text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[#171717]">Unable to Load Dashboard</h2>
          <p className="text-[#5F6368]">{error}</p>
          <button 
            onClick={loadDashboardData} 
            className="mt-4 bg-gradient-to-r from-[#3C4043] to-[#202124] text-[#F7F8FA] border border-[#5F6368] px-6 py-3 rounded-[10px] font-semibold transition-all duration-300 hover:bg-gradient-to-r hover:from-[#5F6368] hover:to-[#3C4043] hover:transform hover:-translate-y-[2px] hover:shadow-[0_6px_16px_rgba(32,33,36,0.3)]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="max-w-7xl mx-auto p-8">
        {/* Page Header - Following dashboardstyle.md */}
        <div className="mb-8 pb-5 border-b border-[#DADCE0] bg-gradient-to-r from-[rgba(247,248,250,0.8)] to-[rgba(232,234,237,0.4)] rounded-xl p-6">
          <h1 className="text-[28px] font-bold text-[#171717] mb-2">Dashboard Overview</h1>
          <p className="text-base text-[#5F6368]">Welcome back! Here's what's happening at your shop today.</p>
        </div>

        {/* Stats Grid with Professional Spacing */}
        <div className="mb-10">
          <StatsGrid stats={stats} />
        </div>

        {/* Main Content Grid with Enhanced Layout */}
        <div className="space-y-8">
          {/* Row 1: Appointments and Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Today's Appointments Card */}
            <div className="bg-[#E8EAED] border border-[#DADCE0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(32,33,36,0.08)] transition-all duration-300 hover:border-[#9AA0A6] hover:shadow-[0_8px_24px_rgba(32,33,36,0.12)] hover:transform hover:-translate-y-[2px] hover:bg-gradient-to-br hover:from-[#E8EAED] hover:to-[#F1F3F4] backdrop-blur-[10px]">
              <div className="mb-5 pb-4 border-b border-[#D2D4D7]">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-[#171717]">Today's Appointments</h2>
                  <Link 
                    href="/dashboard/appointments" 
                    className="text-sm text-[#3C4043] font-medium transition-colors duration-200 hover:text-[#202124] hover:underline"
                  >
                    View details →
                  </Link>
                </div>
              </div>
              <div>
                <AppointmentsTable appointments={appointments} />
              </div>
            </div>

            {/* Recent Tattoo Requests Card */}
            <div className="bg-[#E8EAED] border border-[#DADCE0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(32,33,36,0.08)] transition-all duration-300 hover:border-[#9AA0A6] hover:shadow-[0_8px_24px_rgba(32,33,36,0.12)] hover:transform hover:-translate-y-[2px] hover:bg-gradient-to-br hover:from-[#E8EAED] hover:to-[#F1F3F4] backdrop-blur-[10px]">
              <div className="mb-5 pb-4 border-b border-[#D2D4D7]">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-[#171717]">Recent Tattoo Requests</h2>
                  <Link 
                    href="/dashboard/tattoo-request" 
                    className="text-sm text-[#3C4043] font-medium transition-colors duration-200 hover:text-[#202124] hover:underline"
                  >
                    View details →
                  </Link>
                </div>
              </div>
              <div>
                <TattooRequestsTable requests={requests} />
              </div>
            </div>
          </div>

          {/* Row 2: Recent Customers - Full Width */}
          <div className="bg-[#E8EAED] border border-[#DADCE0] rounded-2xl p-6 shadow-[0_2px_12px_rgba(32,33,36,0.08)] transition-all duration-300 hover:border-[#9AA0A6] hover:shadow-[0_8px_24px_rgba(32,33,36,0.12)] hover:transform hover:-translate-y-[2px] hover:bg-gradient-to-br hover:from-[#E8EAED] hover:to-[#F1F3F4] backdrop-blur-[10px]">
            <div className="mb-5 pb-4 border-b border-[#D2D4D7]">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-[#171717]">Recent Customers</h2>
                <Link 
                  href="/dashboard/customers" 
                  className="text-sm text-[#3C4043] font-medium transition-colors duration-200 hover:text-[#202124] hover:underline"
                >
                  View details →
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
  );
}

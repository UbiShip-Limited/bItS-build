'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, FileText, MessageCircle, DollarSign } from 'lucide-react';
import { AppointmentService, type AppointmentData, BookingStatus } from '@/src/lib/api/services/appointmentService';
import { TattooRequestService, type TattooRequest } from '@/src/lib/api/services/tattooRequestService';
import { formatDateTime, getTimeAgo } from '@/src/lib/utils/dateFormatters';
import { getStatusColor } from '@/src/lib/utils/statusHelpers';
import { apiClient } from '@/src/lib/api/apiClient';


export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    pendingRequests: 0,
    unreadMessages: 0,
    monthlyRevenue: 0
  });
  const [recentAppointments, setRecentAppointments] = useState<AppointmentData[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

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
      setRecentAppointments(appointmentsResponse.data.slice(0, 3));
      
      // Load tattoo requests
      const requestsResponse = await tattooRequestService.getAll({
        status: 'new',
        limit: 10
      });
      
      setRecentRequests(requestsResponse.data.slice(0, 3) as unknown as TattooRequest[]);
      
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
        upcomingAppointments: upcomingCount,
        pendingRequests: requestsResponse.pagination.total,
        unreadMessages: 0, // TODO: Integrate with communications API
        monthlyRevenue
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>Failed to load dashboard data. Please try refreshing the page.</p>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome to your tattoo shop admin dashboard</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard 
          title="Appointments" 
          value={stats.upcomingAppointments.toString()} 
          description="Upcoming this week" 
          linkHref="/dashboard/appointments"
          icon={<Calendar className="w-6 h-6 text-blue-600" />}
        />
        <SummaryCard 
          title="New Requests" 
          value={stats.pendingRequests.toString()} 
          description="Pending tattoo requests" 
          linkHref="/dashboard/tattoo-request"
          icon={<FileText className="w-6 h-6 text-purple-600" />}
        />
        <SummaryCard 
          title="Messages" 
          value={stats.unreadMessages.toString()} 
          description="Unread messages" 
          linkHref="/dashboard/communications"
          icon={<MessageCircle className="w-6 h-6 text-green-600" />}
        />
        <SummaryCard 
          title="Revenue" 
          value={`$${stats.monthlyRevenue.toFixed(0)}`} 
          description="This month" 
          linkHref="/dashboard/settings"
          icon={<DollarSign className="w-6 h-6 text-yellow-600" />}
        />
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Appointments</h2>
            <Link href="/dashboard/appointments" className="text-blue-600 text-sm hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentAppointments.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming appointments</p>
            ) : (
              recentAppointments.map((appointment) => (
                <div key={appointment.id} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">
                        {appointment.customer?.name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-500">
                        {formatDateTime(appointment.startTime)}
                      </p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Tattoo Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Requests</h2>
            <Link href="/dashboard/tattoo-request" className="text-blue-600 text-sm hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentRequests.length === 0 ? (
              <p className="text-gray-500 text-sm">No new requests</p>
            ) : (
              recentRequests.map((request) => (
                <div key={request.id} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">Request #{request.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-500">
                        {request.placement}, {request.style || 'No style specified'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{getTimeAgo(request.createdAt)}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ 
  title, 
  value, 
  description, 
  linkHref, 
  icon 
}: { 
  title: string; 
  value: string; 
  description: string; 
  linkHref: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        {icon}
      </div>
      <div className="mb-2">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Link href={linkHref} className="text-sm text-blue-600 hover:underline">
        View details →
      </Link>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import Link from 'next/link';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  DollarSign,
  Printer,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  MapPin
} from 'lucide-react';
import { AppointmentApiClient, type AppointmentData, BookingStatus, BookingType } from '@/src/lib/api/services/appointmentApiClient';
import { apiClient } from '@/src/lib/api/apiClient';
import { DashboardPageLayout, DashboardCard } from '../../components';
import { toast } from '@/src/lib/toast';

export default function TodaySchedulePage() {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const appointmentService = new AppointmentApiClient(apiClient);
  const today = new Date();

  const loadTodayAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await appointmentService.getAppointments({
        from: startOfDay(today).toISOString(),
        to: endOfDay(today).toISOString(),
        limit: 50 // Get all appointments for today
      });
      
      // Sort by start time
      const sorted = response.data.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      
      setAppointments(sorted);
    } catch (error) {
      console.error('Failed to load today appointments:', error);
      setError(error instanceof Error ? error.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodayAppointments();
  }, [loadTodayAppointments]);

  const handlePrint = () => {
    window.print();
  };

  const handleMarkAllCompleted = async () => {
    const pastAppointments = appointments.filter(apt => {
      const endTime = new Date(apt.startTime);
      endTime.setMinutes(endTime.getMinutes() + apt.duration);
      return endTime < new Date() && apt.status !== BookingStatus.COMPLETED && apt.status !== BookingStatus.CANCELLED;
    });

    if (pastAppointments.length === 0) {
      toast.info('No past appointments to mark as completed');
      return;
    }

    if (!confirm(`Mark ${pastAppointments.length} past appointments as completed?`)) return;

    try {
      // Update each appointment
      for (const apt of pastAppointments) {
        await appointmentService.updateAppointment(apt.id, { status: BookingStatus.COMPLETED });
      }
      
      toast.success(`Marked ${pastAppointments.length} appointments as completed`);
      loadTodayAppointments();
    } catch (error) {
      console.error('Failed to update appointments:', error);
      toast.error('Failed to update some appointments');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case BookingStatus.CONFIRMED: return 'text-green-400';
      case BookingStatus.PENDING: return 'text-[#C9A449]';
      case BookingStatus.COMPLETED: return 'text-gray-400';
      case BookingStatus.CANCELLED: return 'text-red-400';
      case BookingStatus.NO_SHOW: return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };

  // Count statistics
  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(apt => apt.status === BookingStatus.CONFIRMED).length,
    pending: appointments.filter(apt => apt.status === BookingStatus.PENDING).length,
    completed: appointments.filter(apt => apt.status === BookingStatus.COMPLETED).length,
    noShow: appointments.filter(apt => apt.status === BookingStatus.NO_SHOW).length,
  };

  return (
    <DashboardPageLayout
      title={`Today's Schedule - ${format(today, 'EEEE, MMMM d, yyyy')}`}
      description="All appointments for today at a glance"
      breadcrumbs={[
        { label: 'Appointments', href: '/dashboard/appointments' },
        { label: "Today's Schedule" }
      ]}
      actions={[
        {
          label: 'Print Schedule',
          onClick: handlePrint,
          icon: <Printer className="w-4 h-4" />,
          variant: 'secondary'
        },
        {
          label: 'Mark Past as Completed',
          onClick: handleMarkAllCompleted,
          icon: <CheckCircle className="w-4 h-4" />,
          variant: 'secondary'
        }
      ]}
      loading={loading}
      error={error}
      onRetry={loadTodayAppointments}
    >
      <style jsx global>{`
        @media print {
          /* Hide everything except the schedule content */
          nav, header, .no-print, button, .btn {
            display: none !important;
          }
          
          /* Make content printer-friendly */
          * {
            background: white !important;
            color: black !important;
          }
          
          .print-schedule {
            padding: 20px !important;
          }
          
          .print-schedule h2 {
            font-size: 24px !important;
            margin-bottom: 20px !important;
          }
          
          .print-schedule table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          
          .print-schedule th,
          .print-schedule td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            text-align: left !important;
          }
          
          .print-schedule th {
            background-color: #f5f5f5 !important;
            font-weight: bold !important;
          }
        }
      `}</style>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 no-print">
        <DashboardCard className="text-center">
          <div className="text-3xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">Total</div>
        </DashboardCard>
        <DashboardCard className="text-center">
          <div className="text-3xl font-bold text-green-400">{stats.confirmed}</div>
          <div className="text-sm text-gray-400">Confirmed</div>
        </DashboardCard>
        <DashboardCard className="text-center">
          <div className="text-3xl font-bold text-[#C9A449]">{stats.pending}</div>
          <div className="text-sm text-gray-400">Pending</div>
        </DashboardCard>
        <DashboardCard className="text-center">
          <div className="text-3xl font-bold text-gray-400">{stats.completed}</div>
          <div className="text-sm text-gray-400">Completed</div>
        </DashboardCard>
        <DashboardCard className="text-center">
          <div className="text-3xl font-bold text-orange-400">{stats.noShow}</div>
          <div className="text-sm text-gray-400">No Show</div>
        </DashboardCard>
      </div>

      {/* Schedule Table */}
      <DashboardCard
        noPadding
        className="print-schedule"
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {format(today, 'EEEE, MMMM d, yyyy')} Schedule
          </h2>
          
          {appointments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No appointments scheduled for today</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Time</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Client</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Service</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Contact</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Price</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium no-print">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment, index) => {
                  const endTime = new Date(appointment.startTime);
                  endTime.setMinutes(endTime.getMinutes() + appointment.duration);
                  const isPast = endTime < new Date();
                  
                  return (
                    <tr 
                      key={appointment.id} 
                      className={`border-b border-[#1a1a1a] ${isPast ? 'opacity-60' : ''}`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#C9A449]" />
                          <div>
                            <div className="font-medium text-white">
                              {formatTime(appointment.startTime)}
                            </div>
                            <div className="text-sm text-gray-400">
                              {appointment.duration} min
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-white">
                          {appointment.customer?.name || 'Anonymous'}
                        </div>
                        {appointment.notes && (
                          <div className="text-sm text-gray-400 mt-1">
                            {appointment.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-gray-300">
                          {appointment.type === BookingType.CONSULTATION ? 'Consultation' :
                           appointment.type === BookingType.DRAWING_CONSULTATION ? 'Drawing Consultation' :
                           'Tattoo Session'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {(appointment.customer?.phone || appointment.contactPhone) && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <a 
                                href={`tel:${appointment.customer?.phone || appointment.contactPhone}`}
                                className="text-[#C9A449] hover:text-[#E5B563]"
                              >
                                {appointment.customer?.phone || appointment.contactPhone}
                              </a>
                            </div>
                          )}
                          {(appointment.customer?.email || appointment.contactEmail) && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-300 text-xs">
                                {appointment.customer?.email || appointment.contactEmail}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {appointment.priceQuote ? (
                          <div className="flex items-center font-medium text-[#C9A449]">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {appointment.priceQuote.toFixed(2)}
                          </div>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 no-print">
                        <span className={`font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 no-print">
                        <Link 
                          href={`/dashboard/appointments/${appointment.id}`}
                          className="text-[#C9A449] hover:text-[#E5B563] text-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </DashboardCard>
    </DashboardPageLayout>
  );
}
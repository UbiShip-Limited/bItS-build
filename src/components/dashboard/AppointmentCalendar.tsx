'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { BookingStatus, type AppointmentData } from '@/src/lib/api/services/appointmentService';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface AppointmentCalendarProps {
  appointments: AppointmentData[];
  onDateClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: AppointmentData) => void;
  onCreateClick?: (date: Date) => void;
}

export default function AppointmentCalendar({
  appointments = [],
  onDateClick,
  onAppointmentClick,
  onCreateClick
}: AppointmentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Get calendar days for the current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const endDate = new Date(lastDay);

    // Adjust to start on Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());
    // Adjust to end on Saturday
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate]);

  // Group appointments by date
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, AppointmentData[]> = {};
    
    appointments.forEach(appointment => {
      const date = new Date(appointment.startTime).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(appointment);
    });

    return grouped;
  }, [appointments]);

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      [BookingStatus.PENDING]: 'bg-yellow-200',
      [BookingStatus.SCHEDULED]: 'bg-blue-200',
      [BookingStatus.CONFIRMED]: 'bg-green-200',
      [BookingStatus.COMPLETED]: 'bg-gray-200',
      [BookingStatus.CANCELLED]: 'bg-red-200',
      [BookingStatus.NO_SHOW]: 'bg-orange-200'
    };
    return colors[status] || 'bg-gray-200';
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  return (
    <div className="card bg-smoke-100 shadow-smoke hover:shadow-smoke-lg transition-all duration-300 border border-smoke-200">
      <div className="card-body">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-smoke-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => navigateMonth(-1)}
                className="btn btn-circle btn-sm btn-ghost text-smoke-600 hover:text-smoke-900 hover:bg-smoke-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="btn btn-sm btn-ghost text-smoke-600 hover:text-smoke-900 hover:bg-smoke-200"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="btn btn-circle btn-sm btn-ghost text-smoke-600 hover:text-smoke-900 hover:bg-smoke-200"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded-lg transition-all ${
                viewMode === 'month' 
                  ? 'bg-smoke-700 text-smoke-50' 
                  : 'text-smoke-600 hover:bg-smoke-200 hover:text-smoke-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded-lg transition-all ${
                viewMode === 'week' 
                  ? 'bg-smoke-700 text-smoke-50' 
                  : 'text-smoke-600 hover:bg-smoke-200 hover:text-smoke-900'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div>
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-smoke-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, index) => {
              const dateString = date.toDateString();
              const dayAppointments = appointmentsByDate[dateString] || [];
              const isInCurrentMonth = isCurrentMonth(date);
              const isTodayDate = isToday(date);

              return (
                <div
                  key={index}
                  className={`
                    min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all duration-200
                    ${isInCurrentMonth ? 'bg-white hover:bg-smoke-50' : 'bg-smoke-50/50'}
                    ${isTodayDate ? 'ring-2 ring-smoke-500 border-smoke-500' : 'border-smoke-200'}
                    ${!isTodayDate && isInCurrentMonth ? 'hover:border-smoke-400' : ''}
                  `}
                  onClick={() => onDateClick?.(date)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium ${
                      isInCurrentMonth ? 'text-smoke-900' : 'text-smoke-400'
                    } ${isTodayDate ? 'font-bold' : ''}`}>
                      {date.getDate()}
                    </span>
                    {isInCurrentMonth && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCreateClick?.(date);
                        }}
                        className="opacity-0 hover:opacity-100 p-1 hover:bg-smoke-200 rounded transition-opacity"
                      >
                        <Plus className="w-3 h-3 text-smoke-600" />
                      </button>
                    )}
                  </div>

                  {/* Appointments */}
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((appointment, idx) => (
                      <div
                        key={appointment.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick?.(appointment);
                        }}
                        className={`
                          text-xs p-1 rounded truncate cursor-pointer transition-all
                          ${getStatusColor(appointment.status)}
                          hover:opacity-80 hover:shadow-sm
                        `}
                        title={`${formatTime(appointment.startTime)} - ${appointment.customer?.name || 'Anonymous'}`}
                      >
                        <span className="font-medium">{formatTime(appointment.startTime)}</span>
                        <span className="ml-1 opacity-90">
                          {appointment.customer?.name || 'Anonymous'}
                        </span>
                      </div>
                    ))}
                    
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-smoke-500 text-center">
                        +{dayAppointments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-smoke-200">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${getStatusColor(BookingStatus.PENDING)}`} />
              <span className="text-smoke-600">Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${getStatusColor(BookingStatus.SCHEDULED)}`} />
              <span className="text-smoke-600">Scheduled</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${getStatusColor(BookingStatus.CONFIRMED)}`} />
              <span className="text-smoke-600">Confirmed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${getStatusColor(BookingStatus.COMPLETED)}`} />
              <span className="text-smoke-600">Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded ${getStatusColor(BookingStatus.CANCELLED)}`} />
              <span className="text-smoke-600">Cancelled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for status badges
function getStatusBadge(status: string) {
  const statusConfig: Record<string, string> = {
    scheduled: 'badge-success',
    completed: 'badge-info',
    cancelled: 'badge-error',
    confirmed: 'badge-success',
    pending: 'badge-warning',
  };
  return statusConfig[status] || 'badge-ghost';
} 
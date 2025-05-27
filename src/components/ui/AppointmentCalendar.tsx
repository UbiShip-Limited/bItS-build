'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { BookingStatus, BookingType, type AppointmentData } from '@/lib/api/services/appointmentService';

interface AppointmentCalendarProps {
  appointments: AppointmentData[];
  onDateClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: AppointmentData) => void;
  onCreateClick?: (date: Date) => void;
}

export default function AppointmentCalendar({
  appointments,
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

    const days = [];
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
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'month' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'week' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
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
                  min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                  ${isInCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isTodayDate ? 'border-blue-500 border-2' : 'border-gray-200'}
                  hover:bg-gray-50
                `}
                onClick={() => onDateClick?.(date)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm ${
                    isInCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isTodayDate ? 'font-bold' : ''}`}>
                    {date.getDate()}
                  </span>
                  {isInCurrentMonth && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateClick?.(date);
                      }}
                      className="opacity-0 hover:opacity-100 p-1 hover:bg-blue-100 rounded"
                    >
                      <Plus className="w-3 h-3" />
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
                        text-xs p-1 rounded truncate cursor-pointer
                        ${getStatusColor(appointment.status)}
                        hover:opacity-80
                      `}
                      title={`${formatTime(appointment.startTime)} - ${appointment.customer?.name || 'Anonymous'}`}
                    >
                      <span className="font-medium">{formatTime(appointment.startTime)}</span>
                      <span className="ml-1 text-gray-600">
                        {appointment.customer?.name || 'Anonymous'}
                      </span>
                    </div>
                  ))}
                  
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
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
      <div className="p-4 border-t">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${getStatusColor(BookingStatus.PENDING)}`} />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${getStatusColor(BookingStatus.SCHEDULED)}`} />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${getStatusColor(BookingStatus.CONFIRMED)}`} />
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${getStatusColor(BookingStatus.COMPLETED)}`} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded ${getStatusColor(BookingStatus.CANCELLED)}`} />
            <span>Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { BookingStatus, type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';
import CalendarHeader from './calendar/CalendarHeader';
import CalendarFilters from './calendar/CalendarFilters';
import MonthView from './calendar/MonthView';
import WeekView from './calendar/WeekView';
import CalendarLegend from './calendar/CalendarLegend';
import QuickActionsMenu from './calendar/QuickActionsMenu';
import { useCalendarNavigation } from './calendar/hooks/useCalendarNavigation';
import { useAppointmentFiltering } from './calendar/hooks/useAppointmentFiltering';
import { useKeyboardShortcuts } from './calendar/hooks/useKeyboardShortcuts';
import { useCalendarStats } from './calendar/hooks/useCalendarStats';

interface AppointmentCalendarProps {
  appointments: AppointmentData[];
  onDateClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: AppointmentData) => void;
  onCreateClick?: (date: Date) => void;
  onStatusChange?: (appointmentId: string, status: BookingStatus) => void;
  onRefresh?: () => void;
  onMonthChange?: (date: Date) => void;
  loading?: boolean;
}

export default function AppointmentCalendar({
  appointments = [],
  onDateClick,
  onAppointmentClick,
  onCreateClick,
  onStatusChange,
  onRefresh,
  onMonthChange,
  loading = false
}: AppointmentCalendarProps) {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [showQuickActions, setShowQuickActions] = useState<string | null>(null);

  // Custom hooks
  const { currentDate, setCurrentDate, navigate, calendarDays, goToToday } = useCalendarNavigation(viewMode, onMonthChange);
  const { 
    filteredAppointments, 
    searchTerm, 
    setSearchTerm, 
    statusFilter, 
    setStatusFilter,
    appointmentsByDateTime
  } = useAppointmentFiltering(appointments);
  const { dayStats } = useCalendarStats(filteredAppointments);

  useKeyboardShortcuts({
    onNavigate: navigate,
    onToday: goToToday,
    onViewMode: setViewMode,
    onRefresh
  });

  const handleQuickStatusChange = (appointmentId: string, newStatus: BookingStatus) => {
    onStatusChange?.(appointmentId, newStatus);
    setShowQuickActions(null);
  };

  return (
    <div className="card bg-smoke-100 shadow-smoke hover:shadow-smoke-lg transition-all duration-300 border border-smoke-200">
      <div className="card-body">
        <CalendarHeader
          currentDate={currentDate}
          viewMode={viewMode}
          loading={loading}
          onNavigate={navigate}
          onToday={goToToday}
          onViewModeChange={setViewMode}
          onRefresh={onRefresh}
        />

        <CalendarFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          appointmentCount={filteredAppointments.length}
          onSearchChange={setSearchTerm}
          onStatusFilterChange={setStatusFilter}
        />

        {viewMode === 'week' ? (
          <WeekView
            calendarDays={calendarDays}
            appointmentsByDateTime={appointmentsByDateTime}
            dayStats={dayStats}
            onDateClick={onDateClick}
            onCreateClick={onCreateClick}
            onAppointmentClick={onAppointmentClick}
            onShowQuickActions={setShowQuickActions}
          />
        ) : (
          <MonthView
            calendarDays={calendarDays}
            currentDate={currentDate}
            appointmentsByDateTime={appointmentsByDateTime}
            dayStats={dayStats}
            onDateClick={onDateClick}
            onCreateClick={onCreateClick}
            onAppointmentClick={onAppointmentClick}
            onShowQuickActions={setShowQuickActions}
          />
        )}

        <CalendarLegend />
      </div>

      <QuickActionsMenu
        appointmentId={showQuickActions}
        onStatusChange={handleQuickStatusChange}
        onClose={() => setShowQuickActions(null)}
      />
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
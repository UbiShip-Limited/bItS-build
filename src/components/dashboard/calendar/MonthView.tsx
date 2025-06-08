import { type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';
import DayCell from './DayCell';
import { DayStats } from '../hooks/useCalendarStats';

interface MonthViewProps {
  calendarDays: Date[];
  currentDate: Date;
  appointmentsByDateTime: Record<string, Record<string, AppointmentData[]>>;
  dayStats: Record<string, DayStats>;
  onDateClick?: (date: Date) => void;
  onCreateClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: AppointmentData) => void;
  onShowQuickActions?: (appointmentId: string) => void;
}

export default function MonthView({
  calendarDays,
  currentDate,
  appointmentsByDateTime,
  dayStats,
  onDateClick,
  onCreateClick,
  onAppointmentClick,
  onShowQuickActions
}: MonthViewProps) {
  return (
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
          const dayAppointments = Object.values(appointmentsByDateTime[dateString] || {}).flat();
          const stats = dayStats[dateString];

          return (
            <DayCell
              key={index}
              date={date}
              currentDate={currentDate}
              appointments={dayAppointments}
              stats={stats}
              onDateClick={onDateClick}
              onCreateClick={onCreateClick}
              onAppointmentClick={onAppointmentClick}
              onShowQuickActions={onShowQuickActions}
            />
          );
        })}
      </div>
    </div>
  );
} 
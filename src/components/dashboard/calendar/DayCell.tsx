import { Plus, TrendingUp } from 'lucide-react';
import { type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';
import AppointmentCard from './AppointmentCard';
import { DayStats } from '../hooks/useCalendarStats';
import { isToday, isSameMonth } from '../utils/calendarUtils';

interface DayCellProps {
  date: Date;
  currentDate: Date;
  appointments: AppointmentData[];
  stats?: DayStats;
  onDateClick?: (date: Date) => void;
  onCreateClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: AppointmentData) => void;
  onShowQuickActions?: (appointmentId: string) => void;
}

export default function DayCell({
  date,
  currentDate,
  appointments,
  stats,
  onDateClick,
  onCreateClick,
  onAppointmentClick,
  onShowQuickActions
}: DayCellProps) {
  const isInCurrentMonth = isSameMonth(date, currentDate);
  const isTodayDate = isToday(date);

  return (
    <div
      className={`
        min-h-[120px] p-2 border rounded-lg cursor-pointer transition-all duration-200
        ${isInCurrentMonth ? 'bg-white hover:bg-smoke-50' : 'bg-smoke-50/50'}
        ${isTodayDate ? 'ring-2 ring-[#C9A449] border-[#C9A449]' : 'border-smoke-200'}
        ${!isTodayDate && isInCurrentMonth ? 'hover:border-smoke-400' : ''}
      `}
      onClick={() => onDateClick?.(date)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${
            isInCurrentMonth ? 'text-smoke-900' : 'text-smoke-400'
          } ${isTodayDate ? 'font-bold text-[#C9A449]' : ''}`}>
            {date.getDate()}
          </span>
          {stats && (
            <div className="text-xs text-smoke-500">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stats.total}
              </div>
              {stats.revenue > 0 && (
                <div className="text-green-600">${stats.revenue}</div>
              )}
            </div>
          )}
        </div>
        {isInCurrentMonth && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateClick?.(date);
            }}
            className="opacity-0 hover:opacity-100 p-1 hover:bg-smoke-200 rounded transition-opacity"
            title="Add appointment"
          >
            <Plus className="w-3 h-3 text-smoke-600" />
          </button>
        )}
      </div>

      {/* Appointments */}
      <div className="space-y-1">
        {appointments.slice(0, 3).map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            variant="compact"
            onClick={(e) => {
              e.stopPropagation();
              onAppointmentClick?.(appointment);
            }}
            onRightClick={(e) => {
              e.preventDefault();
              onShowQuickActions?.(appointment.id);
            }}
          />
        ))}
        
        {appointments.length > 3 && (
          <div className="text-xs text-smoke-500 text-center py-1">
            +{appointments.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
} 
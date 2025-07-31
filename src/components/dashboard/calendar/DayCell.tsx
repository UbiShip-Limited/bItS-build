import { Plus, TrendingUp } from 'lucide-react';
import { type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';
import AppointmentCard from './AppointmentCard';
import { DayStats } from './hooks/useCalendarStats';
import { isToday, isSameMonth } from '../utils/calendarUtils';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

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
        min-h-[120px] p-2 border ${components.radius.small} cursor-pointer ${effects.transitionNormal}
        ${isInCurrentMonth ? 'bg-white/5 hover:bg-white/10' : 'bg-obsidian/30'}
        ${isTodayDate ? `ring-2 ring-gold-500 ${colors.borderDefault}` : colors.borderSubtle}
        ${!isTodayDate && isInCurrentMonth ? `hover:${colors.borderDefault}` : ''}
      `}
      onClick={() => onDateClick?.(date)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className={`${typography.textSm} ${typography.fontMedium} ${
            isInCurrentMonth ? colors.textPrimary : colors.textMuted
          } ${isTodayDate ? `${typography.fontSemibold} ${colors.textAccent}` : ''}`}>
            {date.getDate()}
          </span>
          {stats && (
            <div className={`${typography.textXs} ${colors.textMuted}`}>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stats.total}
              </div>
              {stats.revenue > 0 && (
                <div className="text-green-400">${stats.revenue}</div>
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
            className={`opacity-0 hover:opacity-100 p-1 hover:bg-white/10 ${components.radius.small} ${effects.transitionNormal}`}
            title="Add appointment"
          >
            <Plus className={`w-3 h-3 ${colors.textSecondary}`} />
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
          <div className={`${typography.textXs} ${colors.textMuted} text-center py-1`}>
            +{appointments.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
} 
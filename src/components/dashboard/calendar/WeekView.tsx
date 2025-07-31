import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';
import AppointmentCard from './AppointmentCard';
import { DayStats } from './hooks/useCalendarStats';
import { isToday, generateTimeSlots } from '../utils/calendarUtils';
import { typography, colors, effects, components } from '@/src/lib/styles/globalStyleConstants';

interface WeekViewProps {
  calendarDays: Date[];
  appointmentsByDateTime: Record<string, Record<string, AppointmentData[]>>;
  dayStats: Record<string, DayStats>;
  onDateClick?: (date: Date) => void;
  onCreateClick?: (date: Date) => void;
  onAppointmentClick?: (appointment: AppointmentData) => void;
  onShowQuickActions?: (appointmentId: string) => void;
}

export default function WeekView({
  calendarDays,
  appointmentsByDateTime,
  dayStats,
  onDateClick,
  onCreateClick,
  onAppointmentClick,
  onShowQuickActions
}: WeekViewProps) {
  const timeSlots = generateTimeSlots();

  return (
    <div className="flex flex-col">
      {/* Time column + Day headers */}
      <div className={`grid grid-cols-8 border-b ${colors.borderSubtle}`}>
        <div className={`p-3 ${typography.textSm} ${typography.fontMedium} ${colors.textMuted}`}>Time</div>
        {calendarDays.map(date => {
          const stats = dayStats[date.toDateString()];
          
          return (
            <div 
              key={date.toISOString()} 
              className={`p-3 text-center border-l ${colors.borderSubtle} cursor-pointer hover:bg-white/5 ${effects.transitionNormal}`}
              onClick={() => onDateClick?.(date)}
            >
              <div className={`${typography.textSm} ${typography.fontMedium} ${isToday(date) ? colors.textAccent : colors.textSecondary}`}>
                {format(date, 'EEE')}
              </div>
              <div className={`${typography.textLg} ${isToday(date) ? `${typography.fontSemibold} ${colors.textAccent}` : colors.textPrimary}`}>
                {format(date, 'd')}
              </div>
              {stats && (
                <div className={`${typography.textXs} ${colors.textMuted} mt-1`}>
                  {stats.total} apt{stats.total !== 1 ? 's' : ''}
                  {stats.revenue > 0 && (
                    <div className="text-green-400">${stats.revenue}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Time slots */}
      <div className="overflow-y-auto max-h-[600px]">
        {timeSlots.map(timeSlot => (
          <div key={timeSlot} className={`grid grid-cols-8 border-b ${colors.borderSubtle} min-h-[60px]`}>
            <div className={`p-2 ${typography.textSm} ${colors.textMuted} border-r ${colors.borderSubtle} flex items-center`}>
              {timeSlot}
            </div>
            {calendarDays.map(date => {
              const dateKey = date.toDateString();
              const appointments = appointmentsByDateTime[dateKey]?.[timeSlot] || [];
              
              return (
                <div 
                  key={`${date.toISOString()}-${timeSlot}`}
                  className={`border-l ${colors.borderSubtle} p-1 relative group cursor-pointer hover:bg-white/5 min-h-[60px] ${effects.transitionNormal}`}
                  onClick={() => {
                    const [hour, minute] = timeSlot.split(':').map(Number);
                    const selectedDateTime = new Date(date);
                    selectedDateTime.setHours(hour, minute, 0, 0);
                    onCreateClick?.(selectedDateTime);
                  }}
                >
                  <Plus className={`w-4 h-4 ${colors.textMuted} opacity-0 group-hover:opacity-100 absolute top-1 right-1 ${effects.transitionNormal}`} />
                  
                  <div className="space-y-1">
                    {appointments.map(appointment => (
                      <AppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        variant="detailed"
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
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
} 
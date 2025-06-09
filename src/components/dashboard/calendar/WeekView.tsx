import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';
import AppointmentCard from './AppointmentCard';
import { DayStats } from './hooks/useCalendarStats';
import { isToday, generateTimeSlots } from '../utils/calendarUtils';

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
      <div className="grid grid-cols-8 border-b border-smoke-200">
        <div className="p-3 text-sm font-medium text-smoke-500">Time</div>
        {calendarDays.map(date => {
          const stats = dayStats[date.toDateString()];
          
          return (
            <div 
              key={date.toISOString()} 
              className="p-3 text-center border-l border-smoke-200 cursor-pointer hover:bg-smoke-50"
              onClick={() => onDateClick?.(date)}
            >
              <div className={`text-sm font-medium ${isToday(date) ? 'text-[#C9A449]' : 'text-smoke-700'}`}>
                {format(date, 'EEE')}
              </div>
              <div className={`text-lg ${isToday(date) ? 'font-bold text-[#C9A449]' : 'text-smoke-900'}`}>
                {format(date, 'd')}
              </div>
              {stats && (
                <div className="text-xs text-smoke-500 mt-1">
                  {stats.total} apt{stats.total !== 1 ? 's' : ''}
                  {stats.revenue > 0 && (
                    <div className="text-green-600">${stats.revenue}</div>
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
          <div key={timeSlot} className="grid grid-cols-8 border-b border-smoke-100 min-h-[60px]">
            <div className="p-2 text-sm text-smoke-500 border-r border-smoke-200 flex items-center">
              {timeSlot}
            </div>
            {calendarDays.map(date => {
              const dateKey = date.toDateString();
              const appointments = appointmentsByDateTime[dateKey]?.[timeSlot] || [];
              
              return (
                <div 
                  key={`${date.toISOString()}-${timeSlot}`}
                  className="border-l border-smoke-100 p-1 relative group cursor-pointer hover:bg-smoke-50 min-h-[60px]"
                  onClick={() => {
                    const [hour, minute] = timeSlot.split(':').map(Number);
                    const selectedDateTime = new Date(date);
                    selectedDateTime.setHours(hour, minute, 0, 0);
                    onCreateClick?.(selectedDateTime);
                  }}
                >
                  <Plus className="w-4 h-4 text-smoke-400 opacity-0 group-hover:opacity-100 absolute top-1 right-1 transition-opacity" />
                  
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
import { Clock, User, DollarSign, Mail, Phone } from 'lucide-react';
import { type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';
import { formatTime } from '../utils/calendarUtils';
import { typography, colors, effects, components } from '@/src/lib/styles/globalStyleConstants';

interface AppointmentTooltipProps {
  appointment: AppointmentData;
}

export default function AppointmentTooltip({ appointment }: AppointmentTooltipProps) {
  return (
    <div className={`absolute z-50 p-3 bg-obsidian/95 backdrop-blur-sm ${components.radius.medium} ${effects.shadowLight} border ${colors.borderSubtle} min-w-[250px] top-0 left-full ml-2 pointer-events-none`}>
      <div className="space-y-2">
        <div className={`${typography.fontMedium} ${colors.textPrimary}`}>
          {appointment.customer?.name || 'Anonymous Appointment'}
        </div>
        
        <div className={`${typography.textSm} ${colors.textSecondary} space-y-1`}>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>
              {formatTime(appointment.startTime)} 
              {appointment.duration && ` (${appointment.duration} min)`}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="w-3 h-3" />
            <span>{appointment.type}</span>
          </div>
          
          {appointment.priceQuote && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              <span>${appointment.priceQuote}</span>
            </div>
          )}

          {appointment.customer?.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3" />
              <span className="truncate">{appointment.customer.email}</span>
            </div>
          )}

          {appointment.customer?.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3" />
              <span>{appointment.customer.phone}</span>
            </div>
          )}
        </div>

        {appointment.notes && (
          <div className={`${typography.textSm} ${colors.textMuted} border-t ${colors.borderSubtle} pt-2`}>
            <div className={`${typography.fontMedium} mb-1`}>Notes:</div>
            <div className={typography.textXs}>{appointment.notes}</div>
          </div>
        )}

        <div className={`${typography.textXs} ${colors.textMuted} border-t ${colors.borderSubtle} pt-2`}>
          Status: <span className="capitalize">{appointment.status.replace('_', ' ').toLowerCase()}</span>
        </div>
      </div>
    </div>
  );
} 
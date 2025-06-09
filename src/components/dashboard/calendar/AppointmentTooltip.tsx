import { Clock, User, DollarSign, Mail, Phone } from 'lucide-react';
import { type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';
import { formatTime } from '../utils/calendarUtils';

interface AppointmentTooltipProps {
  appointment: AppointmentData;
}

export default function AppointmentTooltip({ appointment }: AppointmentTooltipProps) {
  return (
    <div className="absolute z-50 p-3 bg-white rounded-lg shadow-lg border border-smoke-200 min-w-[250px] top-0 left-full ml-2 pointer-events-none">
      <div className="space-y-2">
        <div className="font-medium text-smoke-900">
          {appointment.customer?.name || 'Anonymous Appointment'}
        </div>
        
        <div className="text-sm text-smoke-600 space-y-1">
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
          <div className="text-sm text-smoke-500 border-t pt-2">
            <div className="font-medium mb-1">Notes:</div>
            <div className="text-xs">{appointment.notes}</div>
          </div>
        )}

        <div className="text-xs text-smoke-400 border-t pt-2">
          Status: <span className="capitalize">{appointment.status.replace('_', ' ').toLowerCase()}</span>
        </div>
      </div>
    </div>
  );
} 
import { BookingStatus } from '@/src/lib/api/services/appointmentApiClient';
import { getStatusColor } from '../utils/calendarUtils';
import { typography, colors, components } from '@/src/lib/styles/globalStyleConstants';

export default function CalendarLegend() {
  const statusItems = [
    { status: BookingStatus.PENDING, label: 'Pending' },
    { status: BookingStatus.SCHEDULED, label: 'Scheduled' },
    { status: BookingStatus.CONFIRMED, label: 'Confirmed' },
    { status: BookingStatus.COMPLETED, label: 'Completed' },
    { status: BookingStatus.CANCELLED, label: 'Cancelled' },
    { status: BookingStatus.NO_SHOW, label: 'No Show' }
  ];

  return (
    <div className={`mt-6 pt-4 border-t ${colors.borderSubtle}`}>
      <div className={`flex flex-wrap gap-4 ${typography.textXs}`}>
        {statusItems.map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1">
            <div className={`w-3 h-3 ${components.radius.small} border ${getStatusColor(status)}`} />
            <span className={colors.textSecondary}>{label}</span>
          </div>
        ))}
        
        <div className={`ml-auto ${colors.textMuted}`}>
          <span className={typography.fontMedium}>Shortcuts:</span> ←→ Navigate • T Today • M Month • W Week • Ctrl+R Refresh
        </div>
      </div>
    </div>
  );
} 
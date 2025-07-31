import { Search, Filter } from 'lucide-react';
import { BookingStatus } from '@/src/lib/api/services/appointmentApiClient';
import { typography, colors, effects, components } from '@/src/lib/styles/globalStyleConstants';

interface CalendarFiltersProps {
  searchTerm: string;
  statusFilter: BookingStatus | '';
  appointmentCount: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: BookingStatus | '') => void;
}

export default function CalendarFilters({
  searchTerm,
  statusFilter,
  appointmentCount,
  onSearchChange,
  onStatusFilterChange
}: CalendarFiltersProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative flex-1 max-w-xs">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${colors.textMuted}`} />
        <input
          type="text"
          placeholder="Search appointments..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`pl-10 pr-4 py-2 ${components.input} ${typography.textSm}`}
        />
      </div>
      
      <div className="relative">
        <Filter className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${colors.textMuted}`} />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as BookingStatus | '')}
          className={`pl-10 pr-8 py-2 ${components.input} ${typography.textSm} appearance-none`}
        >
          <option value="">All Status</option>
          <option value={BookingStatus.PENDING}>Pending</option>
          <option value={BookingStatus.SCHEDULED}>Scheduled</option>
          <option value={BookingStatus.CONFIRMED}>Confirmed</option>
          <option value={BookingStatus.COMPLETED}>Completed</option>
          <option value={BookingStatus.CANCELLED}>Cancelled</option>
          <option value={BookingStatus.NO_SHOW}>No Show</option>
        </select>
      </div>

      <div className={`${typography.textSm} ${colors.textSecondary}`}>
        {appointmentCount} appointment{appointmentCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
} 
import { Search, Filter } from 'lucide-react';
import { BookingStatus } from '@/src/lib/api/services/appointmentApiClient';

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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-smoke-400" />
        <input
          type="text"
          placeholder="Search appointments..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4 py-2 border border-smoke-300 rounded-lg focus:ring-2 focus:ring-[#C9A449] focus:border-[#C9A449] text-sm w-full"
        />
      </div>
      
      <div className="relative">
        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-smoke-400" />
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as BookingStatus | '')}
          className="pl-10 pr-8 py-2 border border-smoke-300 rounded-lg focus:ring-2 focus:ring-[#C9A449] focus:border-[#C9A449] text-sm appearance-none bg-white"
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

      <div className="text-sm text-smoke-600">
        {appointmentCount} appointment{appointmentCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
} 
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: 'month' | 'week';
  loading?: boolean;
  onNavigate: (direction: number) => void;
  onToday: () => void;
  onViewModeChange: (mode: 'month' | 'week') => void;
  onRefresh?: () => void;
}

export default function CalendarHeader({
  currentDate,
  viewMode,
  loading = false,
  onNavigate,
  onToday,
  onViewModeChange,
  onRefresh
}: CalendarHeaderProps) {
  const getTitle = () => {
    if (viewMode === 'week') {
      return `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-smoke-900">
          {getTitle()}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => onNavigate(-1)}
            className="btn btn-circle btn-sm btn-ghost text-smoke-600 hover:text-smoke-900 hover:bg-smoke-200"
            title={`Previous ${viewMode}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onToday}
            className="btn btn-sm btn-ghost text-smoke-600 hover:text-smoke-900 hover:bg-smoke-200"
            title="Go to today (T)"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate(1)}
            className="btn btn-circle btn-sm btn-ghost text-smoke-600 hover:text-smoke-900 hover:bg-smoke-200"
            title={`Next ${viewMode}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="btn btn-circle btn-sm btn-ghost text-smoke-600 hover:text-smoke-900 hover:bg-smoke-200 disabled:opacity-50"
              title="Refresh (Ctrl+R)"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onViewModeChange('month')}
          className={`px-3 py-1 text-sm rounded-lg transition-all ${
            viewMode === 'month' 
              ? 'bg-smoke-700 text-smoke-50' 
              : 'text-smoke-600 hover:bg-smoke-200 hover:text-smoke-900'
          }`}
          title="Month view (M)"
        >
          Month
        </button>
        <button
          onClick={() => onViewModeChange('week')}
          className={`px-3 py-1 text-sm rounded-lg transition-all ${
            viewMode === 'week' 
              ? 'bg-smoke-700 text-smoke-50' 
              : 'text-smoke-600 hover:bg-smoke-200 hover:text-smoke-900'
          }`}
          title="Week view (W)"
        >
          Week
        </button>
      </div>
    </div>
  );
} 
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

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
        <h2 className={`${typography.textXl} ${typography.fontSemibold} ${colors.textPrimary}`}>
          {getTitle()}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => onNavigate(-1)}
            className={`${components.button.base} ${components.button.sizes.small} ${components.button.variants.ghost} p-2`}
            title={`Previous ${viewMode}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onToday}
            className={`${components.button.base} ${components.button.sizes.small} ${components.button.variants.ghost}`}
            title="Go to today (T)"
          >
            Today
          </button>
          <button
            onClick={() => onNavigate(1)}
            className={`${components.button.base} ${components.button.sizes.small} ${components.button.variants.ghost} p-2`}
            title={`Next ${viewMode}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className={`${components.button.base} ${components.button.sizes.small} ${components.button.variants.ghost} p-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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
          className={`px-3 py-1 ${typography.textSm} ${components.radius.medium} ${effects.transitionNormal} ${
            viewMode === 'month' 
              ? `bg-gold-500/20 ${colors.textAccent} border ${colors.borderDefault}` 
              : `${colors.textSecondary} hover:bg-white/5 hover:${colors.textPrimary}`
          }`}
          title="Month view (M)"
        >
          Month
        </button>
        <button
          onClick={() => onViewModeChange('week')}
          className={`px-3 py-1 ${typography.textSm} ${components.radius.medium} ${effects.transitionNormal} ${
            viewMode === 'week' 
              ? `bg-gold-500/20 ${colors.textAccent} border ${colors.borderDefault}` 
              : `${colors.textSecondary} hover:bg-white/5 hover:${colors.textPrimary}`
          }`}
          title="Week view (W)"
        >
          Week
        </button>
      </div>
    </div>
  );
} 
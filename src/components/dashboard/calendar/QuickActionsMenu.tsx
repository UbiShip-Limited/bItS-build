import { useRef, useEffect } from 'react';
import { BookingStatus } from '@/src/lib/api/services/appointmentApiClient';
import { getStatusColor } from '../utils/calendarUtils';
import { typography, colors, effects, components } from '@/src/lib/styles/globalStyleConstants';

interface QuickActionsMenuProps {
  appointmentId: string | null;
  onStatusChange: (appointmentId: string, status: BookingStatus) => void;
  onClose: () => void;
}

export default function QuickActionsMenu({
  appointmentId,
  onStatusChange,
  onClose
}: QuickActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (appointmentId) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [appointmentId, onClose]);

  if (!appointmentId) return null;

  const statusOptions = [
    { value: BookingStatus.PENDING, label: 'Mark as Pending' },
    { value: BookingStatus.SCHEDULED, label: 'Mark as Scheduled' },
    { value: BookingStatus.CONFIRMED, label: 'Mark as Confirmed' },
    { value: BookingStatus.COMPLETED, label: 'Mark as Completed' },
    { value: BookingStatus.CANCELLED, label: 'Mark as Cancelled' },
    { value: BookingStatus.NO_SHOW, label: 'Mark as No Show' }
  ];

  return (
    <div 
      ref={menuRef}
      className={`fixed z-50 bg-obsidian/95 backdrop-blur-sm ${components.radius.medium} ${effects.shadowLight} border ${colors.borderSubtle} py-2 min-w-[180px]`}
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className={`px-3 py-1 ${typography.textXs} ${typography.fontMedium} ${colors.textMuted} border-b ${colors.borderSubtle} mb-1`}>
        Quick Actions
      </div>
      {statusOptions.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onStatusChange(appointmentId, value)}
          className={`w-full px-3 py-2 text-left ${typography.textSm} hover:bg-white/5 flex items-center gap-2 ${effects.transitionNormal} ${colors.textSecondary} hover:${colors.textPrimary}`}
        >
          <div className={`w-3 h-3 ${components.radius.small} border ${getStatusColor(value)}`} />
          {label}
        </button>
      ))}
    </div>
  );
} 
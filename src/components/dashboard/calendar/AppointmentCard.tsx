import { useState } from 'react';
import { Clock, User, DollarSign } from 'lucide-react';
import { type AppointmentData } from '@/src/lib/api/services/appointmentApiClient';
import { formatTime, getStatusColor } from '../utils/calendarUtils';
import AppointmentTooltip from './AppointmentTooltip';
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

interface AppointmentCardProps {
  appointment: AppointmentData;
  variant?: 'compact' | 'detailed';
  onClick?: (e: React.MouseEvent) => void;
  onRightClick?: (e: React.MouseEvent) => void;
}

export default function AppointmentCard({
  appointment,
  variant = 'compact',
  onClick,
  onRightClick
}: AppointmentCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (variant === 'compact') {
    return (
      <div
        className={`
          ${typography.textXs} p-1 ${components.radius.small} border cursor-pointer ${effects.transitionNormal} relative
          ${getStatusColor(appointment.status)}
          hover:shadow-md hover:shadow-gold-500/10
        `}
        title={`${formatTime(appointment.startTime)} - ${appointment.customer?.name || 'Anonymous'}`}
        onClick={onClick}
        onContextMenu={onRightClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className={`${typography.fontMedium} truncate`}>{formatTime(appointment.startTime)}</div>
        <div className="opacity-90 truncate">
          {appointment.customer?.name || 'Anonymous'}
        </div>
        
        {showTooltip && (
          <AppointmentTooltip appointment={appointment} />
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        p-2 ${components.radius.small} border cursor-pointer ${effects.transitionNormal} relative
        ${getStatusColor(appointment.status)}
        hover:shadow-md hover:shadow-gold-500/10
      `}
      onClick={onClick}
      onContextMenu={onRightClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="space-y-1">
        <div className={`${typography.fontMedium} truncate`}>
          {appointment.customer?.name || 'Anonymous'}
        </div>
        <div className={`${typography.textSm} text-current opacity-75 truncate`}>
          {appointment.type}
        </div>
        <div className={`flex items-center gap-2 ${typography.textXs}`}>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(appointment.startTime)}
          </div>
          {appointment.duration && (
            <span>({appointment.duration}min)</span>
          )}
        </div>
        {appointment.priceQuote && (
          <div className={`flex items-center gap-1 ${typography.textXs}`}>
            <DollarSign className="w-3 h-3" />
            ${appointment.priceQuote}
          </div>
        )}
      </div>
      
      {showTooltip && (
        <AppointmentTooltip appointment={appointment} />
      )}
    </div>
  );
} 
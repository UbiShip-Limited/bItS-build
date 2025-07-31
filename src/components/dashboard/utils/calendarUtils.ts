import { BookingStatus } from '@/src/lib/api/services/appointmentApiClient';
import { colors } from '@/src/lib/styles/globalStyleConstants';

export const getStatusColor = (status: string) => {
  const statusColors = {
    [BookingStatus.PENDING]: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    [BookingStatus.SCHEDULED]: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    [BookingStatus.CONFIRMED]: 'bg-green-500/20 border-green-500/30 text-green-400',
    [BookingStatus.COMPLETED]: `bg-white/10 ${colors.borderSubtle} ${colors.textSecondary}`,
    [BookingStatus.CANCELLED]: 'bg-red-500/20 border-red-500/30 text-red-400',
    [BookingStatus.NO_SHOW]: 'bg-orange-500/20 border-orange-500/30 text-orange-400'
  };
  return statusColors[status] || `bg-white/10 ${colors.borderSubtle} ${colors.textSecondary}`;
};

export const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const isToday = (date: Date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isSameMonth = (date: Date, referenceDate: Date) => {
  return date.getMonth() === referenceDate.getMonth() && 
         date.getFullYear() === referenceDate.getFullYear();
};

export const generateTimeSlots = (startHour = 8, endHour = 20): string[] => {
  const slots: string[] = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    slots.push(`${hour}:00`, `${hour}:30`);
  }
  return slots;
};

export const getTimeSlotKey = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours}:${minutes < 30 ? '00' : '30'}`;
}; 
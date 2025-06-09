import { BookingStatus } from '@/src/lib/api/services/appointmentApiClient';

export const getStatusColor = (status: string) => {
  const colors = {
    [BookingStatus.PENDING]: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    [BookingStatus.SCHEDULED]: 'bg-blue-100 border-blue-300 text-blue-800',
    [BookingStatus.CONFIRMED]: 'bg-green-100 border-green-300 text-green-800',
    [BookingStatus.COMPLETED]: 'bg-gray-100 border-gray-300 text-gray-800',
    [BookingStatus.CANCELLED]: 'bg-red-100 border-red-300 text-red-800',
    [BookingStatus.NO_SHOW]: 'bg-orange-100 border-orange-300 text-orange-800'
  };
  return colors[status] || 'bg-gray-100 border-gray-300 text-gray-800';
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
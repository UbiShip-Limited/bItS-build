import { BusinessHours } from './types';

export const DEFAULT_BUSINESS_HOURS: BusinessHours[] = [
  { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00', isOpen: true }, // Monday
  { dayOfWeek: 2, openTime: '09:00', closeTime: '17:00', isOpen: true }, // Tuesday
  { dayOfWeek: 3, openTime: '09:00', closeTime: '17:00', isOpen: true }, // Wednesday
  { dayOfWeek: 4, openTime: '09:00', closeTime: '17:00', isOpen: true }, // Thursday
  { dayOfWeek: 5, openTime: '09:00', closeTime: '17:00', isOpen: true }, // Friday
  { dayOfWeek: 6, openTime: '10:00', closeTime: '16:00', isOpen: true }, // Saturday
  { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isOpen: false }, // Sunday - closed
];

export const DEFAULT_SLOT_INTERVAL = 30; // 30-minute intervals
export const DEFAULT_LUNCH_BREAK = { startTime: '12:00', endTime: '13:00' };
export const MIN_BOOKING_LEAD_TIME_SECONDS = 3600; // 1 hour
export const MAX_BOOKING_LEAD_TIME_SECONDS = 2592000; // 30 days
export const MAX_BOOKING_ADVANCE_DAYS = 90;
export const DEFAULT_BUFFER_MINUTES = 15; 
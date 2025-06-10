// Core classes
export { AppointmentRepository } from './appointmentRepository';
export { BusinessHoursManager } from './businessHoursManager';
export { ScheduleGenerator } from './scheduleGenerator';
export { SlotGenerator } from './slotGenerator';
export { TimeValidator } from './timeValidator';
export { SquareProfilesManager } from './squareProfiles';

// Types
export type {
  AvailabilitySearchParams,
  AvailabilitySlot,
  AvailabilitySearchResult,
  BusinessHours,
  TeamMemberSchedule,
  AppointmentConflict,
  SuggestedSlot,
  ValidationResult,
  AlternativeTimeOptions,
  ExistingAppointment,
  SlotGenerationParams
} from './types';

// Constants
export {
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_SLOT_INTERVAL,
  DEFAULT_LUNCH_BREAK,
  MIN_BOOKING_LEAD_TIME_SECONDS,
  MAX_BOOKING_LEAD_TIME_SECONDS,
  MAX_BOOKING_ADVANCE_DAYS,
  DEFAULT_BUFFER_MINUTES
} from './constants';

// Utilities
export {
  timeToMinutes,
  minutesToTime,
  formatAppointmentTime,
  timePeriodsOverlap,
  createDateWithTime,
  calculateEndTime,
  isWithinBusinessHours,
  generateDateRange
} from './utils'; 
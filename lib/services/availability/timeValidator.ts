import { ValidationResult, AlternativeTimeOptions, SuggestedSlot } from './types';
import { BusinessHoursManager } from './businessHoursManager';
import { AppointmentRepository } from './appointmentRepository';
import { timeToMinutes, formatAppointmentTime, calculateEndTime } from './utils';
import { MAX_BOOKING_ADVANCE_DAYS, MIN_BOOKING_LEAD_TIME_SECONDS, DEFAULT_BUFFER_MINUTES } from './constants';

export class TimeValidator {
  constructor(
    private businessHoursManager: BusinessHoursManager,
    private appointmentRepository: AppointmentRepository
  ) {}

  /**
   * Validate appointment scheduling rules
   */
  async validateSchedulingRules(
    startTime: Date,
    duration: number,
    artistId?: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // Check business hours
    const dayOfWeek = startTime.getDay();
    const businessHours = this.businessHoursManager.getBusinessHoursForDay(dayOfWeek);

    if (!businessHours || !businessHours.isOpen) {
      errors.push('Appointments cannot be scheduled on closed days');
    } else {
      const appointmentTime = formatAppointmentTime(startTime);
      const endTime = calculateEndTime(startTime, duration);
      const appointmentEndTime = formatAppointmentTime(endTime);

      if (timeToMinutes(appointmentTime) < timeToMinutes(businessHours.openTime)) {
        errors.push('Appointment starts before business hours');
      }

      if (timeToMinutes(appointmentEndTime) > timeToMinutes(businessHours.closeTime)) {
        errors.push('Appointment ends after business hours');
      }
    }

    // Check minimum lead time
    const now = new Date();
    const minimumStartTime = new Date(now.getTime() + MIN_BOOKING_LEAD_TIME_SECONDS * 1000);

    if (startTime < minimumStartTime) {
      errors.push('Appointments must be scheduled at least 1 hour in advance');
    }

    // Check maximum lead time
    const maximumStartTime = new Date(now.getTime() + MAX_BOOKING_ADVANCE_DAYS * 24 * 60 * 60 * 1000);

    if (startTime > maximumStartTime) {
      errors.push(`Appointments cannot be scheduled more than ${MAX_BOOKING_ADVANCE_DAYS} days in advance`);
    }

    // Check for conflicts
    if (artistId) {
      const endTime = calculateEndTime(startTime, duration);
      const conflicts = await this.appointmentRepository.getDetailedConflicts(startTime, endTime, artistId);

      if (conflicts.length > 0) {
        errors.push('Time slot conflicts with existing appointment');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Suggest alternative appointment times
   */
  async suggestAlternativeTimes(
    preferredDate: Date,
    duration: number,
    artistId?: string,
    options: AlternativeTimeOptions = {}
  ): Promise<SuggestedSlot[]> {
    const {
      includeBuffer = true,
      bufferMinutes = DEFAULT_BUFFER_MINUTES,
      respectBusinessHours = true,
      maxSuggestions = 5
    } = options;

    const suggestions: SuggestedSlot[] = [];
    const businessHours = this.businessHoursManager.getBusinessHoursForDay(preferredDate.getDay());
    
    // If business is closed, return empty array
    if (respectBusinessHours && (!businessHours || !businessHours.isOpen)) {
      return suggestions;
    }

    // Set up day boundaries
    const { startOfDay, endOfDay } = this.calculateDayBoundaries(preferredDate, businessHours, respectBusinessHours);

    // Check availability every 30 minutes
    const slotInterval = 30;
    const effectiveDuration = includeBuffer ? duration + bufferMinutes : duration;

    for (let current = new Date(startOfDay); current < endOfDay; current.setMinutes(current.getMinutes() + slotInterval)) {
      const slotEnd = new Date(current.getTime() + effectiveDuration * 60000);
      
      // Don't suggest slots that extend beyond business hours
      if (slotEnd > endOfDay) break;

      const conflicts = await this.appointmentRepository.getDetailedConflicts(current, slotEnd, artistId);
      
      if (conflicts.length === 0) {
        suggestions.push({
          startTime: new Date(current),
          endTime: new Date(current.getTime() + duration * 60000), // Original duration for display
          duration,
          isAvailable: true,
          artistId
        });

        if (suggestions.length >= maxSuggestions) break;
      }
    }

    return suggestions;
  }

  /**
   * Find next available slot for any artist
   */
  async findNextAvailableSlot(
    startDate: Date,
    duration: number,
    artistIds?: string[],
    maxDaysToCheck: number = 30
  ): Promise<SuggestedSlot | null> {
    const currentDate = new Date(startDate);
    const endDate = new Date(startDate.getTime() + maxDaysToCheck * 24 * 60 * 60 * 1000);

    while (currentDate <= endDate) {
      const businessHours = this.businessHoursManager.getBusinessHoursForDay(currentDate.getDay());
      
      if (businessHours && businessHours.isOpen) {
        if (artistIds && artistIds.length > 0) {
          // Check each artist
          for (const artistId of artistIds) {
            const slots = await this.suggestAlternativeTimes(
              currentDate,
              duration,
              artistId,
              { maxSuggestions: 1 }
            );
            
            if (slots.length > 0) {
              return slots[0];
            }
          }
        } else {
          // Check any available slot
          const slots = await this.suggestAlternativeTimes(
            currentDate,
            duration,
            undefined,
            { maxSuggestions: 1 }
          );
          
          if (slots.length > 0) {
            return slots[0];
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0);
    }

    return null;
  }

  /**
   * Get availability for multiple artists for a given day
   */
  async getArtistAvailability(
    date: Date,
    artistIds: string[],
    duration: number = 60
  ): Promise<Record<string, SuggestedSlot[]>> {
    const availability: Record<string, SuggestedSlot[]> = {};

    for (const artistId of artistIds) {
      availability[artistId] = await this.suggestAlternativeTimes(
        date,
        duration,
        artistId,
        { maxSuggestions: 10 }
      );
    }

    return availability;
  }

  /**
   * Calculate day boundaries based on business hours
   */
  private calculateDayBoundaries(
    date: Date,
    businessHours: any,
    respectBusinessHours: boolean
  ): { startOfDay: Date; endOfDay: Date } {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);

    if (respectBusinessHours && businessHours && businessHours.isOpen) {
      const [startHour, startMin] = businessHours.openTime.split(':').map(Number);
      const [endHour, endMin] = businessHours.closeTime.split(':').map(Number);
      
      startOfDay.setHours(startHour, startMin, 0, 0);
      endOfDay.setHours(endHour, endMin, 0, 0);
    } else {
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay.setHours(23, 59, 59, 999);
    }

    return { startOfDay, endOfDay };
  }

  /**
   * Validate time format
   */
  validateTimeFormat(timeString: string): boolean {
    const pattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return pattern.test(timeString);
  }

  /**
   * Check if appointment duration is valid
   */
  validateDuration(duration: number): ValidationResult {
    const errors: string[] = [];

    if (duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (duration < 30) {
      errors.push('Minimum appointment duration is 30 minutes');
    }

    if (duration > 480) { // 8 hours
      errors.push('Maximum appointment duration is 8 hours');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
} 
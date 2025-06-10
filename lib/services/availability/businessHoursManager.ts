import { BusinessHours } from './types';
import { DEFAULT_BUSINESS_HOURS } from './constants';

export class BusinessHoursManager {
  private businessHours: BusinessHours[];

  constructor(customBusinessHours?: BusinessHours[]) {
    this.businessHours = customBusinessHours || [...DEFAULT_BUSINESS_HOURS];
  }

  /**
   * Get business hours for a specific day
   */
  getBusinessHoursForDay(dayOfWeek: number): BusinessHours | null {
    return this.businessHours.find(bh => bh.dayOfWeek === dayOfWeek) || null;
  }

  /**
   * Update business hours
   */
  async updateBusinessHours(businessHours: BusinessHours[]): Promise<void> {
    // In a real implementation, this would save to database
    // For now, just update the in-memory configuration
    this.businessHours = businessHours;
  }

  /**
   * Get all business hours
   */
  getAllBusinessHours(): BusinessHours[] {
    return [...this.businessHours];
  }

  /**
   * Check if business is open on a specific day
   */
  isOpenOnDay(dayOfWeek: number): boolean {
    const hours = this.getBusinessHoursForDay(dayOfWeek);
    return hours?.isOpen || false;
  }

  /**
   * Get opening and closing times for a day
   */
  getDayHours(dayOfWeek: number): { openTime: string; closeTime: string } | null {
    const hours = this.getBusinessHoursForDay(dayOfWeek);
    if (!hours || !hours.isOpen) {
      return null;
    }
    return {
      openTime: hours.openTime,
      closeTime: hours.closeTime
    };
  }

  /**
   * Validate business hours configuration
   */
  validateBusinessHours(businessHours: BusinessHours[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for all days of week
    for (let day = 0; day <= 6; day++) {
      const dayHours = businessHours.find(bh => bh.dayOfWeek === day);
      if (!dayHours) {
        errors.push(`Missing business hours for day ${day}`);
      }
    }

    // Validate time formats and logic
    businessHours.forEach(hours => {
      if (hours.isOpen) {
        const openPattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        const closePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

        if (!openPattern.test(hours.openTime)) {
          errors.push(`Invalid open time format for day ${hours.dayOfWeek}: ${hours.openTime}`);
        }

        if (!closePattern.test(hours.closeTime)) {
          errors.push(`Invalid close time format for day ${hours.dayOfWeek}: ${hours.closeTime}`);
        }

        // Check if open time is before close time
        if (hours.openTime >= hours.closeTime) {
          errors.push(`Open time must be before close time for day ${hours.dayOfWeek}`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
} 
import { prisma } from '../prisma/prisma';
import { BookingStatus } from '../types/booking';
import { addMinutes, format, parseISO } from 'date-fns';
import { Prisma } from '@prisma/client';

export interface AvailabilitySearchParams {
  startAtMin: Date;
  startAtMax: Date;
  locationId?: string;
  teamMemberIds?: string[];
  serviceVariationId?: string;
  duration?: number; // minutes
  maxResults?: number;
}

export interface AvailabilitySlot {
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  availableTeamMembers: string[];
  locationId?: string;
}

export interface AvailabilitySearchResult {
  availabilities: AvailabilitySlot[];
  totalResults: number;
  searchParams: AvailabilitySearchParams;
}

export interface BusinessHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  openTime: string; // "09:00"
  closeTime: string; // "17:00"
  isOpen: boolean;
}

export interface TeamMemberSchedule {
  teamMemberId: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  breakTimes?: Array<{
    startTime: string;
    endTime: string;
  }>;
}

export class AvailabilityService {
  private defaultBusinessHours: BusinessHours[] = [
    { dayOfWeek: 1, openTime: '09:00', closeTime: '17:00', isOpen: true }, // Monday
    { dayOfWeek: 2, openTime: '09:00', closeTime: '17:00', isOpen: true }, // Tuesday
    { dayOfWeek: 3, openTime: '09:00', closeTime: '17:00', isOpen: true }, // Wednesday
    { dayOfWeek: 4, openTime: '09:00', closeTime: '17:00', isOpen: true }, // Thursday
    { dayOfWeek: 5, openTime: '09:00', closeTime: '17:00', isOpen: true }, // Friday
    { dayOfWeek: 6, openTime: '10:00', closeTime: '16:00', isOpen: true }, // Saturday
    { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isOpen: false }, // Sunday - closed
  ];

  /**
   * Search for available appointment slots
   * Aligns with Square's POST /v2/bookings/availability/search
   */
  async searchAvailability(params: AvailabilitySearchParams): Promise<AvailabilitySearchResult> {
    const {
      startAtMin,
      startAtMax,
      locationId,
      teamMemberIds,
      duration = 60,
      maxResults = 50
    } = params;

    try {
      // Get existing appointments in the time range
      const existingAppointments = await this.getExistingAppointments(
        startAtMin,
        startAtMax,
        teamMemberIds
      );

      // Get team member schedules
      const teamMemberSchedules = await this.getTeamMemberSchedules(
        startAtMin,
        startAtMax,
        teamMemberIds
      );

      // Generate available slots
      const availableSlots = await this.generateAvailableSlots({
        startAtMin,
        startAtMax,
        duration,
        existingAppointments,
        teamMemberSchedules,
        locationId,
        teamMemberIds,
        maxResults
      });

      return {
        availabilities: availableSlots,
        totalResults: availableSlots.length,
        searchParams: params
      };
    } catch (error) {
      throw new Error(`Failed to search availability: ${error.message}`);
    }
  }

  /**
   * Get business booking profile
   * Aligns with Square's GET /v2/bookings/business-booking-profile
   */
  async getBusinessBookingProfile() {
    // This would typically come from a database table
    // For now, return default configuration
    return {
      sellerId: process.env.SQUARE_APPLICATION_ID,
      createdAt: new Date().toISOString(),
      bookingEnabled: true,
      customerTimezoneChoice: 'BUSINESS_LOCATION_TIMEZONE',
      bookingPolicy: 'ACCEPT_ALL',
      allowUserCancel: true,
      businessAppointmentSettings: {
        locationTypes: ['PHYSICAL'],
        alignmentTime: 'SERVICE_DURATION',
        minBookingLeadTimeSeconds: 3600, // 1 hour
        maxBookingLeadTimeSeconds: 2592000, // 30 days
        anyTeamMemberBookingEnabled: true,
        multipleServiceBookingEnabled: false,
        maxAppointmentsPerDayLimitType: 'PER_TEAM_MEMBER',
        maxAppointmentsPerDayLimit: 8,
        cancellationWindowSeconds: 86400, // 24 hours
        cancellationFeeMoney: null,
        cancellationPolicy: 'CANCELLATION_TREATED_AS_NO_SHOW',
        cancellationPolicyText: 'Cancellations must be made at least 24 hours in advance.',
        skipBookingFlowStaffSelection: false
      }
    };
  }

  /**
   * Get location booking profiles
   * Aligns with Square's GET /v2/bookings/location-booking-profiles
   */
  async getLocationBookingProfiles() {
    const locationId = process.env.SQUARE_LOCATION_ID;
    
    return [
      {
        locationId,
        bookingEnabled: true,
        onlineBookingEnabled: true,
        businessHours: this.defaultBusinessHours,
        businessAppointmentSettings: {
          locationTypes: ['PHYSICAL'],
          alignmentTime: 'SERVICE_DURATION',
          minBookingLeadTimeSeconds: 3600,
          maxBookingLeadTimeSeconds: 2592000,
          anyTeamMemberBookingEnabled: true,
          multipleServiceBookingEnabled: false,
          maxAppointmentsPerDayLimitType: 'PER_TEAM_MEMBER',
          maxAppointmentsPerDayLimit: 8,
          cancellationWindowSeconds: 86400,
          cancellationPolicy: 'CANCELLATION_TREATED_AS_NO_SHOW'
        }
      }
    ];
  }

  /**
   * Get team member booking profiles
   * Aligns with Square's GET /v2/bookings/team-member-booking-profiles
   */
  async getTeamMemberBookingProfiles(teamMemberIds?: string[]) {
    const whereClause = teamMemberIds?.length 
      ? { id: { in: teamMemberIds }, role: { in: ['artist', 'admin'] } }
      : { role: { in: ['artist', 'admin'] } };

    const teamMembers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return teamMembers.map(member => ({
      teamMemberId: member.id,
      description: `${member.role} - ${member.email}`,
      displayName: member.email,
      isBookable: true,
      teamMemberBookingProfile: {
        teamMemberId: member.id,
        description: `Booking profile for ${member.email}`,
        displayName: member.email,
        isBookable: true,
        hourlyRate: null, // This could come from team member settings
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.createdAt.toISOString()
      }
    }));
  }

  private async getExistingAppointments(
    startAtMin: Date,
    startAtMax: Date,
    teamMemberIds?: string[]
  ) {
    const whereClause: Prisma.AppointmentWhereInput = {
      startTime: {
        gte: startAtMin,
        lte: startAtMax
      },
      status: {
        in: [BookingStatus.SCHEDULED, BookingStatus.CONFIRMED]
      }
    };

    if (teamMemberIds?.length) {
      whereClause.artistId = { in: teamMemberIds };
    }

    return prisma.appointment.findMany({
      where: whereClause,
      select: {
        id: true,
        startTime: true,
        endTime: true,
        duration: true,
        artistId: true,
        status: true
      }
    });
  }

  private async getTeamMemberSchedules(
    startAtMin: Date,
    startAtMax: Date,
    teamMemberIds?: string[]
  ): Promise<TeamMemberSchedule[]> {
    // This would typically come from a team member schedule table
    // For now, generate default schedules based on business hours
    const whereClause = teamMemberIds?.length 
      ? { id: { in: teamMemberIds }, role: { in: ['artist', 'admin'] } }
      : { role: { in: ['artist', 'admin'] } };

    const teamMembers = await prisma.user.findMany({
      where: whereClause,
      select: { id: true }
    });

    const schedules: TeamMemberSchedule[] = [];
    
    // Generate schedules for each day in the range
    const currentDate = new Date(startAtMin);
    while (currentDate <= startAtMax) {
      const dayOfWeek = currentDate.getDay();
      const businessHour = this.defaultBusinessHours.find(bh => bh.dayOfWeek === dayOfWeek);
      
      if (businessHour?.isOpen) {
        teamMembers.forEach(member => {
          schedules.push({
            teamMemberId: member.id,
            date: new Date(currentDate),
            startTime: businessHour.openTime,
            endTime: businessHour.closeTime,
            isAvailable: true,
            breakTimes: [
              { startTime: '12:00', endTime: '13:00' } // Lunch break
            ]
          });
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return schedules;
  }

  private async generateAvailableSlots(params: {
    startAtMin: Date;
    startAtMax: Date;
    duration: number;
    existingAppointments: Array<{
      id: string;
      startTime: Date | null;
      endTime: Date | null;
      duration: number | null;
      artistId: string | null;
      status: string | null;
    }>;
    teamMemberSchedules: TeamMemberSchedule[];
    locationId?: string;
    teamMemberIds?: string[];
    maxResults: number;
  }): Promise<AvailabilitySlot[]> {
    const {
      startAtMin,
      startAtMax,
      duration,
      existingAppointments,
      teamMemberSchedules,
      locationId,
      maxResults
    } = params;

    const slots: AvailabilitySlot[] = [];
    const slotInterval = 30; // 30-minute intervals

    // Group schedules by date
    const schedulesByDate = teamMemberSchedules.reduce((acc, schedule) => {
      const dateKey = format(schedule.date, 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(schedule);
      return acc;
    }, {} as Record<string, TeamMemberSchedule[]>);

    // Generate slots for each date
    Object.entries(schedulesByDate).forEach(([dateKey, daySchedules]) => {
      if (slots.length >= maxResults) return;

      const date = parseISO(dateKey);
      
      daySchedules.forEach(schedule => {
        if (slots.length >= maxResults) return;

        const dayStart = new Date(date);
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
        dayStart.setHours(startHour, startMinute, 0, 0);

        const dayEnd = new Date(date);
        const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
        dayEnd.setHours(endHour, endMinute, 0, 0);

        // Generate slots in intervals
        let currentSlotStart = new Date(Math.max(dayStart.getTime(), startAtMin.getTime()));
        const maxSlotStart = new Date(Math.min(dayEnd.getTime() - (duration * 60 * 1000), startAtMax.getTime()));

        while (currentSlotStart <= maxSlotStart && slots.length < maxResults) {
          const slotEnd = addMinutes(currentSlotStart, duration);

          // Check if this slot conflicts with existing appointments
          const hasConflict = existingAppointments.some(appointment => {
            if (appointment.artistId !== schedule.teamMemberId) return false;
            if (!appointment.startTime) return false;
            
            const appointmentStart = new Date(appointment.startTime);
            const appointmentEnd = new Date(appointment.endTime || addMinutes(appointmentStart, appointment.duration || 60));
            
            return (currentSlotStart < appointmentEnd && slotEnd > appointmentStart);
          });

          // Check if slot is during break time
          const isDuringBreak = schedule.breakTimes?.some(breakTime => {
            const breakStart = new Date(date);
            const [breakStartHour, breakStartMinute] = breakTime.startTime.split(':').map(Number);
            breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);
            
            const breakEnd = new Date(date);
            const [breakEndHour, breakEndMinute] = breakTime.endTime.split(':').map(Number);
            breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);
            
            return (currentSlotStart < breakEnd && slotEnd > breakStart);
          });

          if (!hasConflict && !isDuringBreak && schedule.isAvailable) {
            slots.push({
              startAt: new Date(currentSlotStart),
              endAt: slotEnd,
              durationMinutes: duration,
              availableTeamMembers: [schedule.teamMemberId],
              locationId
            });
          }

          currentSlotStart = addMinutes(currentSlotStart, slotInterval);
        }
      });
    });

    return slots.slice(0, maxResults);
  }

  /**
   * Check if a specific time slot is available
   */
  async isTimeSlotAvailable(
    startAt: Date,
    duration: number,
    teamMemberId?: string,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const endAt = addMinutes(startAt, duration);
    
    const whereClause: Prisma.AppointmentWhereInput = {
      startTime: { lt: endAt },
      endTime: { gt: startAt },
      status: { in: [BookingStatus.SCHEDULED, BookingStatus.CONFIRMED] }
    };

    if (teamMemberId) {
      whereClause.artistId = teamMemberId;
    }

    if (excludeAppointmentId) {
      whereClause.id = { not: excludeAppointmentId };
    }

    const conflictingAppointments = await prisma.appointment.count({
      where: whereClause
    });

    return conflictingAppointments === 0;
  }

  /**
   * Get business hours for a specific day
   */
  getBusinessHoursForDay(dayOfWeek: number): BusinessHours | null {
    return this.defaultBusinessHours.find(bh => bh.dayOfWeek === dayOfWeek) || null;
  }

  /**
   * Update business hours
   */
  async updateBusinessHours(businessHours: BusinessHours[]): Promise<void> {
    // In a real implementation, this would save to database
    // For now, just update the in-memory default
    this.defaultBusinessHours = businessHours;
  }

  /**
   * Check for detailed appointment conflicts with customer information
   */
  async checkDetailedConflicts(
    startTime: Date, 
    endTime: Date, 
    artistId?: string, 
    excludeAppointmentId?: string
  ): Promise<Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    type: string;
    artistId?: string;
    customerName?: string;
  }>> {
    const whereClause: Prisma.AppointmentWhereInput = {
      AND: [
        {
          OR: [
            // New appointment starts during existing appointment
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            // New appointment ends during existing appointment
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            },
            // New appointment completely encompasses existing appointment
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } }
              ]
            }
          ]
        },
        { status: { not: BookingStatus.CANCELLED } }
      ]
    };

    // If artistId is provided, check conflicts for that artist
    if (artistId) {
      whereClause.artistId = artistId;
    }

    // Exclude current appointment if updating
    if (excludeAppointmentId) {
      whereClause.id = { not: excludeAppointmentId };
    }

    const conflicts = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        customer: {
          select: { name: true }
        }
      }
    });

    return conflicts.map(conflict => ({
      id: conflict.id,
      startTime: conflict.startTime!,
      endTime: conflict.endTime!,
      type: conflict.type || 'Unknown',
      artistId: conflict.artistId || undefined,
      customerName: conflict.customer?.name || 'Anonymous'
    }));
  }

  /**
   * Suggest alternative appointment times with advanced options
   */
  async suggestAlternativeTimes(
    preferredDate: Date,
    duration: number,
    artistId?: string,
    options: {
      includeBuffer?: boolean;
      bufferMinutes?: number;
      respectBusinessHours?: boolean;
      maxSuggestions?: number;
    } = {}
  ): Promise<Array<{
    startTime: Date;
    endTime: Date;
    duration: number;
    isAvailable: boolean;
    artistId?: string;
  }>> {
    const {
      includeBuffer = true,
      bufferMinutes = 15,
      respectBusinessHours = true,
      maxSuggestions = 5
    } = options;

    const suggestions: Array<{
      startTime: Date;
      endTime: Date;
      duration: number;
      isAvailable: boolean;
      artistId?: string;
    }> = [];

    const businessHours = this.getBusinessHoursForDay(preferredDate.getDay());
    
    // If business is closed, return empty array
    if (respectBusinessHours && (!businessHours || !businessHours.isOpen)) {
      return suggestions;
    }

    // Set up day boundaries
    const startOfDay = new Date(preferredDate);
    const endOfDay = new Date(preferredDate);

    if (respectBusinessHours && businessHours && businessHours.isOpen) {
      const [startHour, startMin] = businessHours.openTime.split(':').map(Number);
      const [endHour, endMin] = businessHours.closeTime.split(':').map(Number);
      
      startOfDay.setHours(startHour, startMin, 0, 0);
      endOfDay.setHours(endHour, endMin, 0, 0);
    } else {
      startOfDay.setHours(0, 0, 0, 0);
      endOfDay.setHours(23, 59, 59, 999);
    }

    // Check availability every 30 minutes
    const slotInterval = 30;
    const effectiveDuration = includeBuffer ? duration + bufferMinutes : duration;

    for (let current = new Date(startOfDay); current < endOfDay; current.setMinutes(current.getMinutes() + slotInterval)) {
      const slotEnd = new Date(current.getTime() + effectiveDuration * 60000);
      
      // Don't suggest slots that extend beyond business hours
      if (slotEnd > endOfDay) break;

      const conflicts = await this.checkDetailedConflicts(current, slotEnd, artistId);
      
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
   * Get availability for multiple artists for a given day
   */
  async getArtistAvailability(
    date: Date,
    artistIds: string[],
    duration: number = 60
  ): Promise<Record<string, Array<{
    startTime: Date;
    endTime: Date;
    duration: number;
    isAvailable: boolean;
    artistId?: string;
  }>>> {
    const availability: Record<string, Array<{
      startTime: Date;
      endTime: Date;
      duration: number;
      isAvailable: boolean;
      artistId?: string;
    }>> = {};

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
   * Find next available slot for any artist
   */
  async findNextAvailableSlot(
    startDate: Date,
    duration: number,
    artistIds?: string[],
    maxDaysToCheck: number = 30
  ): Promise<{
    startTime: Date;
    endTime: Date;
    duration: number;
    isAvailable: boolean;
    artistId?: string;
  } | null> {
    const currentDate = new Date(startDate);
    const endDate = new Date(startDate.getTime() + maxDaysToCheck * 24 * 60 * 60 * 1000);

    while (currentDate <= endDate) {
      const businessHours = this.getBusinessHoursForDay(currentDate.getDay());
      
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
   * Validate appointment scheduling rules
   */
  async validateSchedulingRules(
    startTime: Date,
    duration: number,
    artistId?: string
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check business hours
    const dayOfWeek = startTime.getDay();
    const businessHours = this.getBusinessHoursForDay(dayOfWeek);

    if (!businessHours || !businessHours.isOpen) {
      errors.push('Appointments cannot be scheduled on closed days');
    } else {
      const appointmentTime = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
      const endTime = new Date(startTime.getTime() + duration * 60000);
      const appointmentEndTime = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

      if (this.timeToMinutes(appointmentTime) < this.timeToMinutes(businessHours.openTime)) {
        errors.push('Appointment starts before business hours');
      }

      if (this.timeToMinutes(appointmentEndTime) > this.timeToMinutes(businessHours.closeTime)) {
        errors.push('Appointment ends after business hours');
      }
    }

    // Check minimum lead time (1 hour)
    const now = new Date();
    const minimumStartTime = new Date(now.getTime() + 60 * 60 * 1000);

    if (startTime < minimumStartTime) {
      errors.push('Appointments must be scheduled at least 1 hour in advance');
    }

    // Check maximum lead time (90 days)
    const maximumStartTime = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    if (startTime > maximumStartTime) {
      errors.push('Appointments cannot be scheduled more than 90 days in advance');
    }

    // Check for conflicts
    if (artistId) {
      const endTime = new Date(startTime.getTime() + duration * 60000);
      const conflicts = await this.checkDetailedConflicts(startTime, endTime, artistId);

      if (conflicts.length > 0) {
        errors.push('Time slot conflicts with existing appointment');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Private helper methods
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
} 
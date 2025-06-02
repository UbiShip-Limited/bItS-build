import { prisma } from '../prisma/prisma';
import { BookingStatus, BookingType } from '../types/booking';
import { addMinutes, startOfDay, endOfDay, format, parseISO } from 'date-fns';

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
      console.error('Availability search error:', error);
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
    const whereClause: any = {
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
    let currentDate = new Date(startAtMin);
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
    existingAppointments: any[];
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
            
            const appointmentStart = new Date(appointment.startTime);
            const appointmentEnd = new Date(appointment.endTime || addMinutes(appointmentStart, appointment.duration));
            
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
    
    const whereClause: any = {
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
} 
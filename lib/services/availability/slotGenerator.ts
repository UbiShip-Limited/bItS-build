import { addMinutes, format, parseISO } from 'date-fns';
import { AvailabilitySlot, SlotGenerationParams, TeamMemberSchedule, ExistingAppointment } from './types';
import { DEFAULT_SLOT_INTERVAL } from './constants';

export class SlotGenerator {
  /**
   * Generate available slots based on schedules and existing appointments
   */
  async generateAvailableSlots(params: SlotGenerationParams): Promise<AvailabilitySlot[]> {
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
    const slotInterval = DEFAULT_SLOT_INTERVAL;

    // Group schedules by date for efficient processing
    const schedulesByDate = this.groupSchedulesByDate(teamMemberSchedules);

    // Generate slots for each date
    Object.entries(schedulesByDate).forEach(([dateKey, daySchedules]) => {
      if (slots.length >= maxResults) return;

      const date = parseISO(dateKey);
      
      daySchedules.forEach(schedule => {
        if (slots.length >= maxResults) return;

        const generatedSlots = this.generateSlotsForSchedule(
          schedule,
          date,
          duration,
          existingAppointments,
          startAtMin,
          startAtMax,
          slotInterval,
          locationId,
          maxResults - slots.length
        );

        slots.push(...generatedSlots);
      });
    });

    return slots.slice(0, maxResults);
  }

  /**
   * Group schedules by date for efficient processing
   */
  private groupSchedulesByDate(schedules: TeamMemberSchedule[]): Record<string, TeamMemberSchedule[]> {
    return schedules.reduce((acc, schedule) => {
      const dateKey = format(schedule.date, 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(schedule);
      return acc;
    }, {} as Record<string, TeamMemberSchedule[]>);
  }

  /**
   * Generate slots for a specific schedule
   */
  private generateSlotsForSchedule(
    schedule: TeamMemberSchedule,
    date: Date,
    duration: number,
    existingAppointments: ExistingAppointment[],
    startAtMin: Date,
    startAtMax: Date,
    slotInterval: number,
    locationId?: string,
    remainingSlots?: number
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];
    
    // Calculate day boundaries
    const dayStart = this.createDateWithTime(date, schedule.startTime);
    const dayEnd = this.createDateWithTime(date, schedule.endTime);

    // Calculate slot generation boundaries
    let currentSlotStart = new Date(Math.max(dayStart.getTime(), startAtMin.getTime()));
    const maxSlotStart = new Date(Math.min(dayEnd.getTime() - (duration * 60 * 1000), startAtMax.getTime()));

    while (currentSlotStart <= maxSlotStart && (!remainingSlots || slots.length < remainingSlots)) {
      const slotEnd = addMinutes(currentSlotStart, duration);

      // Check if this slot is valid
      if (this.isSlotValid(currentSlotStart, slotEnd, schedule, existingAppointments)) {
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

    return slots;
  }

  /**
   * Check if a slot is valid (no conflicts, not during break time, etc.)
   */
  private isSlotValid(
    slotStart: Date,
    slotEnd: Date,
    schedule: TeamMemberSchedule,
    existingAppointments: ExistingAppointment[]
  ): boolean {
    // Check for appointment conflicts
    const hasConflict = existingAppointments.some(appointment => {
      if (appointment.artistId !== schedule.teamMemberId) return false;
      if (!appointment.startTime) return false;
      
      const appointmentStart = new Date(appointment.startTime);
      const appointmentEnd = new Date(appointment.endTime || addMinutes(appointmentStart, appointment.duration || 60));
      
      return (slotStart < appointmentEnd && slotEnd > appointmentStart);
    });

    if (hasConflict) return false;

    // Check if slot is during break time
    const isDuringBreak = this.isSlotDuringBreak(slotStart, slotEnd, schedule);
    if (isDuringBreak) return false;

    // Check if team member is available
    return schedule.isAvailable;
  }

  /**
   * Check if slot overlaps with break times
   */
  private isSlotDuringBreak(
    slotStart: Date,
    slotEnd: Date,
    schedule: TeamMemberSchedule
  ): boolean {
    if (!schedule.breakTimes) return false;

    const date = new Date(slotStart);

    return schedule.breakTimes.some(breakTime => {
      const breakStart = this.createDateWithTime(date, breakTime.startTime);
      const breakEnd = this.createDateWithTime(date, breakTime.endTime);
      
      return (slotStart < breakEnd && slotEnd > breakStart);
    });
  }

  /**
   * Create a date with specific time
   */
  private createDateWithTime(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  /**
   * Find optimal slots considering multiple team members
   */
  async findOptimalSlots(
    params: SlotGenerationParams,
    preferredTeamMemberIds?: string[]
  ): Promise<AvailabilitySlot[]> {
    const allSlots = await this.generateAvailableSlots(params);

    // If no preferred team members, return all slots
    if (!preferredTeamMemberIds?.length) {
      return allSlots;
    }

    // Prioritize slots with preferred team members
    const prioritizedSlots = allSlots.sort((a, b) => {
      const aHasPreferred = a.availableTeamMembers.some(id => preferredTeamMemberIds.includes(id));
      const bHasPreferred = b.availableTeamMembers.some(id => preferredTeamMemberIds.includes(id));

      if (aHasPreferred && !bHasPreferred) return -1;
      if (!aHasPreferred && bHasPreferred) return 1;
      return 0;
    });

    return prioritizedSlots;
  }

  /**
   * Generate slots with buffer time
   */
  async generateSlotsWithBuffer(
    params: SlotGenerationParams,
    bufferMinutes: number = 15
  ): Promise<AvailabilitySlot[]> {
    const adjustedParams = {
      ...params,
      duration: params.duration + bufferMinutes
    };

    const slotsWithBuffer = await this.generateAvailableSlots(adjustedParams);

    // Adjust the returned slots to show original duration
    return slotsWithBuffer.map(slot => ({
      ...slot,
      endAt: addMinutes(slot.startAt, params.duration),
      durationMinutes: params.duration
    }));
  }
} 
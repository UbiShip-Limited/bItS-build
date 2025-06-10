import { TeamMemberSchedule } from './types';
import { BusinessHoursManager } from './businessHoursManager';
import { AppointmentRepository } from './appointmentRepository';
import { DEFAULT_LUNCH_BREAK } from './constants';

export class ScheduleGenerator {
  constructor(
    private businessHoursManager: BusinessHoursManager,
    private appointmentRepository: AppointmentRepository
  ) {}

  /**
   * Generate team member schedules for a date range
   */
  async generateTeamMemberSchedules(
    startAtMin: Date,
    startAtMax: Date,
    teamMemberIds?: string[]
  ): Promise<TeamMemberSchedule[]> {
    // Get team members from database
    const teamMembers = await this.appointmentRepository.getTeamMembers(teamMemberIds);
    const schedules: TeamMemberSchedule[] = [];
    
    // Generate schedules for each day in the range
    const currentDate = new Date(startAtMin);
    while (currentDate <= startAtMax) {
      const dayOfWeek = currentDate.getDay();
      const businessHour = this.businessHoursManager.getBusinessHoursForDay(dayOfWeek);
      
      if (businessHour?.isOpen) {
        teamMembers.forEach(member => {
          schedules.push({
            teamMemberId: member.id,
            date: new Date(currentDate),
            startTime: businessHour.openTime,
            endTime: businessHour.closeTime,
            isAvailable: true,
            breakTimes: [DEFAULT_LUNCH_BREAK]
          });
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return schedules;
  }

  /**
   * Generate schedule for a specific team member on a specific date
   */
  async generateMemberScheduleForDate(
    memberId: string,
    date: Date
  ): Promise<TeamMemberSchedule | null> {
    const dayOfWeek = date.getDay();
    const businessHour = this.businessHoursManager.getBusinessHoursForDay(dayOfWeek);
    
    if (!businessHour?.isOpen) {
      return null;
    }

    return {
      teamMemberId: memberId,
      date: new Date(date),
      startTime: businessHour.openTime,
      endTime: businessHour.closeTime,
      isAvailable: true,
      breakTimes: [DEFAULT_LUNCH_BREAK]
    };
  }

  /**
   * Check if a team member is available at a specific time
   */
  async isTeamMemberAvailable(
    memberId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    // Check business hours
    const dayOfWeek = startTime.getDay();
    const businessHour = this.businessHoursManager.getBusinessHoursForDay(dayOfWeek);
    
    if (!businessHour?.isOpen) {
      return false;
    }

    // Check if within business hours
    const startTimeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
    const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
    
    if (startTimeStr < businessHour.openTime || endTimeStr > businessHour.closeTime) {
      return false;
    }

    // Check for appointment conflicts
    return this.appointmentRepository.isTimeSlotAvailable(startTime, endTime, memberId);
  }

  /**
   * Get available team members for a time slot
   */
  async getAvailableTeamMembers(
    startTime: Date,
    endTime: Date,
    teamMemberIds?: string[]
  ): Promise<string[]> {
    const teamMembers = await this.appointmentRepository.getTeamMembers(teamMemberIds);
    const availableMembers: string[] = [];

    for (const member of teamMembers) {
      const isAvailable = await this.isTeamMemberAvailable(member.id, startTime, endTime);
      if (isAvailable) {
        availableMembers.push(member.id);
      }
    }

    return availableMembers;
  }

  /**
   * Check if time slot conflicts with break times
   */
  isWithinBreakTime(
    startTime: Date,
    endTime: Date,
    breakTimes: Array<{ startTime: string; endTime: string }>
  ): boolean {
    const date = new Date(startTime);
    
    return breakTimes.some(breakTime => {
      const breakStart = new Date(date);
      const [breakStartHour, breakStartMinute] = breakTime.startTime.split(':').map(Number);
      breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);
      
      const breakEnd = new Date(date);
      const [breakEndHour, breakEndMinute] = breakTime.endTime.split(':').map(Number);
      breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);
      
      return (startTime < breakEnd && endTime > breakStart);
    });
  }
} 
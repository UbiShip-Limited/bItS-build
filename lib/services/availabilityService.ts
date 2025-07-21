import { addMinutes } from 'date-fns';
import {
  AppointmentRepository,
  BusinessHoursManager,
  ScheduleGenerator,
  SlotGenerator,
  TimeValidator,
  SquareProfilesManager,
  AvailabilitySearchParams,
  AvailabilitySlot,
  AvailabilitySearchResult,
  BusinessHours,
  ValidationResult,
  AlternativeTimeOptions,
  SuggestedSlot
} from './availability';

export type {
  AvailabilitySearchParams,
  AvailabilitySlot,
  AvailabilitySearchResult,
  BusinessHours,
  TeamMemberSchedule,
  ValidationResult,
  AlternativeTimeOptions,
  SuggestedSlot
} from './availability';

export class AvailabilityService {
  private appointmentRepository: AppointmentRepository;
  private businessHoursManager: BusinessHoursManager;
  private scheduleGenerator: ScheduleGenerator;
  private slotGenerator: SlotGenerator;
  private timeValidator: TimeValidator;
  private squareProfilesManager: SquareProfilesManager;

  constructor(customBusinessHours?: BusinessHours[]) {
    // Initialize all modules
    this.appointmentRepository = new AppointmentRepository();
    this.businessHoursManager = new BusinessHoursManager(customBusinessHours);
    this.scheduleGenerator = new ScheduleGenerator(this.businessHoursManager, this.appointmentRepository);
    this.slotGenerator = new SlotGenerator();
    this.timeValidator = new TimeValidator(this.businessHoursManager, this.appointmentRepository);
    this.squareProfilesManager = new SquareProfilesManager(
      this.businessHoursManager.getAllBusinessHours(),
      this.appointmentRepository
    );
  }

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
      const existingAppointments = await this.appointmentRepository.getExistingAppointments(
        startAtMin,
        startAtMax,
        teamMemberIds
      );

      // Get team member schedules
      const teamMemberSchedules = await this.scheduleGenerator.generateTeamMemberSchedules(
        startAtMin,
        startAtMax,
        teamMemberIds
      );

      // Generate available slots
      const availableSlots = await this.slotGenerator.generateAvailableSlots({
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
    return this.squareProfilesManager.getBusinessBookingProfile();
  }

  /**
   * Get location booking profiles
   * Aligns with Square's GET /v2/bookings/location-booking-profiles
   */
  async getLocationBookingProfiles() {
    return this.squareProfilesManager.getLocationBookingProfiles();
  }

  /**
   * Get team member booking profiles
   * Aligns with Square's GET /v2/bookings/team-member-booking-profiles
   */
  async getTeamMemberBookingProfiles(teamMemberIds?: string[]) {
    return this.squareProfilesManager.getTeamMemberBookingProfiles(teamMemberIds);
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
    return this.appointmentRepository.isTimeSlotAvailable(startAt, endAt, teamMemberId, excludeAppointmentId);
  }

  /**
   * Get business hours for a specific day
   */
  getBusinessHoursForDay(dayOfWeek: number): BusinessHours | null {
    return this.businessHoursManager.getBusinessHoursForDay(dayOfWeek);
  }

  /**
   * Update business hours
   */
  async updateBusinessHours(businessHours: BusinessHours[]): Promise<void> {
    await this.businessHoursManager.updateBusinessHours(businessHours);
  }

  /**
   * Check for detailed appointment conflicts with customer information
   */
  async checkDetailedConflicts(
    startTime: Date, 
    endTime: Date, 
    artistId?: string, 
    excludeAppointmentId?: string
  ) {
    return this.appointmentRepository.getDetailedConflicts(startTime, endTime, artistId, excludeAppointmentId);
  }

  /**
   * Suggest alternative appointment times with advanced options
   */
  async suggestAlternativeTimes(
    preferredDate: Date,
    duration: number,
    artistId?: string,
    options: AlternativeTimeOptions = {}
  ): Promise<SuggestedSlot[]> {
    return this.timeValidator.suggestAlternativeTimes(preferredDate, duration, artistId, options);
  }

  /**
   * Get availability for multiple artists for a given day
   */
  async getArtistAvailability(
    date: Date,
    artistIds: string[],
    duration: number = 60
  ): Promise<Record<string, SuggestedSlot[]>> {
    return this.timeValidator.getArtistAvailability(date, artistIds, duration);
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
    return this.timeValidator.findNextAvailableSlot(startDate, duration, artistIds, maxDaysToCheck);
  }

  /**
   * Validate appointment scheduling rules
   */
  async validateSchedulingRules(
    startTime: Date,
    duration: number,
    artistId?: string
  ): Promise<ValidationResult> {
    return this.timeValidator.validateSchedulingRules(startTime, duration, artistId);
  }

  // Backward compatibility methods - delegating to appropriate modules
  
  /**
   * @deprecated Use timeValidator.validateDuration instead
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get all business hours
   */
  getAllBusinessHours(): BusinessHours[] {
    return this.businessHoursManager.getAllBusinessHours();
  }

  /**
   * Update business hours from database
   * This method should be called when business hours are updated via API
   */
  async updateBusinessHours(businessHours?: BusinessHours[]): Promise<void> {
    if (businessHours) {
      await this.businessHoursManager.updateBusinessHours(businessHours);
      // Re-initialize dependent services with new business hours
      this.squareProfilesManager = new SquareProfilesManager(
        this.businessHoursManager.getAllBusinessHours(),
        this.appointmentRepository
      );
    }
  }

  /**
   * Check if business is open on a specific day
   */
  isOpenOnDay(dayOfWeek: number): boolean {
    return this.businessHoursManager.isOpenOnDay(dayOfWeek);
  }

  /**
   * Generate slots with buffer time
   */
  async generateSlotsWithBuffer(
    params: AvailabilitySearchParams,
    bufferMinutes: number = 15
  ): Promise<AvailabilitySlot[]> {
    const existingAppointments = await this.appointmentRepository.getExistingAppointments(
      params.startAtMin,
      params.startAtMax,
      params.teamMemberIds
    );

    const teamMemberSchedules = await this.scheduleGenerator.generateTeamMemberSchedules(
      params.startAtMin,
      params.startAtMax,
      params.teamMemberIds
    );

    return this.slotGenerator.generateSlotsWithBuffer({
      startAtMin: params.startAtMin,
      startAtMax: params.startAtMax,
      duration: params.duration || 60,
      existingAppointments,
      teamMemberSchedules,
      locationId: params.locationId,
      teamMemberIds: params.teamMemberIds,
      maxResults: params.maxResults || 50
    }, bufferMinutes);
  }
} 
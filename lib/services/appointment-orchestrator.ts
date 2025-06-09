import { AppointmentService, CreateAppointmentData, UpdateAppointmentData } from './appointmentService';
import { AppointmentAutomationService } from './appointment-automation';
import { AvailabilityService } from './availabilityService';
import { BookingStatus } from '../types/booking';
import type { Appointment } from '@prisma/client';

export interface EnhancedCreateAppointmentData extends CreateAppointmentData {
  enableAutomation?: boolean;
  skipConflictCheck?: boolean;
  suggestAlternatives?: boolean;
}

export interface EnhancedUpdateAppointmentData extends UpdateAppointmentData {
  enableAutomation?: boolean;
  skipConflictCheck?: boolean;
}

export interface AppointmentWithSuggestions {
  appointment?: Appointment;
  conflicts?: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    type: string;
    customerName?: string;
  }>;
  suggestions?: Array<{
    startTime: Date;
    endTime: Date;
    duration: number;
  }>;
}

/**
 * Orchestrator service that coordinates between focused appointment services
 * Handles complex operations requiring multiple services
 * Replaces the monolithic EnhancedAppointmentService
 */
export class AppointmentOrchestrator {
  private appointmentService: AppointmentService;
  private automationService: AppointmentAutomationService;
  private availabilityService: AvailabilityService;

  constructor() {
    this.appointmentService = new AppointmentService();
    this.automationService = new AppointmentAutomationService();
    this.availabilityService = new AvailabilityService();
  }

  /**
   * Enhanced appointment creation with full automation and conflict checking
   */
  async createAppointmentWithEnhancements(
    data: EnhancedCreateAppointmentData
  ): Promise<AppointmentWithSuggestions> {
    const {
      enableAutomation = true,
      skipConflictCheck = false,
      suggestAlternatives = true,
      ...appointmentData
    } = data;

    // Step 1: Check for conflicts if not skipped
    if (!skipConflictCheck && appointmentData.artistId) {
      const endTime = new Date(appointmentData.startAt.getTime() + appointmentData.duration * 60000);
      const conflicts = await this.availabilityService.checkDetailedConflicts(
        appointmentData.startAt,
        endTime,
        appointmentData.artistId
      );

      if (conflicts.length > 0) {
        const result: AppointmentWithSuggestions = { conflicts };

        // Suggest alternatives if requested
        if (suggestAlternatives) {
          const suggestions = await this.availabilityService.suggestAlternativeTimes(
            appointmentData.startAt,
            appointmentData.duration,
            appointmentData.artistId
          );
          result.suggestions = suggestions;
        }

        return result;
      }
    }

    // Step 2: Create the appointment
    const appointment = await this.appointmentService.create(appointmentData);

    // Step 3: Trigger automation if enabled
    if (enableAutomation) {
      // Fire and forget - don't wait for automation to complete
      this.automationService.onAppointmentCreated(appointment, appointmentData)
        .catch(error => {
          console.error('Automation failed for appointment creation:', error);
        });
    }

    return { appointment };
  }

  /**
   * Enhanced appointment update with automation and conflict checking
   */
  async updateAppointmentWithEnhancements(
    id: string,
    data: EnhancedUpdateAppointmentData
  ): Promise<AppointmentWithSuggestions> {
    const {
      enableAutomation = true,
      skipConflictCheck = false,
      ...updateData
    } = data;

    // Get current appointment for comparison
    const oldAppointment = await this.appointmentService.findById(id);

    // Step 1: Check for conflicts if time/artist is being updated
    if (!skipConflictCheck && (data.startAt || data.artistId)) {
      const checkStartAt = data.startAt || oldAppointment.startTime;
      const checkDuration = data.duration || oldAppointment.duration || 60;
      const checkArtistId = data.artistId !== undefined ? data.artistId : oldAppointment.artistId;

      if (checkStartAt && checkArtistId) {
        const endTime = new Date(checkStartAt.getTime() + checkDuration * 60000);
        const conflicts = await this.availabilityService.checkDetailedConflicts(
          checkStartAt,
          endTime,
          checkArtistId,
          id // Exclude current appointment
        );

        if (conflicts.length > 0) {
          return { conflicts };
        }
      }
    }

    // Step 2: Update the appointment
    const updatedAppointment = await this.appointmentService.update(id, updateData);

    // Step 3: Trigger automation if enabled
    if (enableAutomation) {
      const changes = Object.keys(updateData);
      this.automationService.onAppointmentUpdated(updatedAppointment, oldAppointment, changes)
        .catch(error => {
          console.error('Automation failed for appointment update:', error);
        });
    }

    return { appointment: updatedAppointment };
  }

  /**
   * Enhanced appointment cancellation with automation
   */
  async cancelAppointmentWithEnhancements(
    id: string,
    reason?: string,
    cancelledBy?: string,
    enableAutomation: boolean = true
  ): Promise<Appointment> {
    // Cancel the appointment
    const cancelledAppointment = await this.appointmentService.cancel(id, reason, cancelledBy);

    // Trigger automation if enabled
    if (enableAutomation) {
      this.automationService.onAppointmentCancelled(cancelledAppointment, reason, cancelledBy)
        .catch(error => {
          console.error('Automation failed for appointment cancellation:', error);
        });
    }

    return cancelledAppointment;
  }

  /**
   * Bulk appointment operations with automation
   */
  async bulkUpdateAppointments(
    appointmentIds: string[],
    updates: Partial<UpdateAppointmentData>
  ) {
    return this.automationService.processBulkOperation(
      appointmentIds,
      (id) => this.appointmentService.update(id, updates),
      'appointment_update'
    );
  }

  /**
   * Get comprehensive appointment dashboard data
   */
  async getDashboardData() {
    const [
      dashboardAnalytics,
      revenueAnalytics,
      artistPerformance,
      upcomingAppointments
    ] = await Promise.all([
      this.analyticsService.getDashboardAnalytics(),
      this.analyticsService.getRevenueAnalytics('month'),
      this.analyticsService.getArtistPerformance('month'),
      this.getUpcomingAppointments(24) // Next 24 hours
    ]);

    return {
      analytics: dashboardAnalytics,
      revenue: revenueAnalytics,
      artistPerformance,
      upcomingAppointments
    };
  }

  /**
   * Get upcoming appointments with automation processing
   */
  async getUpcomingAppointments(hours: number = 24): Promise<Appointment[]> {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const upcomingAppointments = await this.appointmentService.list({
      from: now,
      to: futureTime,
      status: BookingStatus.SCHEDULED
    });

    // Process reminders in background
    this.automationService.processAppointmentReminders(upcomingAppointments.data)
      .catch(error => {
        console.error('Failed to process appointment reminders:', error);
      });

    return upcomingAppointments.data;
  }

  /**
   * Smart appointment scheduling with AI-like suggestions
   */
  async smartScheduleAppointment(params: {
    duration: number;
    preferredDate?: Date;
    artistId?: string;
    customerId?: string;
    contactEmail?: string;
    bookingType: string;
    note?: string;
  }) {
    const { duration, preferredDate, artistId, ...appointmentData } = params;
    const targetDate = preferredDate || new Date();

    // Find best available slot
    const availableSlot = await this.availabilityService.findNextAvailableSlot(
      targetDate,
      duration,
      artistId ? [artistId] : undefined
    );

    if (!availableSlot) {
      throw new Error('No available slots found in the next 30 days');
    }

    // Create appointment with the found slot
    return this.createAppointmentWithEnhancements({
      ...appointmentData,
      startAt: availableSlot.startTime,
      duration,
      artistId: availableSlot.artistId || artistId,
      enableAutomation: true
    });
  }

  /**
   * Get availability overview for scheduling interface
   */
  async getAvailabilityOverview(
    startDate: Date,
    endDate: Date,
    artistIds?: string[]
  ) {
    const overview = {
      dailyAvailability: [] as Array<{
        date: string;
        totalSlots: number;
        availableSlots: number;
        bookedSlots: number;
      }>,
      artistAvailability: {} as Record<string, any>
    };

    // Calculate daily overview
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const daySlots = await this.availabilityService.suggestAlternativeTimes(
        currentDate,
        60, // 1-hour slots
        undefined,
        { maxSuggestions: 20 }
      );

      const totalSlots = 8; // Assuming 8-hour working days
      const availableSlots = daySlots.length;
      const bookedSlots = totalSlots - availableSlots;

      overview.dailyAvailability.push({
        date: currentDate.toISOString().split('T')[0],
        totalSlots,
        availableSlots,
        bookedSlots
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate artist-specific availability if requested
    if (artistIds && artistIds.length > 0) {
      for (const artistId of artistIds) {
        overview.artistAvailability[artistId] = await this.availabilityService.getArtistAvailability(
          startDate,
          [artistId],
          60
        );
      }
    }

    return overview;
  }

  /**
   * Process appointment conflicts resolution
   */
  async resolveAppointmentConflicts(conflictingAppointments: string[]) {
    const conflicts = await Promise.all(
      conflictingAppointments.map(id => this.appointmentService.findById(id))
    );

    // Trigger automation for conflict resolution
    await this.automationService.onConflictDetected(
      conflicts.map(c => ({
        id: c.id,
        startTime: c.startTime!,
        endTime: c.endTime!
      })),
      { startTime: new Date(), endTime: new Date() } // Placeholder
    );

    return {
      conflictsFound: conflicts.length,
      conflictIds: conflictingAppointments,
      resolutionTriggered: true
    };
  }

  /**
   * Get service health status
   */
  async getServiceHealth() {
    return {
      appointmentService: 'healthy',
      analyticsService: 'healthy',
      automationService: 'healthy',
      availabilityService: 'healthy',
      timestamp: new Date()
    };
  }
} 
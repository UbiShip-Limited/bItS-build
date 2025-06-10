import { BusinessHours } from './types';
import { AppointmentRepository } from './appointmentRepository';
import { MIN_BOOKING_LEAD_TIME_SECONDS, MAX_BOOKING_LEAD_TIME_SECONDS } from './constants';

export class SquareProfilesManager {
  constructor(
    private businessHours: BusinessHours[],
    private appointmentRepository: AppointmentRepository
  ) {}

  /**
   * Get business booking profile
   * Aligns with Square's GET /v2/bookings/business-booking-profile
   */
  async getBusinessBookingProfile() {
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
        minBookingLeadTimeSeconds: MIN_BOOKING_LEAD_TIME_SECONDS,
        maxBookingLeadTimeSeconds: MAX_BOOKING_LEAD_TIME_SECONDS,
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
        businessHours: this.businessHours,
        businessAppointmentSettings: {
          locationTypes: ['PHYSICAL'],
          alignmentTime: 'SERVICE_DURATION',
          minBookingLeadTimeSeconds: MIN_BOOKING_LEAD_TIME_SECONDS,
          maxBookingLeadTimeSeconds: MAX_BOOKING_LEAD_TIME_SECONDS,
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
    const teamMembers = await this.appointmentRepository.getTeamMembers(teamMemberIds);

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

  /**
   * Update business appointment settings
   */
  updateBusinessSettings(settings: {
    maxAppointmentsPerDayLimit?: number;
    cancellationWindowSeconds?: number;
    minBookingLeadTimeSeconds?: number;
    maxBookingLeadTimeSeconds?: number;
  }) {
    // In a production environment, this would update the database
    // For now, we'll just return the updated configuration
    return {
      ...this.getBusinessBookingProfile(),
      businessAppointmentSettings: {
        locationTypes: ['PHYSICAL'],
        alignmentTime: 'SERVICE_DURATION',
        minBookingLeadTimeSeconds: settings.minBookingLeadTimeSeconds || MIN_BOOKING_LEAD_TIME_SECONDS,
        maxBookingLeadTimeSeconds: settings.maxBookingLeadTimeSeconds || MAX_BOOKING_LEAD_TIME_SECONDS,
        anyTeamMemberBookingEnabled: true,
        multipleServiceBookingEnabled: false,
        maxAppointmentsPerDayLimitType: 'PER_TEAM_MEMBER',
        maxAppointmentsPerDayLimit: settings.maxAppointmentsPerDayLimit || 8,
        cancellationWindowSeconds: settings.cancellationWindowSeconds || 86400,
        cancellationFeeMoney: null,
        cancellationPolicy: 'CANCELLATION_TREATED_AS_NO_SHOW',
        cancellationPolicyText: 'Cancellations must be made at least 24 hours in advance.',
        skipBookingFlowStaffSelection: false
      }
    };
  }
} 
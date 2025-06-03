import { AppointmentService } from './appointmentService';
import { SquareIntegrationService } from './squareIntegrationService';
import { AvailabilityService, AvailabilitySearchParams } from './availabilityService';

export enum BookingType {
  CONSULTATION = 'consultation',
  DRAWING_CONSULTATION = 'drawing_consultation',
  TATTOO_SESSION = 'tattoo_session'
}

export enum BookingStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

interface CreateBookingParams {
  startAt: Date;
  duration: number; // minutes
  customerId?: string;
  bookingType: BookingType;
  artistId?: string;
  customerEmail?: string;
  customerPhone?: string;
  note?: string;
  priceQuote?: number;
  status?: BookingStatus;
  tattooRequestId?: string;
  // New params for anonymous requests
  contactEmail?: string;
  contactPhone?: string;
  isAnonymous?: boolean;
}

interface UpdateBookingParams {
  bookingId: string;
  startAt?: Date;
  duration?: number;
  status?: BookingStatus;
  artistId?: string;
  note?: string;
  priceQuote?: number;
}

interface CancelBookingParams {
  bookingId: string;
  reason?: string;
  cancelledBy?: string;
}

interface SquareBookingUpdateResult {
  success: boolean;
  squareId?: string;
  error?: string;
}

/**
 * @deprecated This service is deprecated. Use AppointmentService and SquareIntegrationService directly.
 * This is maintained only for backward compatibility.
 */
export default class BookingService {
  private appointmentService: AppointmentService;
  private squareService: SquareIntegrationService;
  private availabilityService: AvailabilityService;
  
  constructor() {
    this.appointmentService = new AppointmentService();
    this.squareService = new SquareIntegrationService();
    this.availabilityService = new AvailabilityService();
  }
  
  async createBooking(params: CreateBookingParams) {
    const { 
      startAt, 
      duration, 
      customerId, 
      bookingType,
      artistId,
      customerEmail,
      customerPhone,
      note,
      priceQuote,
      status = BookingStatus.SCHEDULED,
      tattooRequestId,
      contactEmail,
      contactPhone,
    } = params;
    
    try {
      // Check availability before creating booking
      if (artistId) {
        const isAvailable = await this.availabilityService.isTimeSlotAvailable(
          startAt,
          duration,
          artistId
        );
        
        if (!isAvailable) {
          throw new Error('Selected time slot is not available');
        }
      }
      
      // Use the new AppointmentService
      const appointment = await this.appointmentService.create({
        startAt,
        duration,
        customerId,
        // Use contactEmail/contactPhone if provided, otherwise fall back to customerEmail/customerPhone
        contactEmail: contactEmail || customerEmail,
        contactPhone: contactPhone || customerPhone,
        bookingType,
        artistId,
        note,
        priceQuote,
        status,
        tattooRequestId
      });
      
      // Try to sync with Square if we have a customer
      const squareBooking = null;
      if (appointment.customerId) {
        const squareResult = await this.squareService.syncAppointmentToSquare(appointment);
        if (squareResult.squareId) {
          // Refetch appointment to get updated squareId
          const updatedAppointment = await this.appointmentService.findById(appointment.id);
          appointment.squareId = updatedAppointment.squareId;
        }
      }
      
      return {
        success: true,
        booking: appointment,
        squareBooking: squareBooking
      };
    } catch (error) {
      console.error('Booking creation error:', error);
      throw error;
    }
  }
  
  async updateBooking(params: UpdateBookingParams) {
    const { 
      bookingId, 
      startAt, 
      duration, 
      status, 
      artistId, 
      note, 
      priceQuote 
    } = params;
    
    try {
      // Check availability for the new time slot if being updated
      if ((startAt || duration || artistId) && artistId) {
        const appointment = await this.appointmentService.findById(bookingId);
        const checkStartAt = startAt || appointment.startTime;
        const checkDuration = duration || appointment.duration;
        const checkArtistId = artistId || appointment.artistId;
        
        if (checkArtistId) {
          const isAvailable = await this.availabilityService.isTimeSlotAvailable(
            new Date(checkStartAt),
            checkDuration,
            checkArtistId,
            bookingId // Exclude current appointment from conflict check
          );
          
          if (!isAvailable) {
            throw new Error('Updated time slot is not available');
          }
        }
      }
      
      const appointment = await this.appointmentService.update(bookingId, {
        startAt,
        duration,
        status,
        artistId,
        note,
        priceQuote
      });
      
      // Try to update in Square
      let squareBookingUpdated: SquareBookingUpdateResult | null = null;
      if (appointment.customerId) {
        const squareResult = await this.squareService.updateSquareBooking(appointment);
        squareBookingUpdated = squareResult.success ? squareResult : null;
      }
      
      return {
        success: true,
        booking: appointment,
        squareBookingUpdated
      };
    } catch (error) {
      console.error('Booking update error:', error);
      throw error;
    }
  }
  
  /**
   * Search for available booking slots
   * Aligns with Square's POST /v2/bookings/availability/search
   */
  async searchBookingAvailability(params: AvailabilitySearchParams) {
    try {
      return await this.availabilityService.searchAvailability(params);
    } catch (error) {
      console.error('Availability search error:', error);
      throw error;
    }
  }
  
  /**
   * @deprecated Use searchBookingAvailability instead
   */
  async getBookingAvailability(date: Date, artistId?: string) {
    // Enhanced implementation using the new availability service
    try {
      const startAtMin = new Date(date);
      startAtMin.setHours(0, 0, 0, 0);
      
      const startAtMax = new Date(date);
      startAtMax.setHours(23, 59, 59, 999);
      
      const result = await this.availabilityService.searchAvailability({
        startAtMin,
        startAtMax,
        teamMemberIds: artistId ? [artistId] : undefined,
        duration: 60, // Default 1 hour slots
        maxResults: 20
      });
      
      return {
        success: true,
        date: date.toISOString().split('T')[0],
        availableSlots: result.availabilities.map(slot => ({
          startAt: slot.startAt.toISOString(),
          endAt: slot.endAt.toISOString(),
          duration: slot.durationMinutes,
          availableTeamMembers: slot.availableTeamMembers
        }))
      };
    } catch (error) {
      console.error('Get booking availability error:', error);
      return {
        success: false,
        date: date.toISOString().split('T')[0],
        availableSlots: [],
        error: error.message
      };
    }
  }
  
  /**
   * Get business booking profile
   * Aligns with Square's GET /v2/bookings/business-booking-profile
   */
  async getBusinessBookingProfile() {
    try {
      return await this.availabilityService.getBusinessBookingProfile();
    } catch (error) {
      console.error('Get business booking profile error:', error);
      throw error;
    }
  }
  
  /**
   * Get location booking profiles
   * Aligns with Square's GET /v2/bookings/location-booking-profiles
   */
  async getLocationBookingProfiles() {
    try {
      return await this.availabilityService.getLocationBookingProfiles();
    } catch (error) {
      console.error('Get location booking profiles error:', error);
      throw error;
    }
  }
  
  /**
   * Get team member booking profiles
   * Aligns with Square's GET /v2/bookings/team-member-booking-profiles
   */
  async getTeamMemberBookingProfiles(teamMemberIds?: string[]) {
    try {
      return await this.availabilityService.getTeamMemberBookingProfiles(teamMemberIds);
    } catch (error) {
      console.error('Get team member booking profiles error:', error);
      throw error;
    }
  }
  
  /**
   * Bulk retrieve bookings
   * Aligns with Square's POST /v2/bookings/bulk-retrieve
   */
  async bulkRetrieveBookings(bookingIds: string[]) {
    try {
      const bookings = await Promise.all(
        bookingIds.map(id => this.appointmentService.findById(id).catch(() => null))
      );
      
      return {
        success: true,
        bookings: bookings.filter(Boolean),
        errors: bookingIds.filter((id, index) => !bookings[index]).map(id => ({
          bookingId: id,
          error: 'Booking not found'
        }))
      };
    } catch (error) {
      console.error('Bulk retrieve bookings error:', error);
      throw error;
    }
  }
  
  async cancelBooking(params: CancelBookingParams) {
    const { bookingId, reason, cancelledBy } = params;
    
    try {
      const appointment = await this.appointmentService.cancel(bookingId, reason, cancelledBy);
      
      // Try to cancel in Square
      let squareCancelled = false;
      if (appointment.squareId) {
        const squareResult = await this.squareService.cancelSquareBooking(appointment.squareId);
        squareCancelled = squareResult.success;
      }
      
      return {
        success: true,
        booking: appointment,
        squareCancelled
      };
    } catch (error) {
      console.error('Booking cancellation error:', error);
      throw error;
    }
  }
  
  /**
   * Check if booking conflicts with business rules
   */
  async validateBookingRules(params: {
    startAt: Date;
    duration: number;
    customerId?: string;
    artistId?: string;
  }): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const { startAt, duration, customerId, artistId } = params;
    
    try {
      // Check business hours
      const dayOfWeek = startAt.getDay();
      const businessHours = this.availabilityService.getBusinessHoursForDay(dayOfWeek);
      
      if (!businessHours?.isOpen) {
        errors.push('Booking is outside business hours');
      }
      
      // Check minimum lead time (1 hour)
      const now = new Date();
      const minimumStartTime = new Date(now.getTime() + (60 * 60 * 1000)); // 1 hour from now
      
      if (startAt < minimumStartTime) {
        errors.push('Booking must be scheduled at least 1 hour in advance');
      }
      
      // Check maximum lead time (30 days)
      const maximumStartTime = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from now
      
      if (startAt > maximumStartTime) {
        errors.push('Booking cannot be scheduled more than 30 days in advance');
      }
      
      // Check availability if artist is specified
      if (artistId) {
        const isAvailable = await this.availabilityService.isTimeSlotAvailable(
          startAt,
          duration,
          artistId
        );
        
        if (!isAvailable) {
          errors.push('Selected time slot is not available for the specified artist');
        }
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      console.error('Booking rule validation error:', error);
      return {
        valid: false,
        errors: ['Failed to validate booking rules']
      };
    }
  }
} 
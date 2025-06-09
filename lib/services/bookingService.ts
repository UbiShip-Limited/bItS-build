import { AppointmentService } from './appointmentService';
import { AvailabilityService } from './availabilityService';
import { BookingType, BookingStatus } from '../types/booking';

interface CreateBookingParams {
  startAt: Date;
  duration: number;
  customerId?: string;
  bookingType: BookingType;
  artistId?: string;
  contactEmail?: string;
  contactPhone?: string;
  note?: string;
  priceQuote?: number;
  status?: BookingStatus;
  tattooRequestId?: string;
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

/**
 * @deprecated This service is a backwards-compatibility wrapper. 
 * Use AppointmentService and AvailabilityService directly in new code.
 * This is maintained only for existing API routes and will be removed in a future version.
 */
export default class BookingService {
  private appointmentService: AppointmentService;
  private availabilityService: AvailabilityService;
  
  constructor() {
    this.appointmentService = new AppointmentService();
    this.availabilityService = new AvailabilityService();
  }
  
  async createBooking(params: CreateBookingParams) {
    try {
      const appointment = await this.appointmentService.create({
        startAt: params.startAt,
        duration: params.duration,
        customerId: params.customerId,
        contactEmail: params.contactEmail,
        contactPhone: params.contactPhone,
        bookingType: params.bookingType,
        artistId: params.artistId,
        note: params.note,
        priceQuote: params.priceQuote,
        status: params.status || BookingStatus.SCHEDULED,
        tattooRequestId: params.tattooRequestId
      });
      
      return {
        success: true,
        booking: appointment
      };
    } catch (error) {
      console.error('Booking creation error:', error);
      throw error;
    }
  }
  
  async updateBooking(params: UpdateBookingParams) {
    try {
      const appointment = await this.appointmentService.update(params.bookingId, {
        startAt: params.startAt,
        duration: params.duration,
        status: params.status,
        artistId: params.artistId,
        note: params.note,
        priceQuote: params.priceQuote
      });
      
      return {
        success: true,
        booking: appointment
      };
    } catch (error) {
      console.error('Booking update error:', error);
      throw error;
    }
  }
  
  async cancelBooking(params: CancelBookingParams) {
    try {
      const appointment = await this.appointmentService.cancel(
        params.bookingId, 
        params.reason, 
        params.cancelledBy
      );
      
      return {
        success: true,
        booking: appointment
      };
    } catch (error) {
      console.error('Booking cancellation error:', error);
      throw error;
    }
  }
  
  async getBookingAvailability(date: Date, artistId?: string) {
    try {
      const startAtMin = new Date(date);
      startAtMin.setHours(0, 0, 0, 0);
      
      const startAtMax = new Date(date);
      startAtMax.setHours(23, 59, 59, 999);
      
      const result = await this.availabilityService.searchAvailability({
        startAtMin,
        startAtMax,
        teamMemberIds: artistId ? [artistId] : undefined,
        duration: 60,
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
}

// Re-export types for backwards compatibility
export { BookingType, BookingStatus }; 
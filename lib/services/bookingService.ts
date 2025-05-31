import { AppointmentService } from './appointmentService';
import { SquareIntegrationService } from './squareIntegrationService';

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
  
  constructor() {
    this.appointmentService = new AppointmentService();
    this.squareService = new SquareIntegrationService();
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
  
  async getBookingAvailability(date: Date, _artistId?: string) {
    // Implementation for checking available slots
    // Will be implemented in future PR
    return {
      success: true,
      date: date.toISOString().split('T')[0],
      availableSlots: []
    };
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
} 
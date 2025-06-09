import { Square } from "square";
import { BaseSquareClient } from './base-client';
import type { 
  SquareBookingResponse, 
  SquareListResponse,
  SquareAppointmentSegment 
} from './types';

export class BookingsService extends BaseSquareClient {

  async getBookings(
    cursor?: string,
    limit?: number,
    startAtMin?: string,
    startAtMax?: string
  ): Promise<SquareBookingResponse> {
    const response = await this.client.bookings.list({
      cursor,
      limit,
      locationId: this.locationId,
      startAtMin,
      startAtMax
    }) as SquareListResponse<Square.Booking>;
    
    return {
      result: {
        bookings: response.data || []
      },
      cursor: response.cursor,
      errors: []
    };
  }

  async getBookingById(bookingId: string): Promise<SquareBookingResponse> {
    return this.client.bookings.get({
      bookingId
    });
  }

  // Create booking
  async createBooking(params: {
    startAt: string;
    locationId?: string;
    customerId: string;
    serviceId?: string;
    duration: number;
    idempotencyKey: string;
    staffId?: string;
    note?: string;
    bookingType?: string;
  }): Promise<SquareBookingResponse> {
    const locationId = params.locationId || this.locationId;
    
    // Add tattoo shop specific booking type to note if provided
    const bookingNote = params.bookingType 
      ? `${params.bookingType}${params.note ? ` - ${params.note}` : ''}`
      : params.note;
    
    // Build appointment segment - use Square's type directly
    const appointmentSegment: SquareAppointmentSegment = {
      durationMinutes: params.duration,
      teamMemberId: params.staffId || 'any',
      serviceVariationId: params.serviceId || 'any'
    };
    
    return this.client.bookings.create({
      idempotencyKey: params.idempotencyKey,
      booking: {
        startAt: params.startAt,
        locationId: locationId,
        customerId: params.customerId,
        appointmentSegments: [appointmentSegment],
        sellerNote: bookingNote
      }
    });
  }

  // Update booking - Square doesn't provide direct update API, so we need to 
  // cancel and recreate the booking
  async updateBooking(params: {
    bookingId: string;
    startAt?: string;
    customerId?: string;
    serviceId?: string;
    duration?: number;
    idempotencyKey: string;
    staffId?: string;
    note?: string;
    bookingType?: string;
  }): Promise<SquareBookingResponse> {
    // First, get existing booking details to preserve unchanged values
    const existingBookingResponse = await this.getBookingById(params.bookingId);
    const existingBooking = existingBookingResponse.result?.booking;
    
    if (!existingBooking) {
      throw new Error(`Booking with ID ${params.bookingId} not found`);
    }
    
    // Create a cancellation request
    const cancelResponse = await this.client.bookings.cancel({
      bookingId: params.bookingId,
      bookingVersion: existingBooking.version
    });
    
    // Check if cancel operation failed
    if (cancelResponse.errors && cancelResponse.errors.length > 0) {
      throw new Error(`Failed to cancel existing booking: ${cancelResponse.errors[0]?.detail || 'Unknown error'}`);
    }
    
    // Build appointment segment with proper typing
    const appointmentSegment = existingBooking.appointmentSegments?.[0] || {
      durationMinutes: 60,
      teamMemberId: 'any',
      serviceVariationId: 'any'
    };
    
    // Add tattoo shop specific booking type to note if provided
    const bookingNote = params.bookingType 
      ? `${params.bookingType}${params.note ? ` - ${params.note}` : ''}`
      : (params.note || existingBooking.sellerNote);
    
    // Build appointment segment with Square's expected structure
    const newAppointmentSegment: SquareAppointmentSegment = {
      durationMinutes: params.duration || appointmentSegment.durationMinutes || 60,
      teamMemberId: params.staffId || appointmentSegment.teamMemberId || 'any',
      serviceVariationId: params.serviceId || appointmentSegment.serviceVariationId || 'any'
    };
    
    // Create a new booking with updated information
    return this.client.bookings.create({
      idempotencyKey: params.idempotencyKey,
      booking: {
        startAt: params.startAt || existingBooking.startAt,
        locationId: existingBooking.locationId,
        customerId: params.customerId || existingBooking.customerId,
        appointmentSegments: [newAppointmentSegment],
        sellerNote: bookingNote
      }
    });
  }

  // Cancel booking in Square
  async cancelBooking(params: {
    bookingId: string;
    bookingVersion: number;
    idempotencyKey?: string;
  }): Promise<SquareBookingResponse> {
    return this.client.bookings.cancel({
      bookingId: params.bookingId,
      bookingVersion: params.bookingVersion,
      idempotencyKey: params.idempotencyKey
    });
  }
} 
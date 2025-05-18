import { v4 as uuidv4 } from 'uuid';
import SquareClient from '../square/index.js';
import { prisma } from '../prisma/prisma.js';

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
  customerId: string;
  bookingType: BookingType;
  artistId?: string;
  customerEmail?: string;
  customerPhone?: string;
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

export default class BookingService {
  private squareClient: ReturnType<typeof SquareClient.fromEnv>;
  
  constructor() {
    this.squareClient = SquareClient.fromEnv();
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
      tattooRequestId
    } = params;
    
    // Generate unique identifier for this booking
    const idempotencyKey = uuidv4();
    
    try {
      // First check if customer exists in our database
      const customer = await prisma.customer.findUnique({
        where: { id: customerId }
      });
      
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      // Calculate end time
      const endTime = new Date(startAt.getTime() + duration * 60000);
      
      // Create booking data
      const bookingData: any = {
        startTime: startAt,
        endTime,
        status,
        type: bookingType,
        customerId,
        notes: note,
        priceQuote
      };
      
      // Add artist if provided
      if (artistId) {
        bookingData.artistId = artistId;
      }
      
      // Add tattoo request if provided
      if (tattooRequestId) {
        // Check if tattoo request exists
        const tattooRequest = await prisma.tattooRequest.findUnique({
          where: { id: tattooRequestId }
        });
        
        if (!tattooRequest) {
          throw new Error('Tattoo request not found');
        }
        
        bookingData.tattooRequestId = tattooRequestId;
      }
      
      let squareBooking;
      
      try {
        // Create booking in Square
        squareBooking = await this.squareClient.createBooking({
          startAt: startAt.toISOString(),
          locationId: process.env.SQUARE_LOCATION_ID,
          customerId: customer.email || customerId,
          duration,
          idempotencyKey,
          staffId: artistId,
          note: `Booking type: ${bookingType}${note ? ` - ${note}` : ''}`
        });
        
        // Add Square booking ID to our data
        if (squareBooking?.result?.booking?.id) {
          bookingData.squareId = squareBooking.result.booking.id;
        }
      } catch (squareError) {
        // Log the error but continue with our database booking
        console.error('Square booking error:', squareError);
        
        await prisma.auditLog.create({
          data: {
            action: 'square_booking_failed',
            resource: 'appointment',
            details: { 
              error: squareError.message || 'Unknown Square API error',
              bookingType,
              startAt: startAt.toISOString(),
              customerId
            }
          }
        });
      }
      
      // Store booking in database
      const booking = await prisma.appointment.create({
        data: bookingData,
        include: {
          customer: true,
          artist: true,
        }
      });
      
      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          action: 'booking_created',
          resource: 'appointment',
          resourceId: booking.id,
          details: { 
            bookingType, 
            startAt: startAt.toISOString(), 
            customerId,
            squareId: bookingData.squareId 
          }
        }
      });
      
      return {
        success: true,
        booking,
        squareBooking: squareBooking?.result?.booking
      };
    } catch (error) {
      // Log error
      console.error('Booking creation error:', error);
      
      // Create audit log for failed booking
      await prisma.auditLog.create({
        data: {
          action: 'booking_failed',
          resource: 'appointment',
          details: { 
            bookingType, 
            startAt: startAt.toISOString(), 
            customerId,
            error: error.message || 'Unknown error'
          }
        }
      });
      
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
      // Get existing booking
      const existingBooking = await prisma.appointment.findUnique({
        where: { id: bookingId },
        include: {
          customer: true
        }
      });
      
      if (!existingBooking) {
        throw new Error('Booking not found');
      }
      
      // Prepare update data
      const updateData: any = {};
      
      if (startAt) {
        updateData.startTime = startAt;
        
        // Recalculate end time if duration provided
        if (duration) {
          updateData.endTime = new Date(startAt.getTime() + duration * 60000);
        } else if (existingBooking && existingBooking) {
          // Maintain same duration
          const existingDuration = existingBooking.duration * 60000; // Convert minutes to milliseconds
          updateData.endTime = new Date(startAt.getTime() + existingDuration);
        }
      } else if (duration && existingBooking.date) {
        // Only duration changed, recalculate end time
        updateData.endTime = new Date(existingBooking.date.getTime() + duration * 60000);
      }
      
      if (status) {
        updateData.status = status;
      }
      
      if (artistId) {
        updateData.artistId = artistId;
      }
      
      if (note !== undefined) {
        updateData.notes = note;
      }
      
      if (priceQuote !== undefined) {
        updateData.priceQuote = priceQuote;
      }
      
      // Update in our database
      const updatedBooking = await prisma.appointment.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          customer: true,
          artist: true
        }
      });
      
      // Update in Square if we have a Square ID
      let squareBookingResult = null;
      if (existingBooking.squareId) {
        try {
          // Generate unique idempotency key for this update
          const idempotencyKey = uuidv4();
          
          // Update booking in Square by canceling and recreating
          squareBookingResult = await this.squareClient.updateBooking({
            bookingId: existingBooking.squareId,
            startAt: startAt ? startAt.toISOString() : undefined,
            customerId: existingBooking.customer?.email || existingBooking.customerId,
            duration: duration || existingBooking.duration,
            idempotencyKey,
            staffId: artistId,
            note: note,
            bookingType: existingBooking.type
          });
          
          // Update squareId if it changed (it will, since we cancel and recreate)
          if (squareBookingResult?.result?.booking?.id) {
            await prisma.appointment.update({
              where: { id: bookingId },
              data: { squareId: squareBookingResult.result.booking.id }
            });
          }
          
          // Log successful update
          await prisma.auditLog.create({
            data: {
              action: 'square_booking_updated',
              resource: 'appointment',
              resourceId: bookingId,
              details: { 
                oldSquareId: existingBooking.squareId,
                newSquareId: squareBookingResult?.result?.booking?.id,
                bookingId
              }
            }
          });
        } catch (squareError) {
          console.error('Square booking update error:', squareError);
          
          // Log the error
          await prisma.auditLog.create({
            data: {
              action: 'square_booking_update_failed',
              resource: 'appointment',
              resourceId: bookingId,
              details: { 
                error: squareError.message || 'Unknown Square API error',
                squareId: existingBooking.squareId,
                bookingId
              }
            }
          });
        }
      }
      
      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          action: 'booking_updated',
          resource: 'appointment',
          resourceId: bookingId,
          details: { 
            previousStatus: existingBooking.status,
            newStatus: status || existingBooking.status,
            changes: updateData
          }
        }
      });
      
      return {
        success: true,
        booking: updatedBooking,
        squareBookingUpdated: squareBookingResult
      };
    } catch (error) {
      console.error('Booking update error:', error);
      throw error;
    }
  }
  
  async getBookingAvailability(date: Date, artistId?: string) {
    // Implementation for checking available slots
    // Will be implemented in future PR
    return {
      success: true,
      date: date.toISOString().split('T')[0],
      availableSlots: []
    };
  }
} 
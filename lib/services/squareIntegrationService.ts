import { v4 as uuidv4 } from 'uuid';
import SquareClient from '../square/index';
import { prisma } from '../prisma/prisma';
import type { Appointment } from '@prisma/client';

export class SquareIntegrationService {
  private squareClient: ReturnType<typeof SquareClient.fromEnv>;
  
  constructor() {
    this.squareClient = SquareClient.fromEnv();
  }
  
  async syncAppointmentToSquare(appointment: Appointment): Promise<{ squareId?: string; error?: string }> {
    // Only sync if we have a customer
    if (!appointment.customerId) {
      return { error: 'No customer ID - skipping Square sync for anonymous appointment' };
    }
    
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: appointment.customerId }
      });
      
      if (!customer || !customer.email) {
        return { error: 'Customer not found or missing email' };
      }
      
      const idempotencyKey = uuidv4();
      
      const squareBooking = await this.squareClient.createBooking({
        startAt: appointment.startTime?.toISOString() || new Date().toISOString(),
        locationId: process.env.SQUARE_LOCATION_ID,
        customerId: customer.email,
        duration: appointment.duration || 60,
        idempotencyKey,
        staffId: appointment.artistId || undefined,
        note: `${appointment.type || 'appointment'}${appointment.notes ? ` - ${appointment.notes}` : ''}`
      });
      
      if (squareBooking?.result?.booking?.id) {
        // Update appointment with Square ID
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { squareId: squareBooking.result.booking.id }
        });
        
        return { squareId: squareBooking.result.booking.id };
      }
      
      return { error: 'Square booking created but no ID returned' };
    } catch (error) {
      // Log the error
      await this.logSquareError('sync_failed', appointment.id, error);
      
      // Don't throw - return error info instead
      return { 
        error: error.message || 'Unknown Square API error'
      };
    }
  }
  
  async updateSquareBooking(appointment: Appointment): Promise<{ success: boolean; newSquareId?: string; error?: string }> {
    if (!appointment.squareId) {
      // Try to sync it first if it doesn't have a Square ID
      const syncResult = await this.syncAppointmentToSquare(appointment);
      return { 
        success: !!syncResult.squareId, 
        newSquareId: syncResult.squareId,
        error: syncResult.error 
      };
    }
    
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: appointment.customerId || '' }
      });
      
      if (!customer || !customer.email) {
        return { success: false, error: 'Customer not found or missing email' };
      }
      
      const idempotencyKey = uuidv4();
      
      // Square doesn't support updates, so we cancel and recreate
      const cancelResult = await this.cancelSquareBooking(appointment.squareId);
      
      if (!cancelResult.success && !cancelResult.notFound) {
        return { success: false, error: cancelResult.error };
      }
      
      // Create new booking
      const squareBooking = await this.squareClient.createBooking({
        startAt: appointment.startTime?.toISOString() || new Date().toISOString(),
        locationId: process.env.SQUARE_LOCATION_ID,
        customerId: customer.email,
        duration: appointment.duration || 60,
        idempotencyKey,
        staffId: appointment.artistId || undefined,
        note: `${appointment.type || 'appointment'}${appointment.notes ? ` - ${appointment.notes}` : ''}`
      });
      
      if (squareBooking?.result?.booking?.id) {
        // Update appointment with new Square ID
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { squareId: squareBooking.result.booking.id }
        });
        
        return { 
          success: true, 
          newSquareId: squareBooking.result.booking.id 
        };
      }
      
      return { success: false, error: 'Square booking created but no ID returned' };
    } catch (error) {
      await this.logSquareError('update_failed', appointment.id, error);
      return { 
        success: false, 
        error: error.message || 'Unknown Square API error' 
      };
    }
  }
  
  async cancelSquareBooking(squareId: string): Promise<{ success: boolean; notFound?: boolean; error?: string }> {
    try {
      // Get Square booking to get version
      const squareBooking = await this.squareClient.getBookingById(squareId);
      
      if (!squareBooking?.result?.booking) {
        return { success: false, notFound: true, error: 'Square booking not found' };
      }
      
      // Cancel in Square
      const result = await this.squareClient.cancelBooking({
        bookingId: squareId,
        bookingVersion: squareBooking.result.booking.version || 0,
        idempotencyKey: `cancel-${squareId}-${Date.now()}`
      });
      
      return { success: !!result?.result };
    } catch (error) {
      // Check if it's a not found error
      if (error.statusCode === 404 || error.message?.includes('not found')) {
        return { success: false, notFound: true, error: 'Square booking not found' };
      }
      
      return { 
        success: false, 
        error: error.message || 'Failed to cancel Square booking' 
      };
    }
  }
  
  private async logSquareError(action: string, appointmentId: string, error: Error | unknown) {
    try {
      await prisma.auditLog.create({
        data: {
          action: `square_${action}`,
          resource: 'appointment',
          resourceId: appointmentId,
          resourceType: 'appointment',
          details: JSON.stringify({
            error: error instanceof Error ? error.message : 'Unknown Square API error',
            errorDetails: error instanceof Error && 'errors' in error ? (error as { errors: unknown }).errors : String(error),
            severity: process.env.NODE_ENV === 'production' ? 'high' : 'medium'
          })
        }
      });
    } catch (logError) {
      console.error('Failed to log Square error:', logError);
    }
  }
} 
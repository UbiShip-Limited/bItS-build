import { prisma } from '../prisma/prisma';
import { BookingStatus, BookingType } from '../types/booking';
import { AppointmentError, ValidationError, NotFoundError } from './errors';
import type { Appointment, Prisma } from '@prisma/client';

export interface CreateAppointmentData {
  startAt: Date;
  duration: number; // minutes
  customerId?: string;
  contactEmail?: string;
  contactPhone?: string;
  bookingType: BookingType;
  artistId?: string;
  note?: string;
  priceQuote?: number;
  status?: BookingStatus;
  tattooRequestId?: string;
}

export interface UpdateAppointmentData {
  startAt?: Date;
  duration?: number;
  status?: BookingStatus;
  artistId?: string;
  note?: string;
  priceQuote?: number;
}

export interface AppointmentFilters {
  status?: BookingStatus;
  customerId?: string;
  artistId?: string;
  from?: Date;
  to?: Date;
}

/**
 * Backend business logic service for appointments
 * Handles database operations, validation, and business rules
 * Note: Frontend uses AppointmentApiClient for API calls
 */
export class AppointmentService {
  async create(data: CreateAppointmentData): Promise<Appointment> {
    // Validate business logic first
    this.validateAppointmentBusinessLogic(data);
    
    // Validate: either customerId OR contact info required
    if (!data.customerId && !data.contactEmail) {
      throw new ValidationError(
        'Either customer ID or contact email is required',
        'contact_info'
      );
    }
    
    // If customerId provided, verify it exists
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId }
      });
      
      if (!customer) {
        throw new NotFoundError('Customer', data.customerId);
      }
    }
    
    // If artistId provided, verify it exists
    if (data.artistId) {
      const artist = await prisma.user.findUnique({
        where: { id: data.artistId }
      });
      
      if (!artist) {
        throw new NotFoundError('Artist', data.artistId);
      }
    }
    
    // Calculate end time
    const endTime = new Date(data.startAt.getTime() + data.duration * 60000);
    
    // Check for time conflicts if artist is specified
    if (data.artistId) {
      await this.checkTimeConflicts(data.startAt, endTime, data.artistId);
    }
    
    // Create appointment data
    const appointmentData: Prisma.AppointmentCreateInput = {
      startTime: data.startAt,
      endTime,
      duration: data.duration,
      status: data.status || BookingStatus.SCHEDULED,
      type: data.bookingType,
      notes: data.note,
      priceQuote: data.priceQuote,
      // Store contact info directly for anonymous bookings
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone
    };
    
    // Only set relations if IDs are provided
    if (data.customerId) {
      appointmentData.customer = { connect: { id: data.customerId } };
    }
    if (data.artistId) {
      appointmentData.artist = { connect: { id: data.artistId } };
    }
    if (data.tattooRequestId) {
      appointmentData.tattooRequest = { connect: { id: data.tattooRequestId } };
    }
    
    try {
      const appointment = await prisma.$transaction(async (tx) => {
        const newAppointment = await tx.appointment.create({
          data: appointmentData,
          include: {
            customer: true,
            artist: true,
            tattooRequest: true
          }
        });
        
        // Log the creation in the same transaction
        await tx.auditLog.create({
          data: {
            action: 'appointment_created',
            resource: 'Appointment',
            resourceId: newAppointment.id,
            resourceType: 'appointment',
            details: {
              bookingType: data.bookingType,
              isAnonymous: !data.customerId,
              startAt: data.startAt.toISOString()
            }
          }
        });
        
        return newAppointment;
      });
      
      return appointment;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ValidationError('An appointment already exists for this time slot');
      }
      throw error;
    }
  }
  
  async update(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    const existing = await this.findById(id);
    
    // If artistId is being updated, validate it exists
    if (data.artistId && data.artistId !== '') {
      const artist = await prisma.user.findUnique({
        where: { id: data.artistId }
      });
      
      if (!artist) {
        throw new NotFoundError('Artist', data.artistId);
      }
    }
    
    const updateData: Prisma.AppointmentUpdateInput = {};
    
    if (data.startAt) {
      updateData.startTime = data.startAt;
      
      // Recalculate end time
      const duration = data.duration || existing.duration || 60;
      updateData.endTime = new Date(data.startAt.getTime() + duration * 60000);
      
      // Check for time conflicts
      if (existing.artistId || data.artistId) {
        const artistId = data.artistId !== undefined ? data.artistId : existing.artistId;
        if (artistId) {
          await this.checkTimeConflicts(data.startAt, updateData.endTime as Date, artistId, id);
        }
      }
      
      if (data.duration) {
        updateData.duration = data.duration;
      }
    } else if (data.duration && existing.startTime) {
      // Only duration changed
      updateData.duration = data.duration;
      updateData.endTime = new Date(existing.startTime.getTime() + data.duration * 60000);
      
      // Check for time conflicts with new duration
      if (existing.artistId) {
        await this.checkTimeConflicts(existing.startTime, updateData.endTime as Date, existing.artistId, id);
      }
    }
    
    if (data.status) updateData.status = data.status;
    if (data.artistId !== undefined) {
      updateData.artist = data.artistId 
        ? { connect: { id: data.artistId } }
        : { disconnect: true };
    }
    if (data.note !== undefined) updateData.notes = data.note;
    if (data.priceQuote !== undefined) updateData.priceQuote = data.priceQuote;
    
    const updated = await prisma.$transaction(async (tx) => {
      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          artist: true,
          tattooRequest: true
        }
      });
      
      // Log the update in the same transaction
      await tx.auditLog.create({
        data: {
          action: 'appointment_updated',
          resource: 'Appointment',
          resourceId: id,
          resourceType: 'appointment',
          details: {
            previousStatus: existing.status,
            newStatus: data.status || existing.status,
            changes: Object.keys(data)
          }
        }
      });
      
      return updatedAppointment;
    });
    
    return updated;
  }
  
  async cancel(id: string, reason?: string, cancelledBy?: string): Promise<Appointment> {
    const existing = await this.findById(id);
    
    if (existing.status === BookingStatus.CANCELLED) {
      throw new ValidationError('Appointment is already cancelled');
    }
    
    const cancelled = await prisma.$transaction(async (tx) => {
      const cancelledAppointment = await tx.appointment.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELLED,
          notes: existing.notes 
            ? `${existing.notes}\n\nCancellation reason: ${reason || 'No reason provided'}`
            : `Cancellation reason: ${reason || 'No reason provided'}`
        },
        include: {
          customer: true,
          artist: true
        }
      });
      
      // Log the cancellation in the same transaction
      await tx.auditLog.create({
        data: {
          action: 'appointment_cancelled',
          resource: 'Appointment',
          resourceId: id,
          resourceType: 'appointment',
          userId: cancelledBy,
          details: {
            reason,
            previousStatus: existing.status
          }
        }
      });
      
      return cancelledAppointment;
    });
    
    return cancelled;
  }
  
  async findById(id: string): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        artist: true,
        tattooRequest: true
      }
    });
    
    if (!appointment) {
      throw new NotFoundError('Appointment', id);
    }
    
    return appointment;
  }
  
  /**
   * Get notification status for an appointment
   * Checks if Square notifications are enabled and retrieves communication history
   */
  async getNotificationStatus(id: string): Promise<{
    squareNotificationsEnabled: boolean;
    communicationHistory: Array<{
      id: string;
      type: string;
      sentAt: Date;
      details: any;
    }>;
  }> {
    const appointment = await this.findById(id);
    
    // Check if Square notifications are enabled (appointment has squareId)
    const squareNotificationsEnabled = !!appointment.squareId;
    
    // Get communication history from audit logs
    const communicationLogs = await prisma.auditLog.findMany({
      where: {
        resourceId: id,
        action: {
          in: [
            'appointment_confirmation',
            'appointment_reminder',
            'aftercare_instructions',
            'booking_created_webhook',
            'booking_updated_webhook'
          ]
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const communicationHistory = communicationLogs.map(log => ({
      id: log.id,
      type: log.action,
      sentAt: log.createdAt,
      details: log.details
    }));
    
    return {
      squareNotificationsEnabled,
      communicationHistory
    };
  }
  
  async list(filters: AppointmentFilters, page: number = 1, limit: number = 20) {
    const where: Prisma.AppointmentWhereInput = {};
    
    if (filters.status) where.status = filters.status;
    if (filters.customerId) where.customerId = filters.customerId;
    if (filters.artistId) where.artistId = filters.artistId;
    
    if (filters.from || filters.to) {
      where.startTime = {};
      if (filters.from) where.startTime.gte = filters.from;
      if (filters.to) where.startTime.lte = filters.to;
    }
    
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          customer: true,
          artist: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { startTime: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.appointment.count({ where })
    ]);
    
    return {
      data: appointments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async validateAppointmentData(data: Record<string, unknown>): Promise<void> {
    // Validate required fields - either customerId OR contactEmail is required
    if (!data.customerId && !data.contactEmail) {
      throw new AppointmentError(
        'Either customer ID or contact email is required', 
        'INVALID_CONTACT_INFO'
      );
    }
    
    // Validate customerId if provided
    if (data.customerId && typeof data.customerId !== 'string') {
      throw new AppointmentError('customerId must be a string', 'INVALID_CUSTOMER_ID');
    }
    
    // Validate contactEmail if provided
    if (data.contactEmail && typeof data.contactEmail !== 'string') {
      throw new AppointmentError('contactEmail must be a string', 'INVALID_CONTACT_EMAIL');
    }
    
    // Validate required booking fields
    if (!data.startAt || !(data.startAt instanceof Date)) {
      throw new AppointmentError('startAt is required and must be a Date', 'INVALID_START_TIME');
    }
    
    if (!data.duration || typeof data.duration !== 'number' || data.duration <= 0) {
      throw new AppointmentError('duration is required and must be a positive number', 'INVALID_DURATION');
    }
    
    if (!data.bookingType || typeof data.bookingType !== 'string') {
      throw new AppointmentError('bookingType is required and must be a string', 'INVALID_BOOKING_TYPE');
    }
  }

  private validateAppointmentBusinessLogic(data: CreateAppointmentData): void {
    // Validate appointment date is not in the past
    const now = new Date();
    const appointmentDate = new Date(data.startAt);
    
    if (appointmentDate <= now) {
      throw new ValidationError('Appointment date must be in the future');
    }
    
    // Validate duration is positive and reasonable (between 15 minutes and 8 hours)
    if (!data.duration || data.duration <= 0) {
      throw new ValidationError('Duration must be a positive number');
    }
    
    if (data.duration < 15) {
      throw new ValidationError('Minimum appointment duration is 15 minutes');
    }
    
    if (data.duration > 480) { // 8 hours
      throw new ValidationError('Maximum appointment duration is 8 hours');
    }
    
    // Validate price quote is positive if provided
    if (data.priceQuote !== undefined && data.priceQuote < 0) {
      throw new ValidationError('Price quote must be a positive number');
    }
  }

  async checkTimeConflicts(startTime: Date, endTime: Date, artistId?: string, excludeAppointmentId?: string): Promise<void> {
    const where: Prisma.AppointmentWhereInput = {
      AND: [
        {
          OR: [
            // New appointment starts during existing appointment
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            // New appointment ends during existing appointment
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            },
            // New appointment completely encompasses existing appointment
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } }
              ]
            }
          ]
        },
        { status: { not: BookingStatus.CANCELLED } }
      ]
    };
    
    // If artistId is provided, check conflicts for that artist
    if (artistId) {
      where.artistId = artistId;
    }
    
    // Exclude current appointment if updating
    if (excludeAppointmentId) {
      where.id = { not: excludeAppointmentId };
    }
    
    const conflicts = await prisma.appointment.findMany({
      where,
      select: { id: true, startTime: true, endTime: true }
    });
    
    if (conflicts.length > 0) {
      throw new ValidationError(
        `Time conflict detected with existing appointment${conflicts.length > 1 ? 's' : ''}`
      );
    }
  }
}

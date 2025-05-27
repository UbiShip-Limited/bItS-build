import { prisma } from '../prisma/prisma';
import { BookingStatus, BookingType } from '../types/booking.js';
import { AppointmentError, ValidationError, NotFoundError } from './errors.js';
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

export class AppointmentService {
  async create(data: CreateAppointmentData): Promise<Appointment> {
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
    
    // Calculate end time
    const endTime = new Date(data.startAt.getTime() + data.duration * 60000);
    
    // Create appointment data
    const appointmentData: any = {
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
      const appointment = await prisma.appointment.create({
        data: appointmentData,
        include: {
          customer: true,
          artist: true,
          tattooRequest: true
        }
      });
      
      // Log the creation
      await prisma.auditLog.create({
        data: {
          action: 'appointment_created',
          resource: 'Appointment',
          resourceId: appointment.id,
          resourceType: 'appointment',
          details: {
            bookingType: data.bookingType,
            isAnonymous: !data.customerId,
            startAt: data.startAt.toISOString()
          }
        }
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
    
    const updateData: Prisma.AppointmentUpdateInput = {};
    
    if (data.startAt) {
      updateData.startTime = data.startAt;
      
      // Recalculate end time
      const duration = data.duration || existing.duration || 60;
      updateData.endTime = new Date(data.startAt.getTime() + duration * 60000);
      
      if (data.duration) {
        updateData.duration = data.duration;
      }
    } else if (data.duration && existing.startTime) {
      // Only duration changed
      updateData.duration = data.duration;
      updateData.endTime = new Date(existing.startTime.getTime() + data.duration * 60000);
    }
    
    if (data.status) updateData.status = data.status;
    if (data.artistId !== undefined) {
      updateData.artist = data.artistId 
        ? { connect: { id: data.artistId } }
        : { disconnect: true };
    }
    if (data.note !== undefined) updateData.notes = data.note;
    if (data.priceQuote !== undefined) updateData.priceQuote = data.priceQuote;
    
    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        artist: true,
        tattooRequest: true
      }
    });
    
    // Log the update
    await prisma.auditLog.create({
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
    
    return updated;
  }
  
  async cancel(id: string, reason?: string, cancelledBy?: string): Promise<Appointment> {
    const existing = await this.findById(id);
    
    if (existing.status === BookingStatus.CANCELLED) {
      throw new ValidationError('Appointment is already cancelled');
    }
    
    const cancelled = await prisma.appointment.update({
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
    
    // Log the cancellation
    await prisma.auditLog.create({
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
}

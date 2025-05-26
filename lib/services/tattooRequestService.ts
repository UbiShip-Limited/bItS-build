import { prisma } from '../prisma/prisma.js';
import { NotFoundError, ValidationError } from './errors.js';
import { AppointmentService } from './appointmentService.js';
import { BookingType } from '../types/booking.js';
import type { TattooRequest, Prisma } from '@prisma/client';

export interface ConvertToAppointmentData {
  startAt: Date;
  duration: number;
  artistId?: string;
  bookingType?: BookingType;
  priceQuote?: number;
  note?: string;
}

export class TattooRequestService {
  private appointmentService: AppointmentService;
  
  constructor() {
    this.appointmentService = new AppointmentService();
  }
  
  async findById(id: string): Promise<TattooRequest> {
    const tattooRequest = await prisma.tattooRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        images: true,
        appointments: true
      }
    });
    
    if (!tattooRequest) {
      throw new NotFoundError('TattooRequest', id);
    }
    
    return tattooRequest;
  }
  
  async updateStatus(id: string, status: string, userId?: string): Promise<TattooRequest> {
    const existing = await this.findById(id);
    
    const updated = await prisma.tattooRequest.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        images: true
      }
    });
    
    // Log the update
    await prisma.auditLog.create({
      data: {
        action: 'tattoo_request_status_updated',
        resource: 'TattooRequest',
        resourceId: id,
        resourceType: 'tattoo_request',
        userId,
        details: {
          previousStatus: existing.status,
          newStatus: status
        }
      }
    });
    
    return updated;
  }
  
  async convertToAppointment(
    requestId: string, 
    appointmentData: ConvertToAppointmentData,
    userId?: string
  ) {
    const tattooRequest = await this.findById(requestId);
    
    // Validate status
    const validStatuses = ['approved', 'deposit_paid'];
    if (!validStatuses.includes(tattooRequest.status)) {
      throw new ValidationError(
        `Tattoo request must be in status 'approved' or 'deposit_paid' to convert to appointment. Current status: ${tattooRequest.status}`
      );
    }
    
    // Create the appointment
    const appointment = await this.appointmentService.create({
      startAt: appointmentData.startAt,
      duration: appointmentData.duration,
      customerId: tattooRequest.customerId || undefined,
      contactEmail: tattooRequest.contactEmail || undefined,
      contactPhone: tattooRequest.contactPhone || undefined,
      bookingType: appointmentData.bookingType || BookingType.TATTOO_SESSION,
      artistId: appointmentData.artistId,
      note: appointmentData.note,
      priceQuote: appointmentData.priceQuote,
      tattooRequestId: requestId
    });
    
    // Update tattoo request status if needed
    if (tattooRequest.status === 'approved') {
      await this.updateStatus(requestId, 'in_progress', userId);
    }
    
    // Log the conversion
    await prisma.auditLog.create({
      data: {
        action: 'tattoo_request_converted',
        resource: 'TattooRequest',
        resourceId: requestId,
        resourceType: 'tattoo_request',
        userId,
        details: {
          appointmentId: appointment.id,
          bookingType: appointmentData.bookingType || BookingType.TATTOO_SESSION
        }
      }
    });
    
    return {
      success: true,
      message: 'Tattoo request converted to appointment',
      appointment,
      tattooRequest: await this.findById(requestId)
    };
  }
  
  async list(filters: {
    status?: string;
    customerId?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, customerId, page = 1, limit = 20 } = filters;
    
    const where: Prisma.TattooRequestWhereInput = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    
    const [tattooRequests, total] = await Promise.all([
      prisma.tattooRequest.findMany({
        where,
        include: {
          customer: true,
          images: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.tattooRequest.count({ where })
    ]);
    
    return {
      data: tattooRequests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }
} 
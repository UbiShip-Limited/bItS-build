import { prisma } from '../prisma/prisma';
import { NotFoundError, ValidationError } from './errors';
import BookingService, { BookingType, BookingStatus } from './bookingService';
import { v4 as uuidv4 } from 'uuid';
import type { TattooRequest, Customer, Prisma } from '@prisma/client';

// Business status flow: new → reviewed → approved/rejected → converted_to_appointment
type TattooRequestStatus = 'new' | 'reviewed' | 'approved' | 'rejected' | 'converted_to_appointment';

export interface CreateTattooRequestData {
  // Required fields
  description: string;
  
  // Contact info (required for anonymous, optional for authenticated)
  contactEmail?: string;
  contactPhone?: string;
  
  // Optional authenticated user
  customerId?: string;
  
  // Tattoo details
  placement?: string;
  size?: string;
  colorPreference?: string;
  style?: string;
  purpose?: string;
  preferredArtist?: string;
  timeframe?: string;
  contactPreference?: string;
  additionalNotes?: string;
  referenceImages?: Array<{
    url: string;
    publicId: string;
  }>;
}

export interface ConvertToAppointmentData {
  startAt: Date;
  duration: number;
  artistId?: string;
  bookingType?: BookingType;
  priceQuote?: number;
  note?: string;
}

export interface TattooRequestFilters {
  status?: TattooRequestStatus;
  customerId?: string;
  page?: number;
  limit?: number;
}

/**
 * Backend business logic service for tattoo requests
 * Handles database operations, validation, and business rules
 * Note: Frontend uses TattooRequestApiClient for API calls
 */
export class TattooRequestService {
  private bookingService: BookingService;
  
  constructor() {
    this.bookingService = new BookingService();
  }
  
  /**
   * Create a new tattoo request (anonymous or authenticated)
   */
  async create(data: CreateTattooRequestData, userId?: string): Promise<TattooRequest> {
    // Validate business rules
    this.validateCreateData(data);
    
    // Generate tracking token for anonymous requests
    const isAnonymous = !data.customerId;
    const trackingToken = isAnonymous ? uuidv4() : null;
    
    // If authenticated, verify customer exists
    if (data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId }
      });
      
      if (!customer) {
        throw new NotFoundError('Customer', data.customerId);
      }
    }
    
    // Create tattoo request
    const tattooRequestData: Prisma.TattooRequestCreateInput = {
      description: data.description,
      placement: data.placement,
      size: data.size,
      colorPreference: data.colorPreference,
      style: data.style,
      purpose: data.purpose,
      preferredArtist: data.preferredArtist,
      timeframe: data.timeframe,
      contactPreference: data.contactPreference,
      additionalNotes: data.additionalNotes,
      referenceImages: data.referenceImages || [],
      status: 'new',
      trackingToken,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone
    };
    
    // Connect customer if authenticated
    if (data.customerId) {
      tattooRequestData.customer = { connect: { id: data.customerId } };
    }
    
    const tattooRequest = await prisma.$transaction(async (tx) => {
      const newRequest = await tx.tattooRequest.create({
        data: tattooRequestData,
        include: {
          customer: true,
          images: true
        }
      });
      
      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE',
          resource: 'TattooRequest',
          resourceId: newRequest.id,
          details: { 
            isAnonymous,
            hasCustomer: !!data.customerId
          }
        }
      });
      
      return newRequest;
    });
    
    return tattooRequest;
  }
  
  /**
   * Find tattoo request by ID with all relations
   */
  async findById(id: string): Promise<TattooRequest> {
    const tattooRequest = await prisma.tattooRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        images: true,
        appointments: {
          include: {
            artist: {
              select: { id: true, email: true, role: true }
            }
          }
        }
      }
    });
    
    if (!tattooRequest) {
      throw new NotFoundError('TattooRequest', id);
    }
    
    return tattooRequest;
  }
  
  /**
   * Update tattoo request status (admin workflow)
   */
  async updateStatus(id: string, status: TattooRequestStatus, userId?: string): Promise<TattooRequest> {
    const existing = await this.findById(id);
    
    // Validate status transition
    this.validateStatusTransition(existing.status, status);
    
    const updated = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.tattooRequest.update({
        where: { id },
        data: { status },
        include: {
          customer: true,
          images: true
        }
      });
      
      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'UPDATE_STATUS',
          resource: 'TattooRequest',
          resourceId: id,
          details: {
            previousStatus: existing.status,
            newStatus: status
          }
        }
      });
      
      return updatedRequest;
    });
    
    return updated;
  }
  
  /**
   * Convert approved tattoo request to appointment
   * This is where the magic happens - integrates with BookingService
   */
  async convertToAppointment(
    requestId: string, 
    appointmentData: ConvertToAppointmentData,
    userId?: string
  ) {
    const tattooRequest = await this.findById(requestId);
    
    // Validate business rules
    if (tattooRequest.status !== 'approved') {
      throw new ValidationError(
        `Tattoo request must be approved before converting to appointment. Current status: ${tattooRequest.status}`
      );
    }
    
    let customerId = tattooRequest.customerId;
    
    // Create customer record for anonymous requests
    if (!customerId && (tattooRequest.contactEmail || tattooRequest.contactPhone)) {
      const customer = await this.createCustomerFromAnonymous(tattooRequest);
      customerId = customer.id;
      
      // Update tattoo request with the new customer
      await prisma.tattooRequest.update({
        where: { id: requestId },
        data: { customerId: customer.id }
      });
    }
    
    if (!customerId) {
      throw new ValidationError('Cannot create appointment without customer information');
    }
    
    // Create appointment via BookingService (integrates with Square)
    const bookingResult = await this.bookingService.createBooking({
      startAt: appointmentData.startAt,
      duration: appointmentData.duration,
      customerId,
      bookingType: appointmentData.bookingType || BookingType.TATTOO_SESSION,
      artistId: appointmentData.artistId,
      note: appointmentData.note,
      priceQuote: appointmentData.priceQuote,
      status: BookingStatus.CONFIRMED, // Following your mapping: approved → confirmed
      tattooRequestId: requestId
    });
    
    if (!bookingResult.success) {
      throw new ValidationError('Failed to create appointment booking');
    }
    
    // Update tattoo request status
    await this.updateStatus(requestId, 'converted_to_appointment', userId);
    
    // Create audit log for conversion
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CONVERTED_TO_APPOINTMENT',
        resource: 'TattooRequest',
        resourceId: requestId,
        details: {
          appointmentId: bookingResult.booking.id,
          customerId,
          wasAnonymous: !tattooRequest.customerId
        }
      }
    });
    
    return {
      success: true,
      message: 'Tattoo request successfully converted to appointment',
      appointment: bookingResult.booking,
      customer: customerId,
      tattooRequest: await this.findById(requestId)
    };
  }
  
  /**
   * List tattoo requests with filters (admin dashboard)
   */
  async list(filters: TattooRequestFilters) {
    const { status, customerId, page = 1, limit = 20 } = filters;
    
    const where: Prisma.TattooRequestWhereInput = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    
    const [tattooRequests, total] = await Promise.all([
      prisma.tattooRequest.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, email: true }
          },
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
  
  /**
   * Create customer record from anonymous tattoo request
   */
  private async createCustomerFromAnonymous(tattooRequest: TattooRequest): Promise<Customer> {
    if (!tattooRequest.contactEmail && !tattooRequest.contactPhone) {
      throw new ValidationError('Cannot create customer without contact information');
    }
    
    // Generate name from email or use fallback
    const name = tattooRequest.contactEmail 
      ? tattooRequest.contactEmail.split('@')[0] 
      : 'Anonymous Customer';
    
    const customer = await prisma.customer.create({
      data: {
        name,
        email: tattooRequest.contactEmail,
        phone: tattooRequest.contactPhone,
        notes: `Created from tattoo request: ${tattooRequest.description.substring(0, 100)}...`
      }
    });
    
    return customer;
  }
  
  /**
   * Validate create data business rules
   */
  private validateCreateData(data: CreateTattooRequestData): void {
    // Either authenticated customer OR contact info required
    if (!data.customerId && !data.contactEmail) {
      throw new ValidationError('Either customer ID or contact email is required');
    }
    
    // Description is required and meaningful
    if (!data.description || data.description.trim().length < 10) {
      throw new ValidationError('Description must be at least 10 characters');
    }
    
    // Email format validation if provided
    if (data.contactEmail && !/^\S+@\S+\.\S+$/.test(data.contactEmail)) {
      throw new ValidationError('Invalid email format');
    }
  }
  
  /**
   * Validate status transitions
   */
  private validateStatusTransition(currentStatus: string, newStatus: TattooRequestStatus): void {
    const validTransitions: Record<string, TattooRequestStatus[]> = {
      'new': ['reviewed'],
      'reviewed': ['approved', 'rejected'],
      'approved': ['converted_to_appointment'],
      'rejected': [], // Terminal state
      'converted_to_appointment': [] // Terminal state
    };
    
    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'`
      );
    }
  }
} 
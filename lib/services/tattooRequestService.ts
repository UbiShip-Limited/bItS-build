import { prisma } from '../prisma/prisma';
import { NotFoundError, ValidationError } from './errors';
import { v4 as uuidv4 } from 'uuid';
import type { TattooRequest, Prisma } from '@prisma/client';
import { auditService } from './auditService';
import { CommunicationService } from './communicationService';
import { RealtimeService } from './realtimeService';

// Business status flow: new → reviewed → approved/rejected → converted_to_appointment
export type TattooRequestStatus = 'new' | 'reviewed' | 'approved' | 'rejected' | 'converted_to_appointment';

export interface CreateTattooRequestData {
  // Required fields
  description: string;
  
  // Contact info (required for anonymous, optional for authenticated)
  firstName?: string;
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
  bookingType?: string; // Using string to avoid direct dependency on BookingService types
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
 * Backend business logic service for tattoo requests.
 * This service is now focused on core CRUD, status management, and orchestration.
 * Image-related logic is delegated to TattooRequestImageService.
 * Auditing is delegated to AuditService.
 */
export class TattooRequestService {
  private communicationService?: CommunicationService;
  private realtimeService?: RealtimeService;
  
  constructor(communicationService?: CommunicationService, realtimeService?: RealtimeService) {
    this.communicationService = communicationService;
    this.realtimeService = realtimeService;
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
    
    // Create tattoo request with transaction to handle images
    const tattooRequest = await prisma.$transaction(async (tx) => {
      // Create tattoo request
      const tattooRequestData: Prisma.TattooRequestCreateInput = {
        description: data.description,
        firstName: data.firstName,
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
      
      const newRequest = await tx.tattooRequest.create({
        data: tattooRequestData,
        include: {
          customer: true
        }
      });
      
      // Store reference images in the Image table for proper querying
      if (data.referenceImages && data.referenceImages.length > 0) {
        await Promise.all(
          data.referenceImages.map(image => 
            tx.image.create({
              data: {
                url: image.url,
                publicId: image.publicId,
                tattooRequestId: newRequest.id,
                metadata: {
                  source: 'tattoo_request_upload',
                  uploadedAt: new Date().toISOString()
                }
              }
            })
          )
        );
      }
      
      return newRequest;
    });
    
    await auditService.log({
      userId,
      action: 'CREATE',
      resource: 'TattooRequest',
      resourceId: tattooRequest.id,
      details: {
        isAnonymous,
        hasCustomer: !!data.customerId,
        imageCount: data.referenceImages?.length || 0
      },
    });
    
    // Send confirmation email to customer
    if (this.communicationService) {
      try {
        await this.communicationService.sendTattooRequestConfirmation(tattooRequest);
      } catch (error) {
        // Log error but don't fail the request creation
        console.error('Failed to send tattoo request confirmation email:', error);
        await auditService.log({
          userId,
          action: 'EMAIL_SEND_FAILED',
          resource: 'TattooRequest',
          resourceId: tattooRequest.id,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            type: 'tattoo_request_confirmation'
          }
        });
      }

      // Send notification to shop owner
      try {
        await this.communicationService.sendOwnerNewRequestNotification(tattooRequest);
      } catch (error) {
        // Log error but don't fail the request creation
        console.error('Failed to send owner notification for new tattoo request:', error);
        await auditService.log({
          userId,
          action: 'OWNER_NOTIFICATION_FAILED',
          resource: 'TattooRequest',
          resourceId: tattooRequest.id,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            type: 'owner_new_request'
          }
        });
      }
    }
    
    // Send realtime notification for new request
    if (this.realtimeService) {
      await this.realtimeService.notifyRequestSubmitted(
        tattooRequest.id, 
        tattooRequest.customerId || undefined
      );
    }
    
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
    
    const updatedRequest = await prisma.tattooRequest.update({
      where: { id },
      data: { status },
      include: {
        customer: true
      }
    });
    
    await auditService.log({
      userId,
      action: 'UPDATE_STATUS',
      resource: 'TattooRequest',
      resourceId: id,
      details: {
        previousStatus: existing.status,
        newStatus: status
      },
    });
    
    // Send realtime notifications based on status change
    if (this.realtimeService) {
      const customerId = updatedRequest.customerId || undefined;
      
      switch (status) {
        case 'reviewed':
          await this.realtimeService.notifyRequestReviewed(id, customerId);
          break;
        case 'approved':
          await this.realtimeService.notifyRequestApproved(id, customerId);
          break;
        case 'rejected':
          await this.realtimeService.notifyRequestRejected(id, customerId);
          break;
      }
    }
    
    return updatedRequest;
  }
  
  /**
   * Update tattoo request (general update method)
   */
  async update(id: string, data: { customerId?: string; notes?: string }, userId?: string): Promise<TattooRequest> {
    const existing = await this.findById(id);
    
    // Validate that we're not overwriting an existing customer
    if (data.customerId && existing.customerId && existing.customerId !== data.customerId) {
      throw new ValidationError('Cannot reassign customer for a tattoo request that already has a customer');
    }
    
    // Only allow updating specific fields
    const updateData: any = {};
    if (data.customerId !== undefined) updateData.customerId = data.customerId;
    if (data.notes !== undefined) updateData.additionalNotes = data.notes;
    
    const updatedRequest = await prisma.tattooRequest.update({
      where: { id },
      data: updateData,
      include: {
        customer: true
      }
    });
    
    // Log the update
    await auditService.log({
      userId,
      action: 'UPDATE',
      resource: 'TattooRequest',
      resourceId: id,
      details: {
        updates: data
      }
    });
    
    // Notify real-time listeners about the update
    if (this.realtimeService) {
      await this.realtimeService.notifyRequestSubmitted(id, data.customerId);
    }
    
    return updatedRequest;
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
          }
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
      'new': ['reviewed', 'approved', 'rejected'],
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
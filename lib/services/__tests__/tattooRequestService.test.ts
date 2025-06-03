import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TattooRequestService, ConvertToAppointmentData } from '../tattooRequestService';
import { NotFoundError, ValidationError } from '../errors';
import { BookingType } from '../../types/booking';

// Mock prisma
vi.mock('../../prisma/prisma', () => ({
  prisma: {
    tattooRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    }
  }
}));

// Mock AppointmentService
vi.mock('../appointmentService', () => ({
  AppointmentService: vi.fn(() => ({
    create: vi.fn()
  }))
}));

describe('TattooRequestService', () => {
  let tattooRequestService: TattooRequestService;
  let mockPrisma: any;
  let mockAppointmentService: any;
  
  const mockTattooRequest = {
    id: 'tattoo-request-123',
    purpose: 'New tattoo design',
    contactEmail: 'test@example.com',
    contactPhone: '+1234567890',
    description: 'Traditional Japanese dragon design',
    placement: 'Upper arm',
    size: 'Medium (4-6 inches)',
    colorPreference: 'Full color',
    style: 'Traditional Japanese',
    preferredArtist: 'Any artist',
    timeframe: 'Within 3 months',
    contactPreference: 'Email',
    additionalNotes: 'Available weekends',
    status: 'pending',
    customerId: 'customer-123',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
    customer: {
      id: 'customer-123',
      email: 'test@example.com',
      name: 'Test Customer',
      phone: '+1234567890'
    },
    images: [
      {
        id: 'image-1',
        url: 'https://example.com/image1.jpg',
        filename: 'reference1.jpg'
      }
    ],
    appointments: []
  };
  
  const mockAppointment = {
    id: 'appointment-123',
    startTime: new Date('2024-01-20T10:00:00Z'),
    endTime: new Date('2024-01-20T11:00:00Z'),
    duration: 60,
    status: 'scheduled',
    type: BookingType.TATTOO_SESSION,
    customerId: 'customer-123',
    artistId: 'artist-123',
    notes: 'Converted from tattoo request',
    priceQuote: 300,
    tattooRequestId: 'tattoo-request-123',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  beforeEach(async () => {
    vi.clearAllMocks();
    tattooRequestService = new TattooRequestService();
    
    // Get the mocked instances
    const { prisma } = await import('../../prisma/prisma');
    const { AppointmentService } = await import('../appointmentService');
    
    mockPrisma = prisma;
    mockAppointmentService = new AppointmentService();
    
    // Setup default mocks
    mockPrisma.tattooRequest.findUnique.mockResolvedValue(mockTattooRequest);
    mockPrisma.tattooRequest.update.mockResolvedValue(mockTattooRequest);
    mockPrisma.auditLog.create.mockResolvedValue({});
    mockAppointmentService.create.mockResolvedValue(mockAppointment);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('findById', () => {
    it('should find tattoo request by ID with all relations', async () => {
      const result = await tattooRequestService.findById('tattoo-request-123');
      
      expect(result).toEqual(mockTattooRequest);
      expect(mockPrisma.tattooRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'tattoo-request-123' },
        include: {
          customer: true,
          images: true,
          appointments: true
        }
      });
    });
    
    it('should throw NotFoundError when tattoo request does not exist', async () => {
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(null);
      
      await expect(tattooRequestService.findById('non-existent-id'))
        .rejects.toThrow(NotFoundError);
      
      await expect(tattooRequestService.findById('non-existent-id'))
        .rejects.toThrow('TattooRequest with id non-existent-id not found');
    });
    
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.tattooRequest.findUnique.mockRejectedValueOnce(dbError);
      
      await expect(tattooRequestService.findById('tattoo-request-123'))
        .rejects.toThrow('Database connection failed');
    });
  });
  
  describe('updateStatus', () => {
    it('should update tattoo request status successfully', async () => {
      const updatedRequest = {
        ...mockTattooRequest,
        status: 'approved'
      };
      
      mockPrisma.tattooRequest.update.mockResolvedValueOnce(updatedRequest);
      
      const result = await tattooRequestService.updateStatus(
        'tattoo-request-123',
        'approved',
        'user-123'
      );
      
      expect(result).toEqual(updatedRequest);
      expect(mockPrisma.tattooRequest.update).toHaveBeenCalledWith({
        where: { id: 'tattoo-request-123' },
        data: { status: 'approved' },
        include: {
          customer: true,
          images: true
        }
      });
    });
    
    it('should create audit log entry for status update', async () => {
      const updatedRequest = {
        ...mockTattooRequest,
        status: 'approved'
      };
      
      mockPrisma.tattooRequest.update.mockResolvedValueOnce(updatedRequest);
      
      await tattooRequestService.updateStatus(
        'tattoo-request-123',
        'approved',
        'user-123'
      );
      
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'tattoo_request_status_updated',
          resource: 'TattooRequest',
          resourceId: 'tattoo-request-123',
          resourceType: 'tattoo_request',
          userId: 'user-123',
          details: {
            previousStatus: 'pending',
            newStatus: 'approved'
          }
        }
      });
    });
    
    it('should work without userId', async () => {
      const updatedRequest = {
        ...mockTattooRequest,
        status: 'rejected'
      };
      
      mockPrisma.tattooRequest.update.mockResolvedValueOnce(updatedRequest);
      
      await tattooRequestService.updateStatus('tattoo-request-123', 'rejected');
      
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'tattoo_request_status_updated',
          resource: 'TattooRequest',
          resourceId: 'tattoo-request-123',
          resourceType: 'tattoo_request',
          userId: undefined,
          details: {
            previousStatus: 'pending',
            newStatus: 'rejected'
          }
        }
      });
    });
    
    it('should handle request not found during status update', async () => {
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(null);
      
      await expect(tattooRequestService.updateStatus('non-existent-id', 'approved'))
        .rejects.toThrow(NotFoundError);
    });
    
    it('should handle various status values', async () => {
      const statuses = ['pending', 'approved', 'rejected', 'in_progress', 'completed', 'deposit_paid'];
      
      for (const status of statuses) {
        const updatedRequest = { ...mockTattooRequest, status };
        mockPrisma.tattooRequest.update.mockResolvedValueOnce(updatedRequest);
        
        const result = await tattooRequestService.updateStatus('tattoo-request-123', status);
        expect(result.status).toBe(status);
      }
    });
  });
  
  describe('convertToAppointment', () => {
    const validConversionData: ConvertToAppointmentData = {
      startAt: new Date('2024-01-20T10:00:00Z'),
      duration: 120,
      artistId: 'artist-123',
      bookingType: BookingType.TATTOO_SESSION,
      priceQuote: 300,
      note: 'Converted from tattoo request'
    };
    
    it('should successfully convert approved tattoo request to appointment', async () => {
      const approvedRequest = {
        ...mockTattooRequest,
        status: 'approved'
      };
      
      mockPrisma.tattooRequest.findUnique
        .mockResolvedValueOnce(approvedRequest)
        .mockResolvedValueOnce({ ...approvedRequest, status: 'in_progress' });
      
      const result = await tattooRequestService.convertToAppointment(
        'tattoo-request-123',
        validConversionData,
        'user-123'
      );
      
      expect(result).toEqual({
        success: true,
        message: 'Tattoo request converted to appointment',
        appointment: mockAppointment,
        tattooRequest: { ...approvedRequest, status: 'in_progress' }
      });
    });
    
    it('should convert deposit_paid tattoo request without changing status', async () => {
      const depositPaidRequest = {
        ...mockTattooRequest,
        status: 'deposit_paid'
      };
      
      mockPrisma.tattooRequest.findUnique
        .mockResolvedValueOnce(depositPaidRequest)
        .mockResolvedValueOnce(depositPaidRequest);
      
      const result = await tattooRequestService.convertToAppointment(
        'tattoo-request-123',
        validConversionData
      );
      
      expect(result.success).toBe(true);
      expect(result.tattooRequest.status).toBe('deposit_paid');
      
      // Should not call updateStatus for deposit_paid requests
      expect(mockPrisma.tattooRequest.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'in_progress' }
        })
      );
    });
    
    it('should create appointment with correct parameters', async () => {
      const approvedRequest = {
        ...mockTattooRequest,
        status: 'approved'
      };
      
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(approvedRequest);
      
      await tattooRequestService.convertToAppointment(
        'tattoo-request-123',
        validConversionData,
        'user-123'
      );
      
      expect(mockAppointmentService.create).toHaveBeenCalledWith({
        startAt: validConversionData.startAt,
        duration: validConversionData.duration,
        customerId: 'customer-123',
        contactEmail: 'test@example.com',
        contactPhone: '+1234567890',
        bookingType: BookingType.TATTOO_SESSION,
        artistId: 'artist-123',
        note: 'Converted from tattoo request',
        priceQuote: 300,
        tattooRequestId: 'tattoo-request-123'
      });
    });
    
    it('should use default booking type when not provided', async () => {
      const approvedRequest = {
        ...mockTattooRequest,
        status: 'approved'
      };
      
      const conversionDataWithoutType = {
        ...validConversionData,
        bookingType: undefined
      };
      
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(approvedRequest);
      
      await tattooRequestService.convertToAppointment(
        'tattoo-request-123',
        conversionDataWithoutType
      );
      
      expect(mockAppointmentService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingType: BookingType.TATTOO_SESSION
        })
      );
    });
    
    it('should create audit log for conversion', async () => {
      const approvedRequest = {
        ...mockTattooRequest,
        status: 'approved'
      };
      
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(approvedRequest);
      
      await tattooRequestService.convertToAppointment(
        'tattoo-request-123',
        validConversionData,
        'user-123'
      );
      
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'tattoo_request_converted',
          resource: 'TattooRequest',
          resourceId: 'tattoo-request-123',
          resourceType: 'tattoo_request',
          userId: 'user-123',
          details: {
            appointmentId: 'appointment-123',
            bookingType: BookingType.TATTOO_SESSION
          }
        }
      });
    });
    
    it('should throw ValidationError for invalid status', async () => {
      const pendingRequest = {
        ...mockTattooRequest,
        status: 'pending'
      };
      
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(pendingRequest);
      
      await expect(tattooRequestService.convertToAppointment(
        'tattoo-request-123',
        validConversionData
      )).rejects.toThrow(ValidationError);
      
      await expect(tattooRequestService.convertToAppointment(
        'tattoo-request-123',
        validConversionData
      )).rejects.toThrow(
        "Tattoo request must be in status 'approved' or 'deposit_paid' to convert to appointment. Current status: pending"
      );
    });
    
    it('should throw ValidationError for rejected status', async () => {
      const rejectedRequest = {
        ...mockTattooRequest,
        status: 'rejected'
      };
      
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(rejectedRequest);
      
      await expect(tattooRequestService.convertToAppointment(
        'tattoo-request-123',
        validConversionData
      )).rejects.toThrow(ValidationError);
    });
    
    it('should handle appointment creation failure', async () => {
      const approvedRequest = {
        ...mockTattooRequest,
        status: 'approved'
      };
      
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(approvedRequest);
      mockAppointmentService.create.mockRejectedValueOnce(new Error('Appointment creation failed'));
      
      await expect(tattooRequestService.convertToAppointment(
        'tattoo-request-123',
        validConversionData
      )).rejects.toThrow('Appointment creation failed');
    });
    
    it('should handle anonymous tattoo request (no customer)', async () => {
      const anonymousRequest = {
        ...mockTattooRequest,
        customerId: null,
        customer: null,
        status: 'approved'
      };
      
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(anonymousRequest);
      
      await tattooRequestService.convertToAppointment(
        'tattoo-request-123',
        validConversionData
      );
      
      expect(mockAppointmentService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: undefined,
          contactEmail: 'test@example.com',
          contactPhone: '+1234567890'
        })
      );
    });
  });
  
  describe('list', () => {
    const mockTattooRequests = [
      { ...mockTattooRequest, id: 'request-1', status: 'pending' },
      { ...mockTattooRequest, id: 'request-2', status: 'approved' },
      { ...mockTattooRequest, id: 'request-3', status: 'completed' }
    ];
    
    beforeEach(() => {
      mockPrisma.tattooRequest.findMany.mockResolvedValue(mockTattooRequests);
      mockPrisma.tattooRequest.count.mockResolvedValue(3);
    });
    
    it('should list tattoo requests with default pagination', async () => {
      const result = await tattooRequestService.list({});
      
      expect(result).toEqual({
        data: mockTattooRequests,
        pagination: {
          total: 3,
          page: 1,
          limit: 20,
          pages: 1
        }
      });
      
      expect(mockPrisma.tattooRequest.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          customer: true,
          images: true
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
    });
    
    it('should filter by status', async () => {
      await tattooRequestService.list({ status: 'pending' });
      
      expect(mockPrisma.tattooRequest.findMany).toHaveBeenCalledWith({
        where: { status: 'pending' },
        include: {
          customer: true,
          images: true
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
      
      expect(mockPrisma.tattooRequest.count).toHaveBeenCalledWith({
        where: { status: 'pending' }
      });
    });
    
    it('should filter by customer ID', async () => {
      await tattooRequestService.list({ customerId: 'customer-123' });
      
      expect(mockPrisma.tattooRequest.findMany).toHaveBeenCalledWith({
        where: { customerId: 'customer-123' },
        include: {
          customer: true,
          images: true
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
    });
    
    it('should combine multiple filters', async () => {
      await tattooRequestService.list({
        status: 'approved',
        customerId: 'customer-123'
      });
      
      expect(mockPrisma.tattooRequest.findMany).toHaveBeenCalledWith({
        where: {
          status: 'approved',
          customerId: 'customer-123'
        },
        include: {
          customer: true,
          images: true
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
    });
    
    it('should handle custom pagination', async () => {
      await tattooRequestService.list({
        page: 2,
        limit: 10
      });
      
      expect(mockPrisma.tattooRequest.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          customer: true,
          images: true
        },
        orderBy: { createdAt: 'desc' },
        skip: 10, // (page - 1) * limit = (2 - 1) * 10 = 10
        take: 10
      });
    });
    
    it('should calculate pagination correctly', async () => {
      mockPrisma.tattooRequest.count.mockResolvedValueOnce(25);
      
      const result = await tattooRequestService.list({
        page: 3,
        limit: 10
      });
      
      expect(result.pagination).toEqual({
        total: 25,
        page: 3,
        limit: 10,
        pages: 3 // Math.ceil(25 / 10) = 3
      });
    });
    
    it('should handle page 1 correctly', async () => {
      const result = await tattooRequestService.list({
        page: 1,
        limit: 5
      });
      
      expect(mockPrisma.tattooRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0 // (1 - 1) * 5 = 0
        })
      );
    });
    
    it('should handle empty results', async () => {
      mockPrisma.tattooRequest.findMany.mockResolvedValueOnce([]);
      mockPrisma.tattooRequest.count.mockResolvedValueOnce(0);
      
      const result = await tattooRequestService.list({});
      
      expect(result).toEqual({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          pages: 0
        }
      });
    });
    
    it('should handle database errors in list operation', async () => {
      const dbError = new Error('Database query failed');
      mockPrisma.tattooRequest.findMany.mockRejectedValueOnce(dbError);
      
      await expect(tattooRequestService.list({}))
        .rejects.toThrow('Database query failed');
    });
    
    it('should handle large page numbers', async () => {
      const result = await tattooRequestService.list({
        page: 100,
        limit: 5
      });
      
      expect(mockPrisma.tattooRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 495 // (100 - 1) * 5 = 495
        })
      );
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle null values in tattoo request data', async () => {
      const requestWithNulls = {
        ...mockTattooRequest,
        contactPhone: null,
        additionalNotes: null,
        preferredArtist: null,
        customer: null
      };
      
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(requestWithNulls);
      
      const result = await tattooRequestService.findById('tattoo-request-123');
      
      expect(result).toEqual(requestWithNulls);
    });
    
    it('should handle conversion with minimal data', async () => {
      const approvedRequest = {
        ...mockTattooRequest,
        status: 'approved'
      };
      
      const minimalConversionData = {
        startAt: new Date('2024-01-20T10:00:00Z'),
        duration: 60
      };
      
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(approvedRequest);
      
      await tattooRequestService.convertToAppointment(
        'tattoo-request-123',
        minimalConversionData
      );
      
      expect(mockAppointmentService.create).toHaveBeenCalledWith({
        startAt: minimalConversionData.startAt,
        duration: minimalConversionData.duration,
        customerId: 'customer-123',
        contactEmail: 'test@example.com',
        contactPhone: '+1234567890',
        bookingType: BookingType.TATTOO_SESSION,
        artistId: undefined,
        note: undefined,
        priceQuote: undefined,
        tattooRequestId: 'tattoo-request-123'
      });
    });
    
    it('should handle concurrent status updates', async () => {
      // First update succeeds
      const firstUpdate = tattooRequestService.updateStatus('tattoo-request-123', 'approved');
      
      // Second update happens concurrently
      const secondUpdate = tattooRequestService.updateStatus('tattoo-request-123', 'rejected');
      
      await Promise.all([firstUpdate, secondUpdate]);
      
      // Both should complete without errors
      expect(mockPrisma.tattooRequest.update).toHaveBeenCalledTimes(2);
    });
  });
}); 
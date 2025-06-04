import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TattooRequestService, ConvertToAppointmentData, CreateTattooRequestData } from '../tattooRequestService';
import { NotFoundError, ValidationError } from '../errors';
import BookingService, { BookingType, BookingStatus } from '../bookingService';

// Mock prisma
vi.mock('../../prisma/prisma', () => ({
  prisma: {
    tattooRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn()
    },
    customer: {
      findUnique: vi.fn(),
      create: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

// Mock BookingService
vi.mock('../bookingService');

describe('TattooRequestService', () => {
  let tattooRequestService: TattooRequestService;
  let mockPrisma: any;
  let mockBookingService: any;
  
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
    status: 'new',
    customerId: 'customer-123',
    trackingToken: null,
    referenceImages: [],
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
  
  const mockAnonymousRequest = {
    ...mockTattooRequest,
    id: 'anonymous-123',
    customerId: null,
    customer: null,
    trackingToken: 'track-abc123',
    status: 'approved'
  };
  
  const mockAppointment = {
    id: 'appointment-123',
    startTime: new Date('2024-01-20T10:00:00Z'),
    endTime: new Date('2024-01-20T11:00:00Z'),
    duration: 60,
    status: 'confirmed',
    type: BookingType.TATTOO_SESSION,
    customerId: 'customer-123',
    artistId: 'artist-123',
    notes: 'Converted from tattoo request',
    priceQuote: 300,
    tattooRequestId: 'tattoo-request-123',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const mockCustomer = {
    id: 'customer-new-123',
    name: 'test',
    email: 'test@example.com',
    phone: '+1234567890',
    notes: 'Created from tattoo request: Traditional Japanese dragon design...'
  };
  
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked instances using dynamic imports
    const { prisma } = await import('../../prisma/prisma');
    mockPrisma = prisma;
    
    // Create mock instance for BookingService
    mockBookingService = {
      createBooking: vi.fn()
    };
    
    // Mock the BookingService constructor
    vi.mocked(BookingService).mockImplementation(() => mockBookingService);
    
    // Setup default mocks for transaction
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return await callback(mockPrisma);
    });
    
    // Setup default mocks
    mockPrisma.tattooRequest.findUnique.mockResolvedValue(mockTattooRequest);
    mockPrisma.tattooRequest.update.mockResolvedValue(mockTattooRequest);
    mockPrisma.tattooRequest.create.mockResolvedValue(mockTattooRequest);
    mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
    mockPrisma.customer.create.mockResolvedValue(mockCustomer);
    mockPrisma.auditLog.create.mockResolvedValue({});
    
    mockBookingService.createBooking.mockResolvedValue({
      success: true,
      booking: mockAppointment
    });
    
    // Create the service instance after mocks are set up
    tattooRequestService = new TattooRequestService();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('create', () => {
    const validCreateData: CreateTattooRequestData = {
      description: 'Traditional Japanese dragon design',
      contactEmail: 'test@example.com',
      contactPhone: '+1234567890',
      placement: 'Upper arm',
      size: 'Medium',
      style: 'Traditional',
      colorPreference: 'Full color'
    };
    
    it('should create anonymous tattoo request', async () => {
      const result = await tattooRequestService.create(validCreateData, 'user-123');
      
      expect(result).toEqual(mockTattooRequest);
      expect(mockPrisma.tattooRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Traditional Japanese dragon design',
          contactEmail: 'test@example.com',
          contactPhone: '+1234567890',
          placement: 'Upper arm',
          size: 'Medium',
          colorPreference: 'Full color',
          style: 'Traditional',
          purpose: undefined,
          preferredArtist: undefined,
          timeframe: undefined,
          contactPreference: undefined,
          additionalNotes: undefined,
          referenceImages: [],
          status: 'new',
          trackingToken: expect.any(String)
        }),
        include: {
          customer: true,
          images: true
        }
      });
    });
    
    it('should create authenticated tattoo request', async () => {
      const authenticatedData = {
        ...validCreateData,
        customerId: 'customer-123'
      };
      
      const result = await tattooRequestService.create(authenticatedData);
      
      expect(result).toEqual(mockTattooRequest);
      expect(mockPrisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'customer-123' }
      });
    });
    
    it('should validate required fields', async () => {
      const invalidData = {
        description: 'Short' // Less than 10 characters
      };
      
      await expect(tattooRequestService.create(invalidData as any))
        .rejects.toThrow(ValidationError);
    });
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
          appointments: {
            include: {
              artist: {
                select: { id: true, email: true, role: true }
              }
            }
          }
        }
      });
    });
    
    it('should throw NotFoundError when tattoo request does not exist', async () => {
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(null);
      
      await expect(tattooRequestService.findById('non-existent-id'))
        .rejects.toThrow(NotFoundError);
    });
  });
  
  describe('updateStatus', () => {
    it('should update tattoo request status successfully', async () => {
      const reviewedRequest = {
        ...mockTattooRequest,
        status: 'reviewed'
      };
      
      const updatedRequest = {
        ...reviewedRequest,
        status: 'approved'
      };
      
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(reviewedRequest);
      mockPrisma.tattooRequest.update.mockResolvedValueOnce(updatedRequest);
      
      const result = await tattooRequestService.updateStatus(
        'tattoo-request-123',
        'approved',
        'user-123'
      );
      
      expect(result).toEqual(updatedRequest);
    });
    
    it('should validate status transitions', async () => {
      const rejectedRequest = {
        ...mockTattooRequest,
        status: 'rejected'
      };
      
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(rejectedRequest);
      
      await expect(tattooRequestService.updateStatus('tattoo-request-123', 'reviewed'))
        .rejects.toThrow(ValidationError);
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
    
    it('should convert approved tattoo request to appointment', async () => {
      const approvedRequest = {
        ...mockTattooRequest,
        status: 'approved'
      };
      
      const convertedRequest = {
        ...approvedRequest,
        status: 'converted_to_appointment'
      };
      
      // Mock the sequence of calls
      mockPrisma.tattooRequest.findUnique
        .mockResolvedValueOnce(approvedRequest)  // Initial find
        .mockResolvedValueOnce(approvedRequest)  // Find in updateStatus  
        .mockResolvedValueOnce(convertedRequest); // Final find
      
      mockPrisma.tattooRequest.update.mockResolvedValueOnce(convertedRequest);
      
      const result = await tattooRequestService.convertToAppointment(
        'tattoo-request-123',
        validConversionData,
        'user-123'
      );
      
      expect(result).toEqual({
        success: true,
        message: 'Tattoo request successfully converted to appointment',
        appointment: mockAppointment,
        customer: 'customer-123',
        tattooRequest: convertedRequest
      });
      
      expect(mockBookingService.createBooking).toHaveBeenCalledWith({
        startAt: validConversionData.startAt,
        duration: validConversionData.duration,
        customerId: 'customer-123',
        bookingType: BookingType.TATTOO_SESSION,
        artistId: 'artist-123',
        note: 'Converted from tattoo request',
        priceQuote: 300,
        status: BookingStatus.CONFIRMED,
        tattooRequestId: 'tattoo-request-123'
      });
    });
    
    it('should create customer for anonymous request', async () => {
      mockPrisma.tattooRequest.findUnique
        .mockResolvedValueOnce(mockAnonymousRequest)
        .mockResolvedValueOnce(mockAnonymousRequest)
        .mockResolvedValueOnce({...mockAnonymousRequest, status: 'converted_to_appointment'});
      
      await tattooRequestService.convertToAppointment(
        'anonymous-123',
        validConversionData,
        'user-123'
      );
      
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: {
          name: 'test',
          email: 'test@example.com',
          phone: '+1234567890',
          notes: 'Created from tattoo request: Traditional Japanese dragon design...'
        }
      });
    });
    
    it('should throw ValidationError for invalid status', async () => {
      const newRequest = {
        ...mockTattooRequest,
        status: 'new'
      };
      
      mockPrisma.tattooRequest.findUnique.mockResolvedValueOnce(newRequest);
      
      await expect(tattooRequestService.convertToAppointment(
        'tattoo-request-123',
        validConversionData
      )).rejects.toThrow(ValidationError);
    });
  });
  
  describe('list', () => {
    const mockTattooRequests = [
      { ...mockTattooRequest, id: 'request-1', status: 'new' },
      { ...mockTattooRequest, id: 'request-2', status: 'approved' }
    ];
    
    beforeEach(() => {
      mockPrisma.tattooRequest.findMany.mockResolvedValue(mockTattooRequests);
      mockPrisma.tattooRequest.count.mockResolvedValue(2);
    });
    
    it('should list tattoo requests with pagination', async () => {
      const result = await tattooRequestService.list({});
      
      expect(result).toEqual({
        data: mockTattooRequests,
        pagination: {
          total: 2,
          page: 1,
          limit: 20,
          pages: 1
        }
      });
    });
    
    it('should filter by status', async () => {
      await tattooRequestService.list({ status: 'new' });
      
      expect(mockPrisma.tattooRequest.findMany).toHaveBeenCalledWith({
        where: { status: 'new' },
        include: {
          customer: {
            select: { id: true, name: true, email: true }
          },
          images: true
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20
      });
    });
  });
}); 
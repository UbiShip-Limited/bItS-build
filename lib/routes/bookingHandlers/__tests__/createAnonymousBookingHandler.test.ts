import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAnonymousBookingHandler, createAnonymousBookingSchema } from '../createAnonymousBookingHandler';
import { BookingType } from '../../../services/bookingService';
import { prisma } from '../../../prisma/prisma';

// Type definitions for mocks
interface MockBookingService {
  createBooking: ReturnType<typeof vi.fn>;
}

interface MockRequest {
  body: {
    startAt: string;
    duration: number;
    bookingType: BookingType;
    contactEmail: string;
    contactPhone?: string;
    note?: string;
    tattooRequestId?: string;
  };
  log: {
    error: ReturnType<typeof vi.fn>;
  };
}

interface MockReply {
  code: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
}

interface MockFastifyInstance {
  bookingService: MockBookingService;
}

// Mock dependencies
vi.mock('../../../services/bookingService');
vi.mock('../../../prisma/prisma', () => ({
  prisma: {
    tattooRequest: {
      findUnique: vi.fn()
    }
  }
}));

describe('createAnonymousBookingHandler', () => {
  let mockBookingService: MockBookingService;
  let mockRequest: MockRequest;
  let mockReply: MockReply;
  let fastifyInstance: MockFastifyInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    mockBookingService = {
      createBooking: vi.fn()
    };

    fastifyInstance = {
      bookingService: mockBookingService
    };

    mockRequest = {
      body: {
        startAt: '2024-01-15T10:00:00Z',
        duration: 60,
        bookingType: BookingType.CONSULTATION,
        contactEmail: 'anonymous@example.com',
        contactPhone: '+1234567890',
        note: 'Anonymous booking note',
        tattooRequestId: 'tattoo-123'
      },
      log: {
        error: vi.fn()
      }
    };

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn()
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Schema Validation', () => {
    it('should have correct required fields', () => {
      expect(createAnonymousBookingSchema.body.required).toEqual([
        'startAt',
        'duration',
        'bookingType',
        'contactEmail'
      ]);
    });

    it('should only allow consultation booking types for anonymous bookings', () => {
      expect(createAnonymousBookingSchema.body.properties.bookingType.enum).toEqual([
        BookingType.CONSULTATION,
        BookingType.DRAWING_CONSULTATION
      ]);
    });

    it('should require contactEmail format validation', () => {
      expect(createAnonymousBookingSchema.body.properties.contactEmail.format).toBe('email');
    });

    it('should have minimum duration of 15 minutes', () => {
      expect(createAnonymousBookingSchema.body.properties.duration.minimum).toBe(15);
    });
  });

  describe('Tattoo Request Validation', () => {
    it('should create anonymous booking without tattoo request', async () => {
      delete mockRequest.body.tattooRequestId;
      
      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: 'booking-123' }
      });

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Anonymous booking created successfully');
      expect(result.trackingCode).toBe('booking-123');
      expect(prisma.tattooRequest.findUnique).not.toHaveBeenCalled();
    });

    it('should validate tattoo request exists', async () => {
      vi.mocked(prisma.tattooRequest.findUnique).mockResolvedValueOnce(null);

      await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Tattoo request not found'
      });
      expect(mockBookingService.createBooking).not.toHaveBeenCalled();
    });

    it('should reject tattoo request belonging to registered customer', async () => {
      vi.mocked(prisma.tattooRequest.findUnique).mockResolvedValueOnce({
        id: 'tattoo-123',
        customerId: 'customer-123',
        contactEmail: 'anonymous@example.com'
      });

      await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'This tattoo request belongs to a registered customer and requires authentication'
      });
      expect(mockBookingService.createBooking).not.toHaveBeenCalled();
    });

    it('should validate contact email matches tattoo request', async () => {
      vi.mocked(prisma.tattooRequest.findUnique).mockResolvedValueOnce({
        id: 'tattoo-123',
        customerId: null,
        contactEmail: 'different@example.com'
      });

      await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Email does not match the tattoo request contact email'
      });
      expect(mockBookingService.createBooking).not.toHaveBeenCalled();
    });

    it('should allow anonymous tattoo request with matching email', async () => {
      vi.mocked(prisma.tattooRequest.findUnique).mockResolvedValueOnce({
        id: 'tattoo-123',
        customerId: null,
        contactEmail: 'anonymous@example.com'
      });

      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: 'booking-123' }
      });

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(result.success).toBe(true);
      expect(mockBookingService.createBooking).toHaveBeenCalled();
    });

    it('should allow anonymous tattoo request without contact email', async () => {
      vi.mocked(prisma.tattooRequest.findUnique).mockResolvedValueOnce({
        id: 'tattoo-123',
        customerId: null,
        contactEmail: null
      });

      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: 'booking-123' }
      });

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(result.success).toBe(true);
      expect(mockBookingService.createBooking).toHaveBeenCalled();
    });
  });

  describe('Booking Creation', () => {
    it('should create anonymous booking with all fields', async () => {
      vi.mocked(prisma.tattooRequest.findUnique).mockResolvedValueOnce({
        id: 'tattoo-123',
        customerId: null,
        contactEmail: 'anonymous@example.com'
      });

      const expectedBooking = {
        id: 'booking-123',
        startTime: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        contactEmail: 'anonymous@example.com'
      };

      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: expectedBooking
      });

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(result).toEqual({
        success: true,
        message: 'Anonymous booking created successfully',
        trackingCode: 'booking-123',
        booking: expectedBooking
      });

      expect(mockBookingService.createBooking).toHaveBeenCalledWith({
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        bookingType: BookingType.CONSULTATION,
        contactEmail: 'anonymous@example.com',
        contactPhone: '+1234567890',
        note: 'Anonymous booking note',
        tattooRequestId: 'tattoo-123'
      });
    });

    it('should handle booking service failure', async () => {
      mockBookingService.createBooking.mockResolvedValueOnce({
        success: false,
        error: 'Time slot not available'
      });

      await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create booking',
        error: 'Time slot not available'
      });
    });

    it('should handle booking service errors gracefully', async () => {
      mockBookingService.createBooking.mockRejectedValueOnce(new Error('Database error'));

      await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'An error occurred while creating the booking. Please try again.'
      });
    });

    it('should handle missing booking service', async () => {
      const instanceWithoutService = {};

      await createAnonymousBookingHandler.call(instanceWithoutService, mockRequest, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'An error occurred while creating the booking. Please try again.'
      });
    });

    it('should create booking without optional fields', async () => {
      mockRequest.body = {
        startAt: '2024-01-15T10:00:00Z',
        duration: 60,
        bookingType: BookingType.CONSULTATION,
        contactEmail: 'anonymous@example.com'
      };

      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: 'booking-123' }
      });

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(result.success).toBe(true);
      expect(mockBookingService.createBooking).toHaveBeenCalledWith({
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        bookingType: BookingType.CONSULTATION,
        contactEmail: 'anonymous@example.com'
      });
    });

    it('should handle drawing consultation booking type', async () => {
      mockRequest.body.bookingType = BookingType.DRAWING_CONSULTATION;

      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: 'booking-123' }
      });

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(result.success).toBe(true);
      expect(mockBookingService.createBooking).toHaveBeenCalledWith(expect.objectContaining({
        bookingType: BookingType.DRAWING_CONSULTATION
      }));
    });

    it('should handle database errors when checking tattoo request', async () => {
      vi.mocked(prisma.tattooRequest.findUnique).mockRejectedValueOnce(new Error('Database error'));

      await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'An error occurred while creating the booking. Please try again.'
      });
    });
  });
}); 
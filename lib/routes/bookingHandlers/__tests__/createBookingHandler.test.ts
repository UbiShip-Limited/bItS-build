import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBookingHandler, createBookingSchema } from '../createBookingHandler';
import { BookingType, BookingStatus } from '../../../services/bookingService';

// Type definitions for mocks
interface MockBookingService {
  createBooking: ReturnType<typeof vi.fn>;
}

interface MockRequest {
  body: {
    startAt: string;
    duration: number;
    customerId?: string;
    bookingType: BookingType;
    artistId?: string;
    customerEmail?: string;
    customerPhone?: string;
    note?: string;
    priceQuote?: number;
    status?: BookingStatus;
    tattooRequestId?: string;
  };
  user: {
    id: string;
    role: string;
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

// Mock BookingService
vi.mock('../../../services/bookingService');

describe('createBookingHandler', () => {
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
        customerId: 'customer-123',
        bookingType: BookingType.CONSULTATION,
        artistId: 'artist-123',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
        note: 'Test booking',
        priceQuote: 100,
        status: BookingStatus.SCHEDULED,
        tattooRequestId: 'tattoo-123'
      },
      user: {
        id: 'user-123',
        role: 'admin'
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
    it('should have correct schema for required fields', () => {
      expect(createBookingSchema.body.required).toEqual([
        'startAt',
        'duration', 
        'bookingType'
      ]);
    });

    it('should validate booking type enum', () => {
      expect(createBookingSchema.body.properties.bookingType.enum).toEqual([
        BookingType.CONSULTATION,
        BookingType.DRAWING_CONSULTATION,
        BookingType.TATTOO_SESSION
      ]);
    });

    it('should require either customerId or customerEmail', () => {
      expect(createBookingSchema.body.oneOf).toEqual([
        { required: ['customerId'] },
        { required: ['customerEmail'] }
      ]);
    });
  });

  describe('Authorization', () => {
    it('should allow admin to book any artist', async () => {
      mockRequest.user = { id: 'admin-123', role: 'admin' };
      mockRequest.body.artistId = 'any-artist-123';
      
      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: 'booking-123' },
        squareBooking: null
      });

      const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(result.success).toBe(true);
      expect(mockBookingService.createBooking).toHaveBeenCalled();
    });

    it('should allow artist to book themselves', async () => {
      mockRequest.user = { id: 'artist-123', role: 'artist' };
      mockRequest.body.artistId = 'artist-123';
      
      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: 'booking-123' },
        squareBooking: null
      });

      const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(result.success).toBe(true);
      expect(mockBookingService.createBooking).toHaveBeenCalled();
    });

    it('should deny artist booking another artist', async () => {
      mockRequest.user = { id: 'artist-123', role: 'artist' };
      mockRequest.body.artistId = 'another-artist-456';

      await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(403);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'You do not have permission to book this artist'
      });
      expect(mockBookingService.createBooking).not.toHaveBeenCalled();
    });

    it('should allow booking without artistId', async () => {
      mockRequest.user = { id: 'user-123', role: 'customer' };
      delete mockRequest.body.artistId;
      
      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: 'booking-123' },
        squareBooking: null
      });

      const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(result.success).toBe(true);
      expect(mockBookingService.createBooking).toHaveBeenCalled();
    });
  });

  describe('Booking Creation', () => {
    it('should create booking successfully', async () => {
      const expectedBooking = {
        id: 'booking-123',
        startTime: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        customerId: 'customer-123'
      };

      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: expectedBooking,
        squareBooking: { id: 'square-123' }
      });

      const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(result).toEqual({
        success: true,
        message: 'Booking created successfully',
        booking: expectedBooking,
        squareBooking: { id: 'square-123' }
      });

      expect(mockBookingService.createBooking).toHaveBeenCalledWith({
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        customerId: 'customer-123',
        bookingType: BookingType.CONSULTATION,
        artistId: 'artist-123',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
        note: 'Test booking',
        priceQuote: 100,
        status: BookingStatus.SCHEDULED,
        tattooRequestId: 'tattoo-123'
      });
    });

    it('should handle booking creation with minimal data', async () => {
      mockRequest.body = {
        startAt: '2024-01-15T10:00:00Z',
        duration: 60,
        bookingType: BookingType.CONSULTATION,
        customerEmail: 'test@example.com'
      };

      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: 'booking-123' },
        squareBooking: null
      });

      const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(result.success).toBe(true);
      expect(mockBookingService.createBooking).toHaveBeenCalledWith({
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        bookingType: BookingType.CONSULTATION,
        customerEmail: 'test@example.com'
      });
    });

    it('should handle booking service failure', async () => {
      mockBookingService.createBooking.mockResolvedValueOnce({
        success: false,
        error: 'Time slot not available'
      });

      await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create booking',
        error: 'Time slot not available'
      });
    });

    it('should handle booking service errors gracefully', async () => {
      mockBookingService.createBooking.mockRejectedValueOnce(new Error('Database error'));

      await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'An error occurred while creating the booking. Please try again.'
      });
    });

    it('should handle different booking types', async () => {
      mockRequest.body.bookingType = BookingType.TATTOO_SESSION;

      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: 'booking-123' },
        squareBooking: null
      });

      const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(result.success).toBe(true);
      expect(mockBookingService.createBooking).toHaveBeenCalledWith(expect.objectContaining({
        bookingType: BookingType.TATTOO_SESSION
      }));
    });

    it('should handle missing booking service', async () => {
      const instanceWithoutService = {};

      await createBookingHandler.call(instanceWithoutService, mockRequest, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalled();
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'An error occurred while creating the booking. Please try again.'
      });
    });
  });
}); 
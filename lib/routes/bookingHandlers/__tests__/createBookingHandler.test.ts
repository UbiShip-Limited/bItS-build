import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { createBookingHandler, createBookingSchema } from '../createBookingHandler';
import { BookingType, BookingStatus } from '../../../services/bookingService';
import BookingService from '../../../services/bookingService';

// Mock BookingService
vi.mock('../../../services/bookingService');

describe('createBookingHandler', () => {
  let mockBookingService: any;
  let mockRequest: any;
  let mockReply: any;
  let fastifyInstance: any;

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

      const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

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
        customerId: undefined,
        bookingType: BookingType.CONSULTATION,
        artistId: undefined,
        customerEmail: 'test@example.com',
        customerPhone: undefined,
        note: undefined,
        priceQuote: undefined,
        status: undefined,
        tattooRequestId: undefined
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle "not found" errors with 404 status', async () => {
      mockBookingService.createBooking.mockRejectedValueOnce(
        new Error('Customer not found')
      );

      const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Customer not found'
      });
      expect(mockRequest.log.error).toHaveBeenCalled();
    });

    it('should handle tattoo request validation errors with 400 status', async () => {
      mockBookingService.createBooking.mockRejectedValueOnce(
        new Error('Tattoo request does not belong to this customer')
      );

      const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Tattoo request does not belong to this customer'
      });
    });

    it('should handle availability errors with 500 status', async () => {
      mockBookingService.createBooking.mockRejectedValueOnce(
        new Error('Selected time slot is not available')
      );

      const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating booking',
        error: 'Selected time slot is not available'
      });
    });

    it('should handle unknown errors with 500 status', async () => {
      mockBookingService.createBooking.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating booking',
        error: 'Database connection failed'
      });
    });

    it('should handle non-Error objects', async () => {
      mockBookingService.createBooking.mockRejectedValueOnce('String error');

      const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating booking',
        error: 'Unknown error'
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing user object', async () => {
      delete mockRequest.user;
      mockRequest.body.artistId = 'artist-123';

      const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating booking',
        error: expect.any(String)
      });
    });

    it('should handle different booking types', async () => {
      const bookingTypes = [
        BookingType.CONSULTATION,
        BookingType.DRAWING_CONSULTATION,
        BookingType.TATTOO_SESSION
      ];

      for (const bookingType of bookingTypes) {
        mockRequest.body.bookingType = bookingType;
        
        mockBookingService.createBooking.mockResolvedValueOnce({
          success: true,
          booking: { id: 'booking-123', type: bookingType },
          squareBooking: null
        });

        const result = await createBookingHandler.call(fastifyInstance, mockRequest, mockReply);
        
        expect(result.success).toBe(true);
        expect(mockBookingService.createBooking).toHaveBeenCalledWith(
          expect.objectContaining({
            bookingType
          })
        );
      }
    });
  });
}); 
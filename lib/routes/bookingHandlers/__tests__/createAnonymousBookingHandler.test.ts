import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FastifyRequest, FastifyReply } from 'fastify';
import { createAnonymousBookingHandler, createAnonymousBookingSchema } from '../createAnonymousBookingHandler';
import { BookingType } from '../../../services/bookingService';
import BookingService from '../../../services/bookingService';
import { prisma } from '../../../prisma/prisma';

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

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

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

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

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

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

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
        booking: expectedBooking,
        trackingCode: 'booking-123'
      });

      expect(mockBookingService.createBooking).toHaveBeenCalledWith({
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        bookingType: BookingType.CONSULTATION,
        contactEmail: 'anonymous@example.com',
        contactPhone: '+1234567890',
        note: 'Anonymous booking note',
        tattooRequestId: 'tattoo-123',
        isAnonymous: true
      });
    });

    it('should create anonymous booking with minimal fields', async () => {
      mockRequest.body = {
        startAt: '2024-01-15T10:00:00Z',
        duration: 60,
        bookingType: BookingType.CONSULTATION,
        contactEmail: 'minimal@example.com'
      };

      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: 'booking-456' }
      });

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(result.success).toBe(true);
      expect(mockBookingService.createBooking).toHaveBeenCalledWith({
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        bookingType: BookingType.CONSULTATION,
        contactEmail: 'minimal@example.com',
        contactPhone: undefined,
        note: undefined,
        tattooRequestId: undefined,
        isAnonymous: true
      });
    });

    it('should handle different booking types', async () => {
      const bookingTypes = [
        BookingType.CONSULTATION,
        BookingType.DRAWING_CONSULTATION
      ];

      for (const bookingType of bookingTypes) {
        vi.clearAllMocks(); // Clear mocks between iterations
        
        mockRequest.body.bookingType = bookingType;
        delete mockRequest.body.tattooRequestId; // Remove tattoo request to avoid validation
        
        mockBookingService.createBooking.mockResolvedValueOnce({
          success: true,
          booking: { id: 'booking-123', type: bookingType }
        });

        const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);
        
        expect(result.success).toBe(true);
        expect(mockBookingService.createBooking).toHaveBeenCalledWith(
          expect.objectContaining({
            bookingType
          })
        );
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle "not found" errors with 404 status', async () => {
      delete mockRequest.body.tattooRequestId; // Remove tattoo request to avoid validation
      
      mockBookingService.createBooking.mockRejectedValueOnce(
        new Error('Service not found')
      );

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(404);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Service not found'
      });
      expect(mockRequest.log.error).toHaveBeenCalled();
    });

    it('should handle booking service errors with 500 status', async () => {
      delete mockRequest.body.tattooRequestId; // Remove tattoo request to avoid validation
      
      mockBookingService.createBooking.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating anonymous booking',
        error: 'Database connection failed'
      });
    });

    it('should handle prisma errors during tattoo request validation', async () => {
      vi.mocked(prisma.tattooRequest.findUnique).mockRejectedValueOnce(
        new Error('Database query failed')
      );

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating anonymous booking',
        error: 'Database query failed'
      });
      expect(mockRequest.log.error).toHaveBeenCalled();
    });

    it('should handle non-Error objects', async () => {
      delete mockRequest.body.tattooRequestId; // Remove tattoo request to avoid validation
      
      mockBookingService.createBooking.mockRejectedValueOnce('String error');

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);

      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating anonymous booking',
        error: 'Unknown error'
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long contact information', async () => {
      mockRequest.body.contactEmail = 'a'.repeat(100) + '@example.com';
      mockRequest.body.contactPhone = '+1' + '2'.repeat(20);
      mockRequest.body.note = 'x'.repeat(1000);
      delete mockRequest.body.tattooRequestId; // Remove tattoo request to avoid validation

      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: 'booking-123' }
      });

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);
      
      expect(result.success).toBe(true);
    });

    it('should handle special characters in contact information', async () => {
      mockRequest.body.contactEmail = 'test+tag@example-domain.co.uk';
      mockRequest.body.note = 'Special chars: àáâãäåæçèéêë & symbols!@#$%^&*()';
      delete mockRequest.body.tattooRequestId; // Remove tattoo request to avoid validation

      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: 'booking-123' }
      });

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);
      
      expect(result.success).toBe(true);
      expect(mockBookingService.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          contactEmail: 'test+tag@example-domain.co.uk',
          note: 'Special chars: àáâãäåæçèéêë & symbols!@#$%^&*()'
        })
      );
    });

    it('should use booking ID as tracking code', async () => {
      const uniqueBookingId = 'unique-booking-id-123';
      delete mockRequest.body.tattooRequestId; // Remove tattoo request to avoid validation
      
      mockBookingService.createBooking.mockResolvedValueOnce({
        success: true,
        booking: { id: uniqueBookingId }
      });

      const result = await createAnonymousBookingHandler.call(fastifyInstance, mockRequest, mockReply);
      
      expect(result.trackingCode).toBe(uniqueBookingId);
    });
  });
}); 
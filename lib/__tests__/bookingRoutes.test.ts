import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient, mockBookingService } from '../../jest.setup.mjs';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bookingRoutes from '../routes/booking';
import { BookingType, BookingStatus } from '../services/bookingService';

// Mock the actual auth middleware functions
jest.mock('./lib/middleware/auth', () => ({
  __esModule: true,
  authenticate: jest.fn((request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => {
    // Simulate successful authentication and attach a default test user
    // @ts-ignore old fastify versions
    request.user = { id: 'test-user-id', role: 'admin' }; // Default to admin
    done();
  }),
  authorize: jest.fn((roles: string[]) => (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => {
    // Simulate successful authorization
    done();
  }),
}));

// Setup test server
const setupTestServer = async () => {
  const Fastify = (await import('fastify')).default;
  const fastify = Fastify();
  
  // bookingService will be decorated by the plugin when registered.
  // The mock for BookingService constructor (../../services/bookingService.js)
  // should ensure mockBookingService is used when `new BookingService()` is called.

  await fastify.register(bookingRoutes, { prefix: '/bookings' });
  return fastify;
};

// At the top with other mocks:
jest.mock('../services/bookingService.js', () => ({
  __esModule: true,
  // Ensure mockBookingService is part of the mock, and its methods return values
  // that include contactEmail and contactPhone where appropriate.
  default: jest.fn().mockImplementation(() => mockBookingService), 
  BookingType: (jest.requireActual('../services/bookingService.js') as any).BookingType, // Keep actual enums
  BookingStatus: (jest.requireActual('../services/bookingService.js') as any).BookingStatus,
}));

describe('Booking Routes', () => {
  let fastify: FastifyInstance;
  
  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup Prisma mock responses
    mockPrismaClient.customer.findUnique.mockImplementation((args: any) => {
      if (args.where.id === 'test-customer-id') {
        return Promise.resolve({
          id: 'test-customer-id',
          name: 'Test Customer',
          email: 'test@example.com'
        });
      }
      return Promise.resolve(null);
    });
    
    mockPrismaClient.user.findUnique.mockImplementation((args: any) => {
      if (args.where.id === 'test-artist-id') {
        return Promise.resolve({
          id: 'test-artist-id',
          name: 'Test Artist',
          role: 'artist'
        });
      }
      return Promise.resolve(null);
    });
    
    mockPrismaClient.tattooRequest.findUnique.mockImplementation((args: any) => {
      if (args.where.id === 'test-tattoo-request') {
        return Promise.resolve({
          id: 'test-tattoo-request',
          customerId: 'test-customer-id',
          description: 'Test tattoo request'
        });
      }
      return Promise.resolve(null);
    });
    
    mockPrismaClient.appointment.findMany.mockResolvedValue([
      {
        id: 'test-booking-id',
        customerId: 'test-customer-id',
        startTime: new Date('2023-06-15T14:00:00Z'),
        endTime: new Date('2023-06-15T15:00:00Z'),
        status: 'scheduled',
        type: 'consultation',
        contactEmail: null,
        contactPhone: null,
      }
    ]);
    
    mockPrismaClient.appointment.count.mockResolvedValue(1);
    
    mockPrismaClient.appointment.findUnique.mockImplementation((args: any) => {
      if (args.where.id === 'test-booking-id') {
        return Promise.resolve({
          id: 'test-booking-id',
          customerId: 'test-customer-id',
          startTime: new Date('2023-06-15T14:00:00Z'),
          endTime: new Date('2023-06-15T15:00:00Z'),
          status: 'scheduled',
          type: 'consultation',
          contactEmail: null,
          contactPhone: null,
          squareId: 'test-square-booking-id',
        });
      }
      return Promise.resolve(null);
    });
    
    mockPrismaClient.appointment.update.mockImplementation((args: any) => {
      return Promise.resolve({
        id: args.where.id,
        ...args.data,
        customerId: 'test-customer-id',
        artistId: args.data.artistId || 'test-artist-id',
        contactEmail: args.data.contactEmail === undefined ? null : args.data.contactEmail,
        contactPhone: args.data.contactPhone === undefined ? null : args.data.contactPhone,
      });
    });
    
    mockPrismaClient.auditLog.create.mockResolvedValue({
      id: 'test-audit-id'
    });
    
    // Mock the BookingService methods
    mockBookingService.createBooking.mockImplementation(async (data: any) => {
      return {
        success: true,
        booking: {
          id: 'test-booking-id',
          startTime: new Date(data.startAt),
          endTime: new Date(new Date(data.startAt).getTime() + data.duration * 60000),
          status: data.status || 'scheduled',
          type: data.bookingType,
          customerId: data.customerId || null,
          artistId: data.artistId || 'test-artist-id',
          note: data.note || '',
          contactEmail: data.contactEmail || null,
          contactPhone: data.contactPhone || null,
        },
        squareBooking: {
          id: 'test-square-booking-id'
        },
      };
    });
    
    mockBookingService.cancelBooking.mockResolvedValue({
      success: true,
      booking: {
        id: 'test-booking-id',
        status: 'cancelled'
      },
      squareCancelled: true
    });
    
    fastify = await setupTestServer();
  });
  
  afterEach(async () => {
    await fastify.close();
  });
  
  describe('POST /bookings', () => {
    it('should create a new booking successfully', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          startAt: '2023-06-15T14:00:00Z',
          duration: 60,
          customerId: 'test-customer-id',
          bookingType: BookingType.CONSULTATION,
          artistId: 'test-artist-id',
          note: 'Test booking'
        }
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Booking created successfully');
      expect(result.booking).toBeDefined();
    });
    
    it('should return 404 if customer is not found', async () => {
      mockPrismaClient.customer.findUnique.mockResolvedValueOnce(null);
      
      const response = await fastify.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          startAt: '2023-06-15T14:00:00Z',
          duration: 60,
          customerId: 'non-existent-customer',
          bookingType: BookingType.CONSULTATION
        }
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(404);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Customer not found');
    });
    
    it('should return 404 if artist is not found', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValueOnce(null);
      
      const response = await fastify.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          startAt: '2023-06-15T14:00:00Z',
          duration: 60,
          customerId: 'test-customer-id',
          artistId: 'non-existent-artist',
          bookingType: BookingType.CONSULTATION
        }
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(404);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Artist not found');
    });
    
    it('should validate tattoo request ownership', async () => {
      // Tattoo request belongs to a different customer
      mockPrismaClient.tattooRequest.findUnique.mockResolvedValueOnce({
        id: 'test-tattoo-request',
        customerId: 'different-customer-id',
        description: 'Test tattoo request'
      });
      
      const response = await fastify.inject({
        method: 'POST',
        url: '/bookings',
        payload: {
          startAt: '2023-06-15T14:00:00Z',
          duration: 60,
          customerId: 'test-customer-id',
          bookingType: BookingType.TATTOO_SESSION,
          tattooRequestId: 'test-tattoo-request'
        }
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(400);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Tattoo request does not belong to this customer');
    });
  });
  
  describe('GET /bookings', () => {
    it('should list bookings with pagination', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/bookings',
        query: {
          page: '1',
          limit: '20'
        }
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
    });
  });
  
  describe('GET /bookings/:id', () => {
    it('should get a specific booking by ID', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/bookings/test-booking-id'
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);
      expect(result.booking).toBeDefined();
    });
    
    it('should return 404 if booking is not found', async () => {
      mockPrismaClient.appointment.findUnique.mockResolvedValueOnce(null);
      
      const response = await fastify.inject({
        method: 'GET',
        url: '/bookings/non-existent-booking'
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(404);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Booking not found');
    });
  });
  
  describe('PUT /bookings/:id', () => {
    it('should update a booking successfully', async () => {
      const response = await fastify.inject({
        method: 'PUT',
        url: '/bookings/test-booking-id',
        payload: {
          startTime: '2023-06-15T16:00:00Z',
          duration: 90,
          status: 'confirmed',
          artistId: 'test-artist-id',
          notes: 'Updated notes',
          priceQuote: 150
        }
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);
    });
  });

  describe('POST /bookings/:id/cancel', () => {
    it('should cancel a booking successfully', async () => {
      // Mock appointment with Square ID
      mockPrismaClient.appointment.findUnique.mockResolvedValueOnce({
        id: 'test-booking-id',
        customerId: 'test-customer-id',
        artistId: 'test-artist-id',
        startTime: new Date('2023-06-15T14:00:00Z'),
        endTime: new Date('2023-06-15T15:00:00Z'),
        status: 'scheduled',
        type: 'consultation',
        squareId: 'test-square-booking-id'
      });
      
      const response = await fastify.inject({
        method: 'POST',
        url: '/bookings/test-booking-id/cancel',
        payload: {
          reason: 'Customer requested cancellation',
          notifyCustomer: true
        }
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);
    });
  });
  
  describe('POST /bookings/anonymous', () => {
    it('should create an anonymous booking successfully', async () => {
      const anonymousBookingData = {
        startAt: '2023-06-15T14:00:00Z',
        duration: 60,
        bookingType: BookingType.CONSULTATION,
        contactEmail: 'anonymous@example.com',
        contactPhone: '123-456-7890',
        note: 'Anonymous consultation'
      };

      mockBookingService.createBooking.mockImplementationOnce(async (data: any) => {
        return {
          success: true,
          booking: {
            id: 'anonymous-booking-id',
            startTime: new Date(data.startAt),
            endTime: new Date(new Date(data.startAt).getTime() + data.duration * 60000),
            status: 'scheduled',
            type: data.bookingType,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            note: data.note,
          },
        };
      });
      
      const response = await fastify.inject({
        method: 'POST',
        url: '/bookings/anonymous',
        payload: anonymousBookingData
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);
      expect(result.booking).toBeDefined();
      expect(result.booking.id).toBe('anonymous-booking-id');
      expect(result.booking.contactEmail).toBe(anonymousBookingData.contactEmail);
      expect(result.booking.contactPhone).toBe(anonymousBookingData.contactPhone);
    });
  });
}); 
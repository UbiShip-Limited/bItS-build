import { jest } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import bookingRoutes from '../routes/booking.js';
import BookingService, { BookingType, BookingStatus } from '../services/bookingService.js';
import { prisma } from '../prisma/prisma.js';

// Mock dependencies
jest.mock('../services/bookingService.js');
jest.mock('../prisma/prisma.js', () => {
  return {
    prisma: {
      customer: {
        findUnique: jest.fn()
      },
      user: {
        findUnique: jest.fn()
      },
      tattooRequest: {
        findUnique: jest.fn()
      },
      appointment: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn()
      },
      auditLog: {
        create: jest.fn()
      }
    }
  };
});

// Setup test server
const setupTestServer = async () => {
  const fastify = require('fastify')();
  
  // Mock authentication
  fastify.addHook('preHandler', (request, reply, done) => {
    request.user = { id: 'test-user-id', role: 'admin' };
    done();
  });
  
  await fastify.register(bookingRoutes, { prefix: '/bookings' });
  return fastify;
};

describe('Booking Routes', () => {
  let fastify: FastifyInstance;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    fastify = await setupTestServer();
    
    // Mock BookingService implementation
    (BookingService as unknown as jest.Mock).mockImplementation(() => {
      return {
        createBooking: jest.fn().mockResolvedValue({
          success: true,
          booking: {
            id: 'test-booking-id',
            startTime: new Date('2023-06-15T14:00:00Z'),
            endTime: new Date('2023-06-15T15:00:00Z'),
            status: 'scheduled',
            type: 'consultation',
            customerId: 'test-customer-id'
          },
          squareBooking: {
            id: 'test-square-booking-id'
          }
        }),
        updateBooking: jest.fn().mockResolvedValue({
          success: true,
          booking: {
            id: 'test-booking-id',
            status: 'confirmed'
          }
        }),
        getBookingAvailability: jest.fn().mockResolvedValue({
          success: true,
          date: '2023-06-15',
          availableSlots: []
        })
      };
    });
    
    // Mock prisma responses
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-customer-id',
      name: 'Test Customer',
      email: 'test@example.com'
    });
    
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-artist-id',
      name: 'Test Artist',
      role: 'artist'
    });
    
    (prisma.tattooRequest.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-tattoo-request',
      customerId: 'test-customer-id',
      description: 'Test tattoo request'
    });
    
    (prisma.appointment.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'test-booking-id',
        customerId: 'test-customer-id',
        startTime: new Date('2023-06-15T14:00:00Z'),
        endTime: new Date('2023-06-15T15:00:00Z'),
        status: 'scheduled',
        type: 'consultation'
      }
    ]);
    
    (prisma.appointment.count as jest.Mock).mockResolvedValue(1);
    
    (prisma.appointment.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-booking-id',
      customerId: 'test-customer-id',
      startTime: new Date('2023-06-15T14:00:00Z'),
      endTime: new Date('2023-06-15T15:00:00Z'),
      status: 'scheduled',
      type: 'consultation'
    });
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
      
      // Verify BookingService was called with correct parameters
      const bookingServiceInstance = (BookingService as unknown as jest.Mock).mock.instances[0];
      expect(bookingServiceInstance.createBooking).toHaveBeenCalledWith({
        startAt: expect.any(Date),
        duration: 60,
        customerId: 'test-customer-id',
        bookingType: BookingType.CONSULTATION,
        artistId: 'test-artist-id',
        note: 'Test booking',
        customerEmail: undefined,
        customerPhone: undefined,
        priceQuote: undefined,
        status: undefined,
        tattooRequestId: undefined
      });
    });
    
    it('should return 404 if customer is not found', async () => {
      (prisma.customer.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
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
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
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
      (prisma.tattooRequest.findUnique as jest.Mock).mockResolvedValueOnce({
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
      
      // Verify prisma queries
      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { startTime: 'asc' }
        })
      );
    });
    
    it('should filter bookings by parameters', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/bookings',
        query: {
          startDate: '2023-06-15',
          endDate: '2023-06-16',
          status: 'scheduled',
          type: 'consultation',
          customerId: 'test-customer-id'
        }
      });
      
      expect(response.statusCode).toBe(200);
      
      // Verify prisma queries included the filters
      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startTime: expect.objectContaining({
              gte: expect.any(Date)
            }),
            endTime: expect.objectContaining({
              lte: expect.any(Date)
            }),
            status: 'scheduled',
            type: 'consultation',
            customerId: 'test-customer-id'
          })
        })
      );
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
      expect(result.booking.id).toBe('test-booking-id');
      
      // Verify prisma query
      expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-booking-id' },
        include: expect.objectContaining({
          customer: true,
          staff: true
        })
      });
    });
    
    it('should return 404 if booking is not found', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
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
          status: 'confirmed',
          notes: 'Updated notes'
        }
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);
      expect(result.booking).toBeDefined();
      
      // Verify prisma update
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-booking-id' },
          data: expect.objectContaining({
            startTime: expect.any(Date),
            status: 'confirmed',
            notes: 'Updated notes'
          })
        })
      );
      
      // Verify audit log
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'booking_updated',
            resourceType: 'appointment',
            resourceId: 'test-booking-id'
          })
        })
      );
    });
    
    it('should return 404 if booking to update is not found', async () => {
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      const response = await fastify.inject({
        method: 'PUT',
        url: '/bookings/non-existent-booking',
        payload: {
          status: 'cancelled'
        }
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(404);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Booking not found');
    });
  });
});

describe('Authorization and Permission Tests', () => {
  beforeEach(async () => {
    // Customize mock authentication to test different roles
    jest.clearAllMocks();
    fastify = require('fastify')();
    
    // Mock prisma responses similar to main tests
    (prisma.customer.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-customer-id',
      name: 'Test Customer',
      email: 'test@example.com'
    });
    
    (prisma.appointment.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-booking-id',
      customerId: 'test-customer-id',
      artistId: 'test-artist-id',
      startTime: new Date('2023-06-15T14:00:00Z'),
      endTime: new Date('2023-06-15T15:00:00Z'),
      status: 'scheduled',
      type: 'consultation'
    });
  });
  
  it('should allow admin to access any booking', async () => {
    // Set up admin role
    fastify.addHook('preHandler', (request, reply, done) => {
      request.user = { id: 'admin-user-id', role: 'admin' };
      done();
    });
    
    await fastify.register(bookingRoutes, { prefix: '/bookings' });
    
    const response = await fastify.inject({
      method: 'GET',
      url: '/bookings/test-booking-id'
    });
    
    expect(response.statusCode).toBe(200);
  });
  
  it('should allow artist to access their own bookings', async () => {
    // Set up artist role
    fastify.addHook('preHandler', (request, reply, done) => {
      request.user = { id: 'test-artist-id', role: 'artist' };
      done();
    });
    
    await fastify.register(bookingRoutes, { prefix: '/bookings' });
    
    const response = await fastify.inject({
      method: 'GET',
      url: '/bookings/test-booking-id'
    });
    
    expect(response.statusCode).toBe(200);
  });
  
  it('should allow customer to access their own bookings', async () => {
    // Set up customer role
    fastify.addHook('preHandler', (request, reply, done) => {
      request.user = { id: 'test-customer-id', role: 'customer' };
      done();
    });
    
    await fastify.register(bookingRoutes, { prefix: '/bookings' });
    
    const response = await fastify.inject({
      method: 'GET',
      url: '/bookings/test-booking-id'
    });
    
    expect(response.statusCode).toBe(200);
  });
  
  it('should deny access for non-admin/non-owner users', async () => {
    // Set up a different user
    fastify.addHook('preHandler', (request, reply, done) => {
      request.user = { id: 'different-user-id', role: 'customer' };
      done();
    });
    
    await fastify.register(bookingRoutes, { prefix: '/bookings' });
    
    const response = await fastify.inject({
      method: 'GET',
      url: '/bookings/test-booking-id'
    });
    
    expect(response.statusCode).toBe(403);
  });
  
  it('should restrict booking listing to admin and artists', async () => {
    // Set up a customer user
    fastify.addHook('preHandler', (request, reply, done) => {
      request.user = { id: 'test-customer-id', role: 'customer' };
      done();
    });
    
    await fastify.register(bookingRoutes, { prefix: '/bookings' });
    
    const response = await fastify.inject({
      method: 'GET',
      url: '/bookings'
    });
    
    expect(response.statusCode).toBe(403);
  });
  
  it('should restrict booking updates to admin and artists', async () => {
    // Set up a customer user
    fastify.addHook('preHandler', (request, reply, done) => {
      request.user = { id: 'test-customer-id', role: 'customer' };
      done();
    });
    
    await fastify.register(bookingRoutes, { prefix: '/bookings' });
    
    const response = await fastify.inject({
      method: 'PUT',
      url: '/bookings/test-booking-id',
      payload: {
        status: 'cancelled'
      }
    });
    
    expect(response.statusCode).toBe(403);
  });
});

describe('Error Handling Tests', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    fastify = await setupTestServer();
  });
  
  it('should handle service errors during booking creation', async () => {
    // Mock BookingService to throw an error
    const mockBookingService = (BookingService as unknown as jest.Mock).mock.instances[0];
    mockBookingService.createBooking.mockRejectedValueOnce(new Error('Service error'));
    
    const response = await fastify.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        startAt: '2023-06-15T14:00:00Z',
        duration: 60,
        customerId: 'test-customer-id',
        bookingType: BookingType.CONSULTATION
      }
    });
    
    const result = JSON.parse(response.payload);
    
    expect(response.statusCode).toBe(500);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Error creating booking');
    expect(result.error).toBe('Service error');
  });
  
  it('should handle database errors when fetching bookings', async () => {
    // Mock database error
    (prisma.appointment.findMany as jest.Mock).mockRejectedValueOnce(
      new Error('Database error')
    );
    
    const response = await fastify.inject({
      method: 'GET',
      url: '/bookings'
    });
    
    const result = JSON.parse(response.payload);
    
    expect(response.statusCode).toBe(500);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Error fetching bookings');
  });
  
  it('should handle database errors when fetching a single booking', async () => {
    // Mock database error
    (prisma.appointment.findUnique as jest.Mock).mockRejectedValueOnce(
      new Error('Database error')
    );
    
    const response = await fastify.inject({
      method: 'GET',
      url: '/bookings/test-booking-id'
    });
    
    const result = JSON.parse(response.payload);
    
    expect(response.statusCode).toBe(500);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Error fetching booking');
  });
  
  it('should handle database errors when updating a booking', async () => {
    // Mock database error
    (prisma.appointment.update as jest.Mock).mockRejectedValueOnce(
      new Error('Database error')
    );
    
    const response = await fastify.inject({
      method: 'PUT',
      url: '/bookings/test-booking-id',
      payload: {
        status: 'confirmed'
      }
    });
    
    const result = JSON.parse(response.payload);
    
    expect(response.statusCode).toBe(500);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Error updating booking');
  });
  
  it('should validate incoming booking data', async () => {
    // Test with missing required fields
    const response = await fastify.inject({
      method: 'POST',
      url: '/bookings',
      payload: {
        // Missing startAt, duration and other required fields
        customerId: 'test-customer-id'
      }
    });
    
    expect(response.statusCode).toBe(400); // Bad request for schema validation failure
  });
}); 
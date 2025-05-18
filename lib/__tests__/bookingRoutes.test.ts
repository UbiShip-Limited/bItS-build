import { jest } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import bookingRoutes from '../routes/booking';
import BookingService, { BookingType, BookingStatus } from '../services/bookingService';
import { prisma } from '../prisma/prisma';

// Mock dependencies
jest.mock('../services/bookingService');
jest.mock('../prisma/prisma', () => {
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
          },
          squareBookingUpdated: {
            result: {
              booking: {
                id: 'updated-square-booking-id'
              }
            }
          }
        }),
        getBookingAvailability: jest.fn().mockResolvedValue({
          success: true,
          date: '2023-06-15',
          availableSlots: []
        }),
        squareClient: {
          getBookingById: jest.fn().mockResolvedValue({
            result: {
              booking: {
                id: 'test-square-booking-id',
                version: 1
              }
            }
          }),
          cancelBooking: jest.fn().mockResolvedValue({
            result: {
              booking: {
                id: 'test-square-booking-id',
                status: 'CANCELLED'
              }
            }
          })
        }
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
          artist: true
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
      expect(result.booking).toBeDefined();
      expect(result.squareBookingUpdated).toBeDefined();
      
      // Verify BookingService.updateBooking was called with correct parameters
      const bookingServiceInstance = (BookingService as unknown as jest.Mock).mock.instances[0];
      expect(bookingServiceInstance.updateBooking).toHaveBeenCalledWith({
        bookingId: 'test-booking-id',
        startAt: expect.any(Date),
        duration: 90,
        status: 'confirmed',
        artistId: 'test-artist-id',
        note: 'Updated notes',
        priceQuote: 150
      });
      
      // Verify audit log entry was created
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'booking_updated',
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

  describe('POST /bookings/:id/cancel', () => {
    beforeEach(() => {
      // Add a specific mock for appointment.update for cancellation
      (prisma.appointment.update as jest.Mock).mockResolvedValue({
        id: 'test-booking-id',
        customerId: 'test-customer-id',
        artistId: 'test-artist-id',
        startTime: new Date('2023-06-15T14:00:00Z'),
        endTime: new Date('2023-06-15T15:00:00Z'),
        status: 'cancelled',
        type: 'consultation',
        cancelReason: 'Customer requested cancellation'
      });
    });
    
    it('should cancel a booking successfully', async () => {
      // Mock appointment with Square ID
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValueOnce({
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
      expect(result.booking).toBeDefined();
      expect(result.squareCancelled).toBe(true);
      
      // Verify appointment was updated to cancelled status
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-booking-id' },
          data: expect.objectContaining({
            status: 'cancelled',
            cancelReason: 'Customer requested cancellation'
          })
        })
      );
      
      // Verify Square booking was cancelled
      const bookingServiceInstance = (BookingService as unknown as jest.Mock).mock.instances[0];
      expect(bookingServiceInstance.squareClient.getBookingById).toHaveBeenCalledWith('test-square-booking-id');
      expect(bookingServiceInstance.squareClient.cancelBooking).toHaveBeenCalledWith({
        bookingId: 'test-square-booking-id',
        bookingVersion: 1,
        idempotencyKey: expect.any(String)
      });
      
      // Verify audit log was created
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'booking_cancelled',
            resourceId: 'test-booking-id'
          })
        })
      );
    });
    
    it('should cancel a booking without Square ID', async () => {
      // Mock appointment without Square ID
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'test-booking-id',
        customerId: 'test-customer-id',
        artistId: 'test-artist-id',
        startTime: new Date('2023-06-15T14:00:00Z'),
        endTime: new Date('2023-06-15T15:00:00Z'),
        status: 'scheduled',
        type: 'consultation',
        squareId: null
      });
      
      const response = await fastify.inject({
        method: 'POST',
        url: '/bookings/test-booking-id/cancel',
        payload: {
          reason: 'Customer requested cancellation'
        }
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);
      expect(result.booking).toBeDefined();
      expect(result.squareCancelled).toBe(false);
      
      // Verify appointment was updated to cancelled status
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-booking-id' },
          data: expect.objectContaining({
            status: 'cancelled'
          })
        })
      );
      
      // Verify Square booking methods were not called
      const bookingServiceInstance = (BookingService as unknown as jest.Mock).mock.instances[0];
      expect(bookingServiceInstance.squareClient.getBookingById).not.toHaveBeenCalled();
      expect(bookingServiceInstance.squareClient.cancelBooking).not.toHaveBeenCalled();
    });
    
    it('should handle Square cancellation errors', async () => {
      // Mock appointment with Square ID
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'test-booking-id',
        customerId: 'test-customer-id',
        artistId: 'test-artist-id',
        startTime: new Date('2023-06-15T14:00:00Z'),
        endTime: new Date('2023-06-15T15:00:00Z'),
        status: 'scheduled',
        type: 'consultation',
        squareId: 'test-square-booking-id'
      });
      
      // Mock Square getBookingById to throw error
      const bookingServiceInstance = (BookingService as unknown as jest.Mock).mock.instances[0];
      bookingServiceInstance.squareClient.getBookingById.mockRejectedValueOnce(
        new Error('Square API error')
      );
      
      const response = await fastify.inject({
        method: 'POST',
        url: '/bookings/test-booking-id/cancel',
        payload: {
          reason: 'Customer requested cancellation'
        }
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(200);
      expect(result.success).toBe(true);
      expect(result.booking).toBeDefined();
      expect(result.squareCancelled).toBe(false);
      
      // Verify we still cancelled in our database
      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-booking-id' },
          data: expect.objectContaining({
            status: 'cancelled'
          })
        })
      );
      
      // Verify an error audit log was created
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'square_booking_cancel_failed'
          })
        })
      );
    });
    
    it('should enforce permission checks for cancellation', async () => {
      // Mock a different user
      fastify.addHook('preHandler', (request, reply, done) => {
        request.user = { id: 'different-user-id', role: 'customer' };
        done();
      });
      
      (prisma.appointment.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'test-booking-id',
        customerId: 'test-customer-id',
        artistId: 'test-artist-id',
        startTime: new Date('2023-06-15T14:00:00Z'),
        endTime: new Date('2023-06-15T15:00:00Z'),
        status: 'scheduled',
        type: 'consultation'
      });
      
      const response = await fastify.inject({
        method: 'POST',
        url: '/bookings/test-booking-id/cancel',
        payload: {
          reason: 'Cancellation reason'
        }
      });
      
      const result = JSON.parse(response.payload);
      
      expect(response.statusCode).toBe(403);
      expect(result.success).toBe(false);
      expect(result.message).toBe('You do not have permission to cancel this booking');
    });
  });
});

describe('Authorization and Permission Tests', () => {
  let fastify: FastifyInstance;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    fastify = await setupTestServer();
    
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
  let fastify: FastifyInstance;
  
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
  
  it('should handle service errors during booking update', async () => {
    // Mock BookingService.updateBooking to throw an error
    const mockBookingService = (BookingService as unknown as jest.Mock).mock.instances[0];
    mockBookingService.updateBooking.mockRejectedValueOnce(new Error('Update service error'));
    
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
    expect(result.error).toBe('Update service error');
  });
  
  it('should handle Square API errors gracefully during booking operations', async () => {
    // Setup mock appointment
    (prisma.appointment.findUnique as jest.Mock).mockResolvedValue({
      id: 'test-booking-id',
      customerId: 'test-customer-id',
      startTime: new Date('2023-06-15T14:00:00Z'),
      endTime: new Date('2023-06-15T15:00:00Z'),
      status: 'scheduled',
      type: 'consultation',
      squareId: 'test-square-booking-id'
    });
    
    // Mock BookingService instance with Square client error
    const mockBookingService = (BookingService as unknown as jest.Mock).mock.instances[0];
    mockBookingService.squareClient.getBookingById.mockRejectedValueOnce(
      new Error('Square API connection error')
    );
    
    const response = await fastify.inject({
      method: 'POST',
      url: '/bookings/test-booking-id/cancel',
      payload: {
        reason: 'Test cancellation'
      }
    });
    
    // Should still succeed even if Square fails
    const result = JSON.parse(response.payload);
    expect(response.statusCode).toBe(200);
    expect(result.success).toBe(true);
    expect(result.squareCancelled).toBe(false);
    
    // Verify audit log was created for the Square failure
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'square_booking_cancel_failed'
        })
      })
    );
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
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockPrismaClient, mockSquareClient } from '../../../jest.setup.mjs';
import BookingService, { BookingType, BookingStatus } from '../../services/bookingService.js';

// Mock the uuid generation for consistent test results
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid-123')
}));

// Set environment variables
process.env.SQUARE_LOCATION_ID = 'location123';

describe('BookingService', () => {
  let bookingService;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock customer.findUnique
    mockPrismaClient.customer.findUnique.mockImplementation((args) => {
      if (args?.where?.id === 'customer123') {
        return Promise.resolve({
          id: 'customer123',
          name: 'Test Customer',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          squareId: 'square-customer-123'
        });
      }
      return Promise.resolve(null);
    });
    
    // Mock tattooRequest.findUnique
    mockPrismaClient.tattooRequest.findUnique.mockImplementation((args) => {
      if (args?.where?.id === 'tattooRequest123') {
        return Promise.resolve({
          id: 'tattooRequest123',
          description: 'Test tattoo request',
          status: 'approved',
          customerId: 'customer123'
        });
      }
      return Promise.resolve(null);
    });
    
    // Mock appointment creation
    mockPrismaClient.appointment.create.mockImplementation((args) => {
      return Promise.resolve({
        id: 'booking123',
        startTime: args.data.startTime || new Date('2023-10-15T14:00:00Z'),
        endTime: args.data.endTime || new Date('2023-10-15T15:00:00Z'),
        status: args.data.status || 'scheduled',
        type: args.data.type || 'consultation',
        customerId: args.data.customerId || 'customer123',
        artistId: args.data.artistId || 'artist123',
        notes: args.data.notes || 'Test booking',
        squareId: args.data.squareId || 'sq_booking_123',
        priceQuote: args.data.priceQuote || 50.0,
        tattooRequestId: args.data.tattooRequestId,
        customer: {
          id: 'customer123',
          name: 'Test Customer'
        },
        artist: {
          id: 'artist123',
          name: 'Test Artist'
        },
        tattooRequest: args.data.tattooRequestId ? {
          id: 'tattooRequest123',
          description: 'Test tattoo request'
        } : null
      });
    });
    
    // Mock appointment findUnique and update
    mockPrismaClient.appointment.findUnique.mockImplementation((args) => {
      if (args?.where?.id === 'booking123') {
        return Promise.resolve({
          id: 'booking123',
          startTime: new Date('2023-10-15T14:00:00Z'),
          endTime: new Date('2023-10-15T15:00:00Z'),
          status: 'scheduled',
          type: 'consultation',
          customerId: 'customer123',
          artistId: 'artist123',
          notes: 'Test booking',
          squareId: 'sq_booking_123',
          priceQuote: 50.0,
          duration: 60, // Add duration for update tests
          date: new Date('2023-10-15T14:00:00Z'), // Add date for update tests
          customer: {
            id: 'customer123',
            name: 'Test Customer',
            email: 'test@example.com'
          }
        });
      }
      return Promise.resolve(null);
    });
    
    mockPrismaClient.appointment.update.mockImplementation((args) => {
      return Promise.resolve({
        id: args.where.id,
        ...args.data,
        customer: {
          id: 'customer123',
          name: 'Test Customer'
        },
        artist: {
          id: args.data.artistId || 'artist123',
          name: 'Test Artist'
        }
      });
    });
    
    // Reset and set up createBooking mock
    if (typeof mockSquareClient.createBooking === 'function') {
      if (mockSquareClient.createBooking.mockClear) {
        mockSquareClient.createBooking.mockClear();
      }
    } else {
      mockSquareClient.createBooking = jest.fn();
    }
    
    // Create a mock implementation
    mockSquareClient.createBooking.mockImplementation(() => {
      return Promise.resolve({
        result: {
          booking: {
            id: 'sq_booking_123',
            start_at: '2023-10-15T14:00:00Z',
            location_id: 'location123',
            customer_id: 'customer123',
            status: 'ACCEPTED',
            appointment_segments: [
              {
                duration_minutes: 60
              }
            ]
          }
        }
      });
    });
    
    // Set up mock for getBookingById 
    mockSquareClient.getBookingById = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        result: {
          booking: {
            id: 'sq_booking_123',
            start_at: '2023-10-15T14:00:00Z',
            location_id: 'location123',
            customer_id: 'customer123',
            version: 1,
            status: 'ACCEPTED',
            appointmentSegments: [
              {
                durationMinutes: 60,
                teamMemberId: 'artist123',
                serviceVariationId: 'service123'
              }
            ]
          }
        }
      });
    });
    
    // Set up mock for bookings.cancel
    mockSquareClient.client = {
      bookings: {
        cancel: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            success: true
          });
        }),
        create: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            result: {
              booking: {
                id: 'sq_booking_updated_123',
                start_at: '2023-10-15T16:00:00Z',
                location_id: 'location123',
                customer_id: 'customer123',
                status: 'ACCEPTED',
                appointment_segments: [
                  {
                    duration_minutes: 90
                  }
                ]
              }
            }
          });
        })
      }
    };
    
    // Set up updateBooking mock
    mockSquareClient.updateBooking = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        result: {
          booking: {
            id: 'sq_booking_updated_123',
            start_at: '2023-10-15T16:00:00Z',
            location_id: 'location123',
            customer_id: 'customer123',
            status: 'ACCEPTED',
            appointment_segments: [
              {
                duration_minutes: 90
              }
            ]
          }
        }
      });
    });
    
    // Mock audit log creation
    mockPrismaClient.auditLog.create.mockImplementation(() => {
      return Promise.resolve({
        id: 'audit123'
      });
    });
    
    // Initialize BookingService
    bookingService = new BookingService();
  });
  
  describe('createBooking', () => {
    it('should create a consultation booking', async () => {
      const bookingDate = new Date('2023-10-15T14:00:00Z');
      const bookingParams = {
        startAt: bookingDate,
        duration: 60,
        customerId: 'customer123',
        bookingType: BookingType.CONSULTATION,
        artistId: 'artist123',
        note: 'Test consultation booking',
        priceQuote: 50.0
      };
      
      const result = await bookingService.createBooking(bookingParams);
      
      expect(result.success).toBe(true);
      expect(result.booking.id).toBe('booking123');
      expect(mockPrismaClient.appointment.create).toHaveBeenCalled();
    });
    
    it('should create a booking with tattoo request', async () => {
      const bookingDate = new Date('2023-10-15T14:00:00Z');
      const bookingParams = {
        startAt: bookingDate,
        duration: 60,
        customerId: 'customer123',
        bookingType: BookingType.TATTOO_SESSION,
        artistId: 'artist123',
        note: 'Test tattoo booking',
        priceQuote: 150.0,
        tattooRequestId: 'tattooRequest123'
      };
      
      const result = await bookingService.createBooking(bookingParams);
      
      expect(result.success).toBe(true);
      expect(result.booking.id).toBe('booking123');
      expect(result.booking.tattooRequestId).toBe('tattooRequest123');
      expect(mockPrismaClient.tattooRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 'tattooRequest123' }
      });
    });
    
    it('should handle customer not found error', async () => {
      const bookingDate = new Date('2023-10-15T14:00:00Z');
      const bookingParams = {
        startAt: bookingDate,
        duration: 60,
        customerId: 'nonexistent_customer',
        bookingType: BookingType.CONSULTATION
      };
      
      // Override the mock for this test
      mockPrismaClient.customer.findUnique.mockResolvedValueOnce(null);
      
      await expect(bookingService.createBooking(bookingParams))
        .rejects.toThrow('Customer not found');
    });
    
    it('should handle tattoo request not found error', async () => {
      const bookingDate = new Date('2023-10-15T14:00:00Z');
      const bookingParams = {
        startAt: bookingDate,
        duration: 60,
        customerId: 'customer123',
        bookingType: BookingType.TATTOO_SESSION,
        tattooRequestId: 'nonexistent_request'
      };
      
      // Override the mock for this test
      mockPrismaClient.tattooRequest.findUnique.mockResolvedValueOnce(null);
      
      await expect(bookingService.createBooking(bookingParams))
        .rejects.toThrow('Tattoo request not found');
    });
  });
  
  describe('updateBooking', () => {
    it('should update a booking', async () => {
      const updateParams = {
        bookingId: 'booking123',
        startAt: new Date('2023-10-15T16:00:00Z'),
        duration: 90,
        status: BookingStatus.CONFIRMED,
        artistId: 'artist456',
        note: 'Updated booking note'
      };
      
      const result = await bookingService.updateBooking(updateParams);
      
      expect(result.success).toBe(true);
      expect(mockPrismaClient.appointment.update).toHaveBeenCalled();
    });
    
    it('should handle booking not found error', async () => {
      const updateParams = {
        bookingId: 'nonexistent_booking',
        status: BookingStatus.CONFIRMED
      };
      
      // Override the mock for this test
      mockPrismaClient.appointment.findUnique.mockResolvedValueOnce(null);
      
      await expect(bookingService.updateBooking(updateParams))
        .rejects.toThrow('Booking not found');
    });
  });
}); 
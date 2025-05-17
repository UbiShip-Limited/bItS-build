import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { mockPrismaClient, mockSquareClient } from '../../../jest.setup.mjs';
import BookingService, { BookingType } from '../../services/bookingService.js';

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
    
    // Mock appointment creation
    mockPrismaClient.appointment.create.mockImplementation(() => {
      return Promise.resolve({
        id: 'booking123',
        startTime: new Date('2023-10-15T14:00:00Z'),
        endTime: new Date('2023-10-15T15:00:00Z'),
        status: 'scheduled',
        type: 'consultation',
        customerId: 'customer123',
        staffId: 'staff123',
        notes: 'Test booking',
        squareId: 'sq_booking_123',
        priceQuote: 50.0,
        customer: {
          id: 'customer123',
          name: 'Test Customer'
        },
        artist: {
          id: 'staff123',
          name: 'Test Artist'
        },
        tattooRequest: null
      });
    });
    
    // Mock Square client
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
    
    // Mock audit log creation
    mockPrismaClient.auditLog.create.mockImplementation(() => {
      return Promise.resolve({
        id: 'audit123'
      });
    });
    
    // Initialize BookingService
    bookingService = new BookingService();
  });
  
  it('should create a consultation booking', async () => {
    const bookingDate = new Date('2023-10-15T14:00:00Z');
    const bookingParams = {
      startAt: bookingDate,
      duration: 60,
      customerId: 'customer123',
      bookingType: BookingType.CONSULTATION,
      staffId: 'staff123',
      note: 'Test consultation booking',
      priceQuote: 50.0
    };
    
    const result = await bookingService.createBooking(bookingParams);
    
    expect(result.success).toBe(true);
    expect(result.booking.id).toBe('booking123');
  });
}); 
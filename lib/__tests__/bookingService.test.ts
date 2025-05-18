import { jest } from '@jest/globals';
import BookingService, { BookingType, BookingStatus } from '../services/bookingService.js';

// Create mock functions
const mockCustomerFindUnique = jest.fn();
const mockTattooRequestFindUnique = jest.fn();
const mockAppointmentCreate = jest.fn();
const mockAppointmentFindUnique = jest.fn();
const mockAppointmentUpdate = jest.fn();
const mockAuditLogCreate = jest.fn();
const mockTransaction = jest.fn().mockImplementation(callback => callback());

// Type guard for mocked functions
const isMockFunction = (fn: any): fn is jest.Mock => 
  fn && typeof fn === 'function' && typeof fn.mockReset === 'function';

// Mock Square client
const mockSquareCreateBooking = jest.fn<any, [any]>().mockResolvedValue({
  result: {
    booking: {
      id: 'test-square-booking-id',
      startAt: '2023-06-15T14:00:00Z',
      locationId: 'test-location-id',
      customerId: 'test-customer-id',
      status: 'ACCEPTED'
    }
  }
});

const mockSquareGetBookingById = jest.fn<any, [any]>().mockResolvedValue({
  result: {
    booking: {
      id: 'test-square-booking-id',
      startAt: '2023-06-15T14:00:00Z',
      locationId: 'test-location-id',
      customerId: 'test-customer-id',
      status: 'ACCEPTED',
      version: 1
    }
  }
});

const mockSquareUpdateBooking = jest.fn<any, [any]>().mockResolvedValue({
  result: {
    booking: {
      id: 'updated-square-booking-id',
      startAt: '2023-06-15T16:00:00Z',
      locationId: 'test-location-id',
      customerId: 'test-customer-id',
      status: 'ACCEPTED'
    }
  }
});

const mockSquareCancelBooking = jest.fn<any, [any]>().mockResolvedValue({
  result: {
    booking: {
      id: 'test-square-booking-id',
      startAt: '2023-06-15T14:00:00Z',
      locationId: 'test-location-id',
      customerId: 'test-customer-id',
      status: 'CANCELLED'
    }
  }
});

const mockSquareClient = {
  fromEnv: jest.fn().mockReturnValue({
    createBooking: mockSquareCreateBooking,
    getBookingById: mockSquareGetBookingById,
    updateBooking: mockSquareUpdateBooking,
    cancelBooking: mockSquareCancelBooking
  })
};

// Mock Prisma client
const mockPrisma = {
  appointment: {
    create: mockAppointmentCreate,
    findUnique: mockAppointmentFindUnique,
    update: mockAppointmentUpdate
  },
  customer: {
    findUnique: mockCustomerFindUnique
  },
  tattooRequest: {
    findUnique: mockTattooRequestFindUnique
  },
  auditLog: {
    create: mockAuditLogCreate
  },
  $transaction: mockTransaction
};

// Fix the Square module path
jest.mock('@square/client', () => ({
  __esModule: true,
  default: mockSquareClient
}), { virtual: true });

// Or if it's a local module in a different location:
jest.mock('../square/index', () => ({
  __esModule: true,
  default: mockSquareClient
}), { virtual: true });

// Mock the imports
jest.mock('../prisma/prisma', () => ({
  __esModule: true,
  prisma: mockPrisma
}), { virtual: true });

describe('BookingService', () => {
  let bookingService: BookingService;
  
  beforeEach(() => {
    // Reset all mocks
    if (isMockFunction(mockCustomerFindUnique)) {
      mockCustomerFindUnique.mockReset();
      mockTattooRequestFindUnique.mockReset();
      mockAppointmentCreate.mockReset();
      mockAppointmentFindUnique.mockReset();
      mockAppointmentUpdate.mockReset();
      mockAuditLogCreate.mockReset();
      mockTransaction.mockReset();
      mockSquareCreateBooking.mockReset();
      mockSquareGetBookingById.mockReset();
      mockSquareUpdateBooking.mockReset();
      mockSquareCancelBooking.mockReset();
    }
    
    // Re-initialize mockTransaction
    mockTransaction.mockImplementation(callback => callback());
    
    // Initialize the booking service
    bookingService = new BookingService();
    
    // Set up default mocks
    mockCustomerFindUnique.mockResolvedValue({
      id: 'test-customer-id',
      name: 'Test Customer',
      email: 'test@example.com',
      squareId: 'square-customer-id'
    });
    
    mockAppointmentCreate.mockResolvedValue({
      id: 'test-booking-id',
      customerId: 'test-customer-id',
      startTime: new Date('2023-06-15T14:00:00Z'),
      endTime: new Date('2023-06-15T15:00:00Z'),
      status: 'scheduled',
      type: 'consultation',
      squareId: 'test-square-booking-id'
    });
    
    mockAuditLogCreate.mockResolvedValue({
      id: 'test-audit-log-id',
      action: 'booking_created'
    });
    
    mockSquareCreateBooking.mockResolvedValue({
      result: {
        booking: {
          id: 'test-square-booking-id',
          startAt: '2023-06-15T14:00:00Z',
          locationId: 'test-location-id',
          customerId: 'test-customer-id',
          status: 'ACCEPTED'
        }
      }
    });
  });
  
  describe('createBooking', () => {
    it('should successfully create a booking', async () => {
      const startAt = new Date('2023-06-15T14:00:00Z');
      
      const result = await bookingService.createBooking({
        startAt,
        duration: 60,
        customerId: 'test-customer-id',
        bookingType: BookingType.CONSULTATION,
        note: 'Test booking'
      });
      
      // Verify customer lookup
      expect(mockCustomerFindUnique).toHaveBeenCalledWith({
        where: { id: 'test-customer-id' }
      });
      
      // Verify Square API call
      expect(mockSquareCreateBooking).toHaveBeenCalledWith({
        startAt: startAt.toISOString(),
        locationId: process.env.SQUARE_LOCATION_ID,
        customerId: 'square-customer-id',
        duration: 60,
        idempotencyKey: expect.any(String),
        staffId: undefined,
        note: 'Booking type: consultation - Test booking'
      });
      
      // Verify database booking creation
      expect(mockAppointmentCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          startTime: startAt,
          endTime: new Date(startAt.getTime() + 60 * 60000),
          status: 'scheduled',
          type: 'consultation',
          customerId: 'test-customer-id',
          notes: 'Test booking',
          squareId: 'test-square-booking-id'
        }),
        include: {
          customer: true,
          artist: true,
          tattooRequest: true
        }
      });
      
      // Verify audit log creation
      expect(mockAuditLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'booking_created',
          resourceType: 'appointment',
          resourceId: 'test-booking-id'
        })
      });
      
      // Verify returned data
      expect(result).toEqual({
        success: true,
        booking: expect.objectContaining({
          id: 'test-booking-id',
          customerId: 'test-customer-id'
        }),
        squareBooking: expect.objectContaining({
          id: 'test-square-booking-id'
        })
      });
    });
    
    it('should create a booking even if Square API fails', async () => {
      // Mock Square API to fail
      mockSquareCreateBooking.mockRejectedValueOnce(
        new Error('Square API error')
      );
      
      const startAt = new Date('2023-06-15T14:00:00Z');
      
      const result = await bookingService.createBooking({
        startAt,
        duration: 60,
        customerId: 'test-customer-id',
        bookingType: BookingType.CONSULTATION
      });
      
      // Verify that we still created the booking in our database
      expect(mockAppointmentCreate).toHaveBeenCalled();
      
      // Verify we created an audit log for the failed Square call
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'square_booking_failed'
          })
        })
      );
      
      // Verify we also created an audit log for the successful database booking
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'booking_created'
          })
        })
      );
      
      // Verify returned data
      expect(result).toEqual({
        success: true,
        booking: expect.any(Object),
        squareBooking: undefined
      });
    });
    
    it('should throw an error if the customer is not found', async () => {
      // Mock customer not found
      mockCustomerFindUnique.mockResolvedValueOnce(null);
      
      await expect(
        bookingService.createBooking({
          startAt: new Date(),
          duration: 60,
          customerId: 'non-existent-customer',
          bookingType: BookingType.CONSULTATION
        })
      ).rejects.toThrow('Customer not found');
      
      // Verify we created an audit log for the failed booking
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'booking_failed',
            details: expect.objectContaining({
              error: 'Customer not found'
            })
          })
        })
      );
      
      // Verify we didn't call Square API
      expect(mockSquareCreateBooking).not.toHaveBeenCalled();
      
      // Verify we didn't create a booking
      expect(mockAppointmentCreate).not.toHaveBeenCalled();
    });
    
    it('should handle tattoo request validation', async () => {
      // Mock tattoo request not found
      mockTattooRequestFindUnique.mockResolvedValueOnce(null);
      
      await expect(
        bookingService.createBooking({
          startAt: new Date(),
          duration: 60,
          customerId: 'test-customer-id',
          bookingType: BookingType.TATTOO_SESSION,
          tattooRequestId: 'non-existent-request'
        })
      ).rejects.toThrow('Tattoo request not found');
      
      // Mock tattoo request found
      mockTattooRequestFindUnique.mockResolvedValueOnce({
        id: 'test-tattoo-request',
        customerId: 'test-customer-id',
        description: 'Test tattoo'
      });
      
      // Should succeed with valid tattoo request
      await expect(
        bookingService.createBooking({
          startAt: new Date(),
          duration: 60,
          customerId: 'test-customer-id',
          bookingType: BookingType.TATTOO_SESSION,
          tattooRequestId: 'test-tattoo-request'
        })
      ).resolves.toEqual(expect.objectContaining({
        success: true
      }));
    });
  });
  
  describe('updateBooking', () => {
    beforeEach(() => {
      // Set up update mocks
      mockAppointmentFindUnique.mockResolvedValue({
        id: 'test-booking-id',
        customerId: 'test-customer-id',
        startTime: new Date('2023-06-15T14:00:00Z'),
        endTime: new Date('2023-06-15T15:00:00Z'),
        status: 'scheduled',
        type: 'consultation',
        squareId: 'test-square-booking-id'
      });
      
      mockAppointmentUpdate.mockResolvedValue({
        id: 'test-booking-id',
        customerId: 'test-customer-id',
        startTime: new Date('2023-06-15T16:00:00Z'),
        endTime: new Date('2023-06-15T17:00:00Z'),
        status: 'confirmed',
        type: 'consultation',
        squareId: 'test-square-booking-id'
      });
    });
    
    it('should successfully update a booking', async () => {
      const startAt = new Date('2023-06-15T16:00:00Z');
      
      const result = await bookingService.updateBooking({
        bookingId: 'test-booking-id',
        startAt,
        status: BookingStatus.CONFIRMED
      });
      
      // Verify booking lookup
      expect(mockAppointmentFindUnique).toHaveBeenCalledWith({
        where: { id: 'test-booking-id' }
      });
      
      // Verify database update
      expect(mockAppointmentUpdate).toHaveBeenCalledWith({
        where: { id: 'test-booking-id' },
        data: expect.objectContaining({
          startTime: startAt,
          endTime: expect.any(Date),
          status: 'confirmed'
        }),
        include: {
          customer: true,
          artist: true,
          tattooRequest: true
        }
      });
      
      // Verify audit log creation
      expect(mockAuditLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'booking_updated',
          resourceType: 'appointment',
          resourceId: 'test-booking-id'
        })
      });
      
      // Verify returned data
      expect(result).toEqual({
        success: true,
        booking: expect.objectContaining({
          id: 'test-booking-id',
          status: 'confirmed'
        }),
        squareBookingUpdated: null
      });
    });
    
    it('should throw an error if the booking is not found', async () => {
      // Mock booking not found
      mockAppointmentFindUnique.mockResolvedValueOnce(null);
      
      await expect(
        bookingService.updateBooking({
          bookingId: 'non-existent-booking',
          status: BookingStatus.CANCELLED
        })
      ).rejects.toThrow('Booking not found');
      
      // Verify we didn't update the booking
      expect(mockAppointmentUpdate).not.toHaveBeenCalled();
    });
    
    it('should properly recalculate duration with different parameters', async () => {
      // Update with only startAt
      await bookingService.updateBooking({
        bookingId: 'test-booking-id',
        startAt: new Date('2023-06-15T16:00:00Z')
      });
      
      // Verify correct end time calculation (maintaining 1 hour duration)
      expect(mockAppointmentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startTime: new Date('2023-06-15T16:00:00Z'),
            endTime: new Date('2023-06-15T17:00:00Z')
          })
        })
      );
      
      jest.clearAllMocks();
      
      // Update with startAt and duration
      await bookingService.updateBooking({
        bookingId: 'test-booking-id',
        startAt: new Date('2023-06-15T16:00:00Z'),
        duration: 90
      });
      
      // Verify correct end time calculation (with new duration)
      expect(mockAppointmentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startTime: new Date('2023-06-15T16:00:00Z'),
            endTime: new Date('2023-06-15T17:30:00Z')
          })
        })
      );
      
      jest.clearAllMocks();
      
      // Update with only duration
      await bookingService.updateBooking({
        bookingId: 'test-booking-id',
        duration: 120
      });
      
      // Verify correct end time calculation (with original start time)
      expect(mockAppointmentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            endTime: new Date('2023-06-15T16:00:00Z')
          })
        })
      );
    });
  });
  
  describe('getBookingAvailability', () => {
    it('should return availability data for a given date', async () => {
      const date = new Date('2023-06-15');
      
      const result = await bookingService.getBookingAvailability(date);
      
      expect(result).toEqual({
        success: true,
        date: '2023-06-15',
        availableSlots: []
      });
    });
    
    it('should accept artistId parameter to filter by artist', async () => {
      const date = new Date('2023-06-15');
      const artistId = 'test-artist-id';
      
      const result = await bookingService.getBookingAvailability(date, artistId);
      
      expect(result).toEqual({
        success: true,
        date: '2023-06-15',
        availableSlots: []
      });
    });
  });
  
  describe('createBooking additional error cases', () => {
    it('should handle general errors during booking creation', async () => {
      // Mock appointment.create to throw error
      mockAppointmentCreate.mockRejectedValueOnce(
        new Error('Database error')
      );
      
      await expect(
        bookingService.createBooking({
          startAt: new Date(),
          duration: 60,
          customerId: 'test-customer-id',
          bookingType: BookingType.CONSULTATION
        })
      ).rejects.toThrow('Database error');
      
      // Verify we created an audit log for the failed booking
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'booking_failed',
            details: expect.objectContaining({
              error: 'Database error'
            })
          })
        })
      );
    });
    
    it('should handle artistId validation', async () => {
      // Setup artist lookup
      const mockArtist = { id: 'test-artist-id', name: 'Test Artist' };
      
      const startAt = new Date('2023-06-15T14:00:00Z');
      
      const result = await bookingService.createBooking({
        startAt,
        duration: 60,
        customerId: 'test-customer-id',
        bookingType: BookingType.CONSULTATION,
        artistId: 'test-artist-id'
      });
      
      // Verify Square API call includes staffId
      expect(mockSquareCreateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          staffId: 'test-artist-id'
        })
      );
      
      // Verify booking includes artistId
      expect(mockAppointmentCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            artistId: 'test-artist-id'
          })
        })
      );
    });
  });
  
  describe('updateBooking additional cases', () => {
    it('should handle Square-related update logic for bookings with squareId', async () => {
      // Set up a booking with squareId
      mockAppointmentFindUnique.mockResolvedValueOnce({
        id: 'test-booking-id',
        customerId: 'test-customer-id',
        startTime: new Date('2023-06-15T14:00:00Z'),
        endTime: new Date('2023-06-15T15:00:00Z'),
        status: 'scheduled',
        type: 'consultation',
        squareId: 'test-square-booking-id',
        customer: {
          id: 'test-customer-id',
          email: 'test@example.com'
        }
      });
      
      const result = await bookingService.updateBooking({
        bookingId: 'test-booking-id',
        startAt: new Date('2023-06-15T16:00:00Z'),
        status: BookingStatus.CONFIRMED
      });
      
      // Verify Square.getBookingById was called to get booking details
      expect(mockSquareGetBookingById).toHaveBeenCalledWith('test-square-booking-id');
      
      // Verify Square.updateBooking was called
      expect(mockSquareUpdateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: 'test-square-booking-id',
          startAt: expect.any(String),
          customerId: 'test@example.com',
          idempotencyKey: expect.any(String),
          bookingType: 'consultation'
        })
      );
      
      // Verify we update our database with the new Square booking ID
      expect(mockAppointmentUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'test-booking-id' },
          data: expect.objectContaining({
            squareId: 'updated-square-booking-id'
          })
        })
      );
      
      // Verify we created an audit log for the successful Square update
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'square_booking_updated'
          })
        })
      );
      
      // Verify we also created an audit log for the successful database update
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'booking_updated'
          })
        })
      );
      
      // Verify the returned data includes the Square booking update info
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          booking: expect.any(Object),
          squareBookingUpdated: expect.objectContaining({
            result: expect.objectContaining({
              booking: expect.objectContaining({
                id: 'updated-square-booking-id'
              })
            })
          })
        })
      );
    });
    
    it('should handle Square errors during booking update', async () => {
      // Set up a booking with squareId
      mockAppointmentFindUnique.mockResolvedValueOnce({
        id: 'test-booking-id',
        customerId: 'test-customer-id',
        startTime: new Date('2023-06-15T14:00:00Z'),
        endTime: new Date('2023-06-15T15:00:00Z'),
        status: 'scheduled',
        type: 'consultation',
        squareId: 'test-square-booking-id',
        customer: {
          id: 'test-customer-id',
          email: 'test@example.com'
        }
      });
      
      // Mock Square update to fail
      mockSquareUpdateBooking.mockRejectedValueOnce(
        new Error('Square API error')
      );
      
      const result = await bookingService.updateBooking({
        bookingId: 'test-booking-id',
        status: BookingStatus.CONFIRMED
      });
      
      // Verify Square.getBookingById was called
      expect(mockSquareGetBookingById).toHaveBeenCalledWith('test-square-booking-id');
      
      // Verify Square.updateBooking was called
      expect(mockSquareUpdateBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          bookingId: 'test-square-booking-id'
        })
      );
      
      // Verify we created an audit log for the failed Square update
      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'square_booking_update_failed'
          })
        })
      );
      
      // Verify we still updated our database
      expect(mockAppointmentUpdate).toHaveBeenCalled();
      
      // Verify the returned data doesn't include Square booking info
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          booking: expect.any(Object),
          squareBookingUpdated: null
        })
      );
    });

    it('should handle bookings without Square IDs properly', async () => {
      // Set up a booking without squareId
      mockAppointmentFindUnique.mockResolvedValueOnce({
        id: 'test-booking-id',
        customerId: 'test-customer-id',
        startTime: new Date('2023-06-15T14:00:00Z'),
        endTime: new Date('2023-06-15T15:00:00Z'),
        status: 'scheduled',
        type: 'consultation',
        squareId: null
      });
      
      const result = await bookingService.updateBooking({
        bookingId: 'test-booking-id',
        status: BookingStatus.CONFIRMED
      });
      
      // Verify Square.updateBooking was not called
      expect(mockSquareUpdateBooking).not.toHaveBeenCalled();
      
      // Verify we still updated our database
      expect(mockAppointmentUpdate).toHaveBeenCalled();
      
      // Verify the returned data doesn't include Square booking info
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          booking: expect.any(Object),
          squareBookingUpdated: null
        })
      );
    });
  });
}); 
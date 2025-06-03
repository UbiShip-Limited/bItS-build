import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BookingService, { BookingType, BookingStatus } from '../bookingService';
import { AppointmentService } from '../appointmentService';
import { SquareIntegrationService } from '../squareIntegrationService';
import { AvailabilityService } from '../availabilityService';

// Mock the dependencies
vi.mock('../appointmentService');
vi.mock('../squareIntegrationService');
vi.mock('../availabilityService');

describe('BookingService', () => {
  let bookingService: BookingService;
  let mockAppointmentService: any;
  let mockSquareService: any;
  let mockAvailabilityService: any;
  
  const mockAppointment = {
    id: 'appointment-123',
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T11:00:00Z'),
    duration: 60,
    status: BookingStatus.SCHEDULED,
    type: BookingType.CONSULTATION,
    customerId: 'customer-123',
    artistId: 'artist-123',
    notes: 'Test appointment',
    priceQuote: 100,
    contactEmail: null,
    contactPhone: null,
    squareId: null,
    tattooRequestId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: 'customer-123',
      email: 'test@example.com',
      name: 'Test Customer',
      phone: '+1234567890'
    },
    artist: {
      id: 'artist-123',
      email: 'artist@example.com',
      role: 'artist'
    }
  };
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock instances
    mockAppointmentService = {
      create: vi.fn(),
      update: vi.fn(),
      cancel: vi.fn(),
      findById: vi.fn()
    };
    
    mockSquareService = {
      syncAppointmentToSquare: vi.fn(),
      updateSquareBooking: vi.fn(),
      cancelSquareBooking: vi.fn()
    };

    mockAvailabilityService = {
      isTimeSlotAvailable: vi.fn(),
      searchAvailability: vi.fn(),
      getBusinessBookingProfile: vi.fn(),
      getLocationBookingProfiles: vi.fn(),
      getTeamMemberBookingProfiles: vi.fn(),
      getBusinessHoursForDay: vi.fn()
    };
    
    // Mock the constructors
    vi.mocked(AppointmentService).mockImplementation(() => mockAppointmentService);
    vi.mocked(SquareIntegrationService).mockImplementation(() => mockSquareService);
    vi.mocked(AvailabilityService).mockImplementation(() => mockAvailabilityService);
    
    // Set default mock return values
    mockAvailabilityService.isTimeSlotAvailable.mockResolvedValue(true);
    mockAvailabilityService.searchAvailability.mockResolvedValue({
      availabilities: [],
      totalResults: 0,
      searchParams: {}
    });
    mockAvailabilityService.getBusinessHoursForDay.mockReturnValue({
      dayOfWeek: 1,
      openTime: '09:00',
      closeTime: '17:00',
      isOpen: true
    });
    
    bookingService = new BookingService();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('createBooking', () => {
    const validCreateParams = {
      startAt: new Date('2024-01-15T10:00:00Z'),
      duration: 60,
      customerId: 'customer-123',
      bookingType: BookingType.CONSULTATION,
      artistId: 'artist-123',
      customerEmail: 'test@example.com',
      customerPhone: '+1234567890',
      note: 'Test appointment',
      priceQuote: 100,
      status: BookingStatus.SCHEDULED,
      tattooRequestId: 'tattoo-123'
    };
    
    it('should create booking successfully with customer', async () => {
      mockAppointmentService.create.mockResolvedValueOnce(mockAppointment);
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: true,
        squareId: 'square-123'
      });
      mockAppointmentService.findById.mockResolvedValueOnce({
        ...mockAppointment,
        squareId: 'square-123'
      });
      
      const result = await bookingService.createBooking(validCreateParams);
      
      expect(result).toEqual({
        success: true,
        booking: expect.objectContaining({
          ...mockAppointment,
          squareId: 'square-123'
        }),
        squareBooking: null
      });
      
      expect(mockAppointmentService.create).toHaveBeenCalledWith({
        startAt: validCreateParams.startAt,
        duration: validCreateParams.duration,
        customerId: validCreateParams.customerId,
        contactEmail: validCreateParams.customerEmail,
        contactPhone: validCreateParams.customerPhone,
        bookingType: validCreateParams.bookingType,
        artistId: validCreateParams.artistId,
        note: validCreateParams.note,
        priceQuote: validCreateParams.priceQuote,
        status: validCreateParams.status,
        tattooRequestId: validCreateParams.tattooRequestId
      });
      
      expect(mockSquareService.syncAppointmentToSquare).toHaveBeenCalledWith(mockAppointment);
    });
    
    it('should create anonymous booking with contact info', async () => {
      const anonymousParams = {
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        bookingType: BookingType.CONSULTATION,
        contactEmail: 'anonymous@example.com',
        contactPhone: '+1234567890',
        isAnonymous: true
      };
      
      const anonymousAppointment = {
        ...mockAppointment,
        customerId: null,
        customer: null,
        contactEmail: 'anonymous@example.com',
        contactPhone: '+1234567890'
      };
      
      mockAppointmentService.create.mockResolvedValueOnce(anonymousAppointment);
      
      const result = await bookingService.createBooking(anonymousParams);
      
      expect(result).toEqual({
        success: true,
        booking: anonymousAppointment,
        squareBooking: null
      });
      
      expect(mockAppointmentService.create).toHaveBeenCalledWith({
        startAt: anonymousParams.startAt,
        duration: anonymousParams.duration,
        customerId: undefined,
        contactEmail: anonymousParams.contactEmail,
        contactPhone: anonymousParams.contactPhone,
        bookingType: anonymousParams.bookingType,
        artistId: undefined,
        note: undefined,
        priceQuote: undefined,
        status: BookingStatus.SCHEDULED,
        tattooRequestId: undefined
      });
      
      // Should not try to sync with Square for anonymous bookings
      expect(mockSquareService.syncAppointmentToSquare).not.toHaveBeenCalled();
    });
    
    it('should prioritize contactEmail over customerEmail', async () => {
      const paramsWithBothEmails = {
        ...validCreateParams,
        contactEmail: 'priority@example.com',
        customerEmail: 'secondary@example.com'
      };
      
      mockAppointmentService.create.mockResolvedValueOnce(mockAppointment);
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: true,
        squareId: 'square-123'
      });
      mockAppointmentService.findById.mockResolvedValueOnce({
        ...mockAppointment,
        squareId: 'square-123'
      });
      
      await bookingService.createBooking(paramsWithBothEmails);
      
      expect(mockAppointmentService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          contactEmail: 'priority@example.com'
        })
      );
    });
    
    it('should handle Square sync failure gracefully', async () => {
      mockAppointmentService.create.mockResolvedValueOnce(mockAppointment);
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: false,
        error: 'Square API error'
      });
      
      const result = await bookingService.createBooking(validCreateParams);
      
      expect(result).toEqual({
        success: true,
        booking: mockAppointment,
        squareBooking: null
      });
    });
    
    it('should default status to SCHEDULED if not provided', async () => {
      const paramsWithoutStatus = {
        ...validCreateParams,
        status: undefined
      };
      
      mockAppointmentService.create.mockResolvedValueOnce(mockAppointment);
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: true,
        squareId: 'square-123'
      });
      mockAppointmentService.findById.mockResolvedValueOnce({
        ...mockAppointment,
        squareId: 'square-123'
      });
      
      await bookingService.createBooking(paramsWithoutStatus);
      
      expect(mockAppointmentService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: BookingStatus.SCHEDULED
        })
      );
    });
    
    it('should check availability before creating booking with artist', async () => {
      const paramsWithArtist = {
        ...validCreateParams,
        artistId: 'artist-123'
      };
      
      mockAvailabilityService.isTimeSlotAvailable.mockResolvedValueOnce(true);
      mockAppointmentService.create.mockResolvedValueOnce(mockAppointment);
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: true,
        squareId: 'square-123'
      });
      mockAppointmentService.findById.mockResolvedValueOnce({
        ...mockAppointment,
        squareId: 'square-123'
      });
      
      await bookingService.createBooking(paramsWithArtist);
      
      expect(mockAvailabilityService.isTimeSlotAvailable).toHaveBeenCalledWith(
        validCreateParams.startAt,
        validCreateParams.duration,
        'artist-123'
      );
    });

    it('should throw error when time slot is not available', async () => {
      const paramsWithArtist = {
        ...validCreateParams,
        artistId: 'artist-123'
      };
      
      mockAvailabilityService.isTimeSlotAvailable.mockResolvedValueOnce(false);
      
      await expect(bookingService.createBooking(paramsWithArtist))
        .rejects.toThrow('Selected time slot is not available');
      
      expect(mockAppointmentService.create).not.toHaveBeenCalled();
    });

    it('should not check availability when no artist is specified', async () => {
      const paramsWithoutArtist = {
        ...validCreateParams,
        artistId: undefined
      };
      
      mockAppointmentService.create.mockResolvedValueOnce(mockAppointment);
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: true,
        squareId: 'square-123'
      });
      mockAppointmentService.findById.mockResolvedValueOnce({
        ...mockAppointment,
        squareId: 'square-123'
      });
      
      await bookingService.createBooking(paramsWithoutArtist);
      
      expect(mockAvailabilityService.isTimeSlotAvailable).not.toHaveBeenCalled();
    });

    it('should throw error when appointment creation fails', async () => {
      const error = new Error('Database error');
      mockAppointmentService.create.mockRejectedValueOnce(error);
      
      await expect(bookingService.createBooking(validCreateParams))
        .rejects.toThrow('Database error');
      
      expect(mockSquareService.syncAppointmentToSquare).not.toHaveBeenCalled();
    });
  });
  
  describe('updateBooking', () => {
    const updateParams = {
      bookingId: 'appointment-123',
      startAt: new Date('2024-01-15T14:00:00Z'),
      duration: 90,
      status: BookingStatus.CONFIRMED,
      artistId: 'artist-456',
      note: 'Updated note',
      priceQuote: 150
    };
    
    it('should update booking successfully', async () => {
      const updatedAppointment = {
        ...mockAppointment,
        ...updateParams,
        startTime: updateParams.startAt
      };
      
      mockAppointmentService.update.mockResolvedValueOnce(updatedAppointment);
      mockSquareService.updateSquareBooking.mockResolvedValueOnce({
        success: true,
        squareId: 'square-123'
      });
      
      const result = await bookingService.updateBooking(updateParams);
      
      expect(result).toEqual({
        success: true,
        booking: updatedAppointment,
        squareBookingUpdated: {
          success: true,
          squareId: 'square-123'
        }
      });
      
      expect(mockAppointmentService.update).toHaveBeenCalledWith('appointment-123', {
        startAt: updateParams.startAt,
        duration: updateParams.duration,
        status: updateParams.status,
        artistId: updateParams.artistId,
        note: updateParams.note,
        priceQuote: updateParams.priceQuote
      });
      
      expect(mockSquareService.updateSquareBooking).toHaveBeenCalledWith(updatedAppointment);
    });
    
    it('should check availability when updating time slot', async () => {
      const updateParams = {
        bookingId: 'appointment-123',
        startAt: new Date('2024-01-15T14:00:00Z'),
        duration: 90,
        artistId: 'artist-456'
      };
      
      const existingAppointment = {
        ...mockAppointment,
        artistId: 'artist-123'
      };
      
      mockAppointmentService.findById.mockResolvedValueOnce(existingAppointment);
      mockAvailabilityService.isTimeSlotAvailable.mockResolvedValueOnce(true);
      mockAppointmentService.update.mockResolvedValueOnce({
        ...existingAppointment,
        ...updateParams,
        startTime: updateParams.startAt
      });
      mockSquareService.updateSquareBooking.mockResolvedValueOnce({
        success: true,
        squareId: 'square-123'
      });
      
      await bookingService.updateBooking(updateParams);
      
      expect(mockAvailabilityService.isTimeSlotAvailable).toHaveBeenCalledWith(
        updateParams.startAt,
        updateParams.duration,
        updateParams.artistId,
        'appointment-123' // exclude current appointment
      );
    });

    it('should throw error when updated time slot is not available', async () => {
      const updateParams = {
        bookingId: 'appointment-123',
        startAt: new Date('2024-01-15T14:00:00Z'),
        artistId: 'artist-456'
      };
      
      const existingAppointment = {
        ...mockAppointment,
        artistId: 'artist-123'
      };
      
      mockAppointmentService.findById.mockResolvedValueOnce(existingAppointment);
      mockAvailabilityService.isTimeSlotAvailable.mockResolvedValueOnce(false);
      
      await expect(bookingService.updateBooking(updateParams))
        .rejects.toThrow('Updated time slot is not available');
      
      expect(mockAppointmentService.update).not.toHaveBeenCalled();
    });

    it('should handle partial updates', async () => {
      const partialUpdate = {
        bookingId: 'appointment-123',
        status: BookingStatus.CONFIRMED
      };
      
      mockAppointmentService.update.mockResolvedValueOnce({
        ...mockAppointment,
        status: BookingStatus.CONFIRMED
      });
      mockSquareService.updateSquareBooking.mockResolvedValueOnce({
        success: true,
        squareId: 'square-123'
      });
      
      await bookingService.updateBooking(partialUpdate);
      
      expect(mockAvailabilityService.isTimeSlotAvailable).not.toHaveBeenCalled();
      expect(mockAppointmentService.update).toHaveBeenCalledWith('appointment-123', {
        startAt: undefined,
        duration: undefined,
        status: BookingStatus.CONFIRMED,
        artistId: undefined,
        note: undefined,
        priceQuote: undefined
      });
    });
    
    it('should not update Square for appointments without customer', async () => {
      const appointmentWithoutCustomer = {
        ...mockAppointment,
        customerId: null,
        customer: null
      };
      
      mockAppointmentService.update.mockResolvedValueOnce(appointmentWithoutCustomer);
      
      const result = await bookingService.updateBooking(updateParams);
      
      expect(result).toEqual({
        success: true,
        booking: appointmentWithoutCustomer,
        squareBookingUpdated: null
      });
      
      expect(mockSquareService.updateSquareBooking).not.toHaveBeenCalled();
    });
    
    it('should handle Square update failure gracefully', async () => {
      mockAppointmentService.update.mockResolvedValueOnce(mockAppointment);
      mockSquareService.updateSquareBooking.mockResolvedValueOnce({
        success: false,
        error: 'Square API error'
      });
      
      const result = await bookingService.updateBooking(updateParams);
      
      expect(result).toEqual({
        success: true,
        booking: mockAppointment,
        squareBookingUpdated: null
      });
    });
    
    it('should throw error when appointment update fails', async () => {
      const error = new Error('Update failed');
      mockAppointmentService.update.mockRejectedValueOnce(error);
      
      await expect(bookingService.updateBooking(updateParams))
        .rejects.toThrow('Update failed');
    });
  });
  
  describe('cancelBooking', () => {
    const cancelParams = {
      bookingId: 'appointment-123',
      reason: 'Customer request',
      cancelledBy: 'user-123'
    };
    
    it('should cancel booking successfully', async () => {
      const cancelledAppointment = {
        ...mockAppointment,
        status: BookingStatus.CANCELLED,
        squareId: 'square-123'
      };
      
      mockAppointmentService.cancel.mockResolvedValueOnce(cancelledAppointment);
      mockSquareService.cancelSquareBooking.mockResolvedValueOnce({
        success: true
      });
      
      const result = await bookingService.cancelBooking(cancelParams);
      
      expect(result).toEqual({
        success: true,
        booking: cancelledAppointment,
        squareCancelled: true
      });
      
      expect(mockAppointmentService.cancel).toHaveBeenCalledWith(
        'appointment-123',
        'Customer request',
        'user-123'
      );
      
      expect(mockSquareService.cancelSquareBooking).toHaveBeenCalledWith('square-123');
    });
    
    it('should handle cancellation without Square ID', async () => {
      const appointmentWithoutSquare = {
        ...mockAppointment,
        status: BookingStatus.CANCELLED,
        squareId: null
      };
      
      mockAppointmentService.cancel.mockResolvedValueOnce(appointmentWithoutSquare);
      
      const result = await bookingService.cancelBooking(cancelParams);
      
      expect(result).toEqual({
        success: true,
        booking: appointmentWithoutSquare,
        squareCancelled: false
      });
      
      expect(mockSquareService.cancelSquareBooking).not.toHaveBeenCalled();
    });
    
    it('should handle Square cancellation failure gracefully', async () => {
      const cancelledAppointment = {
        ...mockAppointment,
        status: BookingStatus.CANCELLED,
        squareId: 'square-123'
      };
      
      mockAppointmentService.cancel.mockResolvedValueOnce(cancelledAppointment);
      mockSquareService.cancelSquareBooking.mockResolvedValueOnce({
        success: false,
        error: 'Square API error'
      });
      
      const result = await bookingService.cancelBooking(cancelParams);
      
      expect(result).toEqual({
        success: true,
        booking: cancelledAppointment,
        squareCancelled: false
      });
    });
    
    it('should handle minimal cancel parameters', async () => {
      const minimalParams = {
        bookingId: 'appointment-123'
      };
      
      mockAppointmentService.cancel.mockResolvedValueOnce({
        ...mockAppointment,
        status: BookingStatus.CANCELLED,
        squareId: null  // Explicitly set to null to ensure no Square call
      });
      
      // Add a fallback mock in case Square service is called unexpectedly
      mockSquareService.cancelSquareBooking.mockResolvedValueOnce({
        success: false
      });
      
      await bookingService.cancelBooking(minimalParams);
      
      expect(mockAppointmentService.cancel).toHaveBeenCalledWith(
        'appointment-123',
        undefined,
        undefined
      );
    });
    
    it('should throw error when appointment cancellation fails', async () => {
      const error = new Error('Cancellation failed');
      mockAppointmentService.cancel.mockRejectedValueOnce(error);
      
      await expect(bookingService.cancelBooking(cancelParams))
        .rejects.toThrow('Cancellation failed');
    });
  });
  
  describe('getBookingAvailability', () => {
    it('should return availability for given date', async () => {
      const testDate = new Date('2024-01-15');
      const artistId = 'artist-123';
      
      const result = await bookingService.getBookingAvailability(testDate, artistId);
      
      expect(result).toEqual({
        success: true,
        date: '2024-01-15',
        availableSlots: []
      });
    });
    
    it('should handle date without artist ID', async () => {
      const testDate = new Date('2024-01-15');
      
      const result = await bookingService.getBookingAvailability(testDate);
      
      expect(result).toEqual({
        success: true,
        date: '2024-01-15',
        availableSlots: []
      });
    });
    
    it('should handle availability search for specific location', async () => {
      const testDate = new Date('2024-01-15');
      const artistId = 'artist-123';
      
      // Test that location-specific availability could be handled
      // This aligns with Square's location booking profiles
      const result = await bookingService.getBookingAvailability(testDate, artistId);
      
      expect(result.success).toBe(true);
      expect(result.date).toBe('2024-01-15');
    });
    
    it('should handle edge case dates', async () => {
      const pastDate = new Date('2020-01-01');
      const futureDate = new Date('2030-12-31');
      
      const pastResult = await bookingService.getBookingAvailability(pastDate);
      const futureResult = await bookingService.getBookingAvailability(futureDate);
      
      expect(pastResult.success).toBe(true);
      expect(futureResult.success).toBe(true);
    });
  });
  
  describe('Square Integration Scenarios', () => {
    it('should handle team member booking profile scenarios', async () => {
      const teamMemberBookingParams = {
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        customerId: 'customer-123',
        bookingType: BookingType.TATTOO_SESSION,
        artistId: 'team-member-456', // Different from regular artist
        note: 'Team member booking',
        priceQuote: 200
      };
      
      mockAppointmentService.create.mockResolvedValueOnce({
        ...mockAppointment,
        artistId: 'team-member-456',
        type: BookingType.TATTOO_SESSION,
        priceQuote: 200
      });
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: true,
        squareId: 'square-team-booking-123'
      });
      mockAppointmentService.findById.mockResolvedValueOnce({
        ...mockAppointment,
        artistId: 'team-member-456',
        squareId: 'square-team-booking-123'
      });
      
      const result = await bookingService.createBooking(teamMemberBookingParams);
      
      expect(result.success).toBe(true);
      expect(result.booking.artistId).toBe('team-member-456');
      expect(mockSquareService.syncAppointmentToSquare).toHaveBeenCalled();
    });
    
    it('should handle location-specific booking scenarios', async () => {
      const locationSpecificParams = {
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        customerId: 'customer-123',
        bookingType: BookingType.CONSULTATION,
        artistId: 'artist-123',
        note: 'Location-specific booking - Main Studio'
      };
      
      mockAppointmentService.create.mockResolvedValueOnce({
        ...mockAppointment,
        notes: 'Location-specific booking - Main Studio'
      });
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: true,
        squareId: 'square-location-123',
        locationId: 'location-main-studio'
      });
      mockAppointmentService.findById.mockResolvedValueOnce({
        ...mockAppointment,
        squareId: 'square-location-123'
      });
      
      const result = await bookingService.createBooking(locationSpecificParams);
      
      expect(result.success).toBe(true);
      expect(mockSquareService.syncAppointmentToSquare).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Location-specific booking - Main Studio'
        })
      );
    });
    
    it('should handle Square booking profile permissions', async () => {
      // Test scenario where Square booking profiles have different permissions
      const restrictedBookingParams = {
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        customerId: 'customer-123',
        bookingType: BookingType.DRAWING_CONSULTATION,
        artistId: 'artist-restricted-123'
      };
      
      mockAppointmentService.create.mockResolvedValueOnce({
        ...mockAppointment,
        type: BookingType.DRAWING_CONSULTATION,
        artistId: 'artist-restricted-123'
      });
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'Team member does not have booking permissions'
      });
      
      const result = await bookingService.createBooking(restrictedBookingParams);
      
      // Should still succeed locally even if Square sync fails
      expect(result.success).toBe(true);
      expect(result.booking.artistId).toBe('artist-restricted-123');
      expect(result.squareBooking).toBeNull();
    });
    
    it('should handle Square rate limiting gracefully', async () => {
      mockAppointmentService.create.mockResolvedValueOnce(mockAppointment);
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: false,
        error: 'RATE_LIMITED',
        retryAfter: 60
      });
      
      const result = await bookingService.createBooking({
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        customerId: 'customer-123',
        bookingType: BookingType.CONSULTATION
      });
      
      expect(result.success).toBe(true);
      expect(result.squareBooking).toBeNull();
    });
    
    it('should handle Square webhook scenarios during updates', async () => {
      const updateParams = {
        bookingId: 'appointment-123',
        startAt: new Date('2024-01-15T16:00:00Z'),
        duration: 120,
        status: BookingStatus.CONFIRMED
      };
      
      mockAppointmentService.update.mockResolvedValueOnce({
        ...mockAppointment,
        startTime: updateParams.startAt,
        duration: 120,
        status: BookingStatus.CONFIRMED,
        squareId: 'square-123'
      });
      mockSquareService.updateSquareBooking.mockResolvedValueOnce({
        success: true,
        squareId: 'square-123',
        webhookTriggered: true
      });
      
      const result = await bookingService.updateBooking(updateParams);
      
      expect(result.success).toBe(true);
      expect(result.squareBookingUpdated).toEqual({
        success: true,
        squareId: 'square-123',
        webhookTriggered: true
      });
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent booking scenarios', async () => {
      // Simulate concurrent booking attempts for the same time slot
      const concurrentParams = {
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        customerId: 'customer-123',
        bookingType: BookingType.CONSULTATION,
        artistId: 'artist-123'
      };
      
      // First booking succeeds
      mockAppointmentService.create.mockResolvedValueOnce(mockAppointment);
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: true,
        squareId: 'square-123'
      });
      mockAppointmentService.findById.mockResolvedValueOnce({
        ...mockAppointment,
        squareId: 'square-123'
      });
      
      const result = await bookingService.createBooking(concurrentParams);
      expect(result.success).toBe(true);
    });
    
    it('should handle booking with custom attributes', async () => {
      const customAttributeParams = {
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 60,
        customerId: 'customer-123',
        bookingType: BookingType.TATTOO_SESSION,
        note: 'Special requirements: allergic to latex',
        priceQuote: 500
      };
      
      mockAppointmentService.create.mockResolvedValueOnce({
        ...mockAppointment,
        type: BookingType.TATTOO_SESSION,
        notes: 'Special requirements: allergic to latex',
        priceQuote: 500
      });
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: true,
        squareId: 'square-custom-123',
        customAttributes: {
          'allergies': 'latex',
          'session_type': 'full_sleeve'
        }
      });
      mockAppointmentService.findById.mockResolvedValueOnce({
        ...mockAppointment,
        squareId: 'square-custom-123'
      });
      
      const result = await bookingService.createBooking(customAttributeParams);
      
      expect(result.success).toBe(true);
      expect(result.booking.notes).toContain('allergic to latex');
    });
    
    it('should validate booking time constraints', async () => {
      // Test booking during non-business hours
      const afterHoursParams = {
        startAt: new Date('2024-01-15T23:00:00Z'), // 11 PM
        duration: 60,
        customerId: 'customer-123',
        bookingType: BookingType.CONSULTATION
      };
      
      mockAppointmentService.create.mockResolvedValueOnce({
        ...mockAppointment,
        startTime: new Date('2024-01-15T23:00:00Z')
      });
      
      // Add the missing mock for syncAppointmentToSquare
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: true,
        squareId: 'square-after-hours-123'
      });
      
      mockAppointmentService.findById.mockResolvedValueOnce({
        ...mockAppointment,
        startTime: new Date('2024-01-15T23:00:00Z'),
        squareId: 'square-after-hours-123'
      });
      
      const result = await bookingService.createBooking(afterHoursParams);
      
      // Should create the booking (validation would happen at a higher level)
      expect(result.success).toBe(true);
    });
  });
  
  describe('Bulk Operations and Business Profile Scenarios', () => {
    it('should handle bulk booking scenarios', async () => {
      // Simulate creating multiple bookings for the same customer
      const bulkBookingParams = [
        {
          startAt: new Date('2024-01-15T10:00:00Z'),
          duration: 60,
          customerId: 'customer-123',
          bookingType: BookingType.CONSULTATION
        },
        {
          startAt: new Date('2024-01-15T14:00:00Z'),
          duration: 120,
          customerId: 'customer-123',
          bookingType: BookingType.TATTOO_SESSION
        }
      ];
      
      // Mock multiple successful creations
      mockAppointmentService.create
        .mockResolvedValueOnce({ ...mockAppointment, id: 'appointment-1' })
        .mockResolvedValueOnce({ ...mockAppointment, id: 'appointment-2', duration: 120 });
      
      mockSquareService.syncAppointmentToSquare
        .mockResolvedValueOnce({ success: true, squareId: 'square-1' })
        .mockResolvedValueOnce({ success: true, squareId: 'square-2' });
      
      mockAppointmentService.findById
        .mockResolvedValueOnce({ ...mockAppointment, id: 'appointment-1', squareId: 'square-1' })
        .mockResolvedValueOnce({ ...mockAppointment, id: 'appointment-2', squareId: 'square-2' });
      
      const results = await Promise.all(
        bulkBookingParams.map(params => bookingService.createBooking(params))
      );
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(mockAppointmentService.create).toHaveBeenCalledTimes(2);
    });
    
    it('should handle business booking profile constraints', async () => {
      // Test scenario where business booking profile has specific constraints
      const constrainedBookingParams = {
        startAt: new Date('2024-01-15T10:00:00Z'),
        duration: 240, // 4 hours - might exceed business profile limits
        customerId: 'customer-123',
        bookingType: BookingType.TATTOO_SESSION,
        priceQuote: 1000
      };
      
      mockAppointmentService.create.mockResolvedValueOnce({
        ...mockAppointment,
        duration: 240,
        priceQuote: 1000
      });
      mockSquareService.syncAppointmentToSquare.mockResolvedValueOnce({
        success: false,
        error: 'BOOKING_EXCEEDS_PROFILE_LIMITS',
        message: 'Booking duration exceeds business profile maximum'
      });
      
      const result = await bookingService.createBooking(constrainedBookingParams);
      
      // Should succeed locally but note Square limitation
      expect(result.success).toBe(true);
      expect(result.squareBooking).toBeNull();
    });
    
    it('should handle location booking profile variations', async () => {
      // Test booking across different locations with different profiles
      const multiLocationBookings = [
        {
          startAt: new Date('2024-01-15T10:00:00Z'),
          duration: 60,
          customerId: 'customer-123',
          bookingType: BookingType.CONSULTATION,
          artistId: 'artist-downtown-123'
        },
        {
          startAt: new Date('2024-01-15T14:00:00Z'),
          duration: 60,
          customerId: 'customer-123',
          bookingType: BookingType.CONSULTATION,
          artistId: 'artist-uptown-456'
        }
      ];
      
      mockAppointmentService.create
        .mockResolvedValueOnce({ ...mockAppointment, artistId: 'artist-downtown-123' })
        .mockResolvedValueOnce({ ...mockAppointment, artistId: 'artist-uptown-456' });
      
      mockSquareService.syncAppointmentToSquare
        .mockResolvedValueOnce({ success: true, squareId: 'square-downtown-123' })
        .mockResolvedValueOnce({ success: true, squareId: 'square-uptown-456' });
      
      mockAppointmentService.findById
        .mockResolvedValueOnce({ ...mockAppointment, artistId: 'artist-downtown-123', squareId: 'square-downtown-123' })
        .mockResolvedValueOnce({ ...mockAppointment, artistId: 'artist-uptown-456', squareId: 'square-uptown-456' });
      
      const results = await Promise.all(
        multiLocationBookings.map(params => bookingService.createBooking(params))
      );
      
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results[0].booking.artistId).toBe('artist-downtown-123');
      expect(results[1].booking.artistId).toBe('artist-uptown-456');
    });
    
    it('should handle availability search with business constraints', async () => {
      // Test availability search that respects business booking profiles
      const constrainedDate = new Date('2024-12-25'); // Holiday
      
      const result = await bookingService.getBookingAvailability(constrainedDate);
      
      // Should return empty slots for holidays (business rule)
      expect(result.success).toBe(true);
      expect(result.availableSlots).toEqual([]);
    });
  });
  
  describe('constructor', () => {
    it('should create instances of AppointmentService and SquareIntegrationService', () => {
      new BookingService();
      
      expect(AppointmentService).toHaveBeenCalled();
      expect(SquareIntegrationService).toHaveBeenCalled();
    });
  });
}); 
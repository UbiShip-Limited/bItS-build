import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SquareIntegrationService } from '../squareIntegrationService';
import type { Appointment } from '@prisma/client';

// Mock Square client
vi.mock('../../square/index', () => ({
  default: {
    fromEnv: vi.fn(() => ({
      createBooking: vi.fn(),
      getBookingById: vi.fn(),
      cancelBooking: vi.fn()
    }))
  }
}));

// Mock prisma
vi.mock('../../prisma/prisma', () => ({
  prisma: {
    customer: {
      findUnique: vi.fn()
    },
    appointment: {
      update: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    }
  }
}));

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-123')
}));

describe('SquareIntegrationService', () => {
  let squareService: SquareIntegrationService;
  let mockPrisma: any;
  let mockSquareClient: any;
  
  const mockAppointment: Appointment = {
    id: 'appointment-123',
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T11:00:00Z'),
    duration: 60,
    status: 'scheduled',
    type: 'consultation',
    customerId: 'customer-123',
    artistId: 'artist-123',
    notes: 'Test appointment notes',
    priceQuote: 100,
    contactEmail: null,
    contactPhone: null,
    squareId: null,
    tattooRequestId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const mockCustomer = {
    id: 'customer-123',
    email: 'test@example.com',
    name: 'Test Customer',
    phone: '+1234567890',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  beforeEach(async () => {
    vi.clearAllMocks();
    squareService = new SquareIntegrationService();
    
    // Set environment variables
    process.env.SQUARE_LOCATION_ID = 'test-location-id';
    process.env.NODE_ENV = 'test';
    
    // Get the mocked instances
    const { prisma } = await import('../../prisma/prisma');
    const SquareClient = (await import('../../square/index')).default;
    
    mockPrisma = prisma;
    mockSquareClient = SquareClient.fromEnv();
    
    // Setup default mocks
    mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
    mockPrisma.appointment.update.mockResolvedValue(mockAppointment);
    mockPrisma.auditLog.create.mockResolvedValue({});
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('syncAppointmentToSquare', () => {
    it('should successfully sync appointment to Square', async () => {
      const squareBookingResponse = {
        result: {
          booking: {
            id: 'square-booking-123',
            version: 1
          }
        }
      };
      
      mockSquareClient.createBooking.mockResolvedValueOnce(squareBookingResponse);
      
      const result = await squareService.syncAppointmentToSquare(mockAppointment);
      
      expect(result).toEqual({
        squareId: 'square-booking-123'
      });
      
      expect(mockSquareClient.createBooking).toHaveBeenCalledWith({
        startAt: mockAppointment.startTime?.toISOString(),
        locationId: 'test-location-id',
        customerId: mockCustomer.email,
        duration: 60,
        idempotencyKey: 'mock-uuid-123',
        staffId: 'artist-123',
        note: 'consultation - Test appointment notes'
      });
      
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        data: { squareId: 'square-booking-123' }
      });
    });
    
    it('should skip sync for appointment without customer ID', async () => {
      const appointmentWithoutCustomer = {
        ...mockAppointment,
        customerId: null
      };
      
      const result = await squareService.syncAppointmentToSquare(appointmentWithoutCustomer);
      
      expect(result).toEqual({
        error: 'No customer ID - skipping Square sync for anonymous appointment'
      });
      
      expect(mockSquareClient.createBooking).not.toHaveBeenCalled();
    });
    
    it('should handle customer not found error', async () => {
      mockPrisma.customer.findUnique.mockResolvedValueOnce(null);
      
      const result = await squareService.syncAppointmentToSquare(mockAppointment);
      
      expect(result).toEqual({
        error: 'Customer not found or missing email'
      });
      
      expect(mockSquareClient.createBooking).not.toHaveBeenCalled();
    });
    
    it('should handle customer without email', async () => {
      const customerWithoutEmail = {
        ...mockCustomer,
        email: null
      };
      
      mockPrisma.customer.findUnique.mockResolvedValueOnce(customerWithoutEmail);
      
      const result = await squareService.syncAppointmentToSquare(mockAppointment);
      
      expect(result).toEqual({
        error: 'Customer not found or missing email'
      });
    });
    
    it('should handle Square API error', async () => {
      const apiError = new Error('Square API error');
      mockSquareClient.createBooking.mockRejectedValueOnce(apiError);
      
      const result = await squareService.syncAppointmentToSquare(mockAppointment);
      
      expect(result).toEqual({
        error: 'Square API error'
      });
      
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'square_sync_failed',
          resource: 'appointment',
          resourceId: 'appointment-123',
          resourceType: 'appointment',
          details: JSON.stringify({
            error: 'Square API error',
            errorDetails: 'Square API error',
            severity: 'medium'
          })
        }
      });
    });
    
    it('should handle Square booking created but no ID returned', async () => {
      const squareBookingResponse = {
        result: {
          booking: {} // No ID in response
        }
      };
      
      mockSquareClient.createBooking.mockResolvedValueOnce(squareBookingResponse);
      
      const result = await squareService.syncAppointmentToSquare(mockAppointment);
      
      expect(result).toEqual({
        error: 'Square booking created but no ID returned'
      });
    });
    
    it('should handle appointment without start time', async () => {
      const appointmentWithoutStartTime = {
        ...mockAppointment,
        startTime: null
      };
      
      const squareBookingResponse = {
        result: {
          booking: {
            id: 'square-booking-123'
          }
        }
      };
      
      mockSquareClient.createBooking.mockResolvedValueOnce(squareBookingResponse);
      
      const result = await squareService.syncAppointmentToSquare(appointmentWithoutStartTime);
      
      expect(result.squareId).toBe('square-booking-123');
      
      // Should use current date as fallback
      expect(mockSquareClient.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          startAt: expect.any(String)
        })
      );
    });
    
    it('should handle appointment without notes', async () => {
      const appointmentWithoutNotes = {
        ...mockAppointment,
        notes: null
      };
      
      const squareBookingResponse = {
        result: {
          booking: {
            id: 'square-booking-123'
          }
        }
      };
      
      mockSquareClient.createBooking.mockResolvedValueOnce(squareBookingResponse);
      
      await squareService.syncAppointmentToSquare(appointmentWithoutNotes);
      
      expect(mockSquareClient.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          note: 'consultation'
        })
      );
    });
  });
  
  describe('updateSquareBooking', () => {
    it('should update Square booking by canceling and recreating', async () => {
      const appointmentWithSquareId = {
        ...mockAppointment,
        squareId: 'existing-square-123'
      };
      
      const existingBookingResponse = {
        result: {
          booking: {
            id: 'existing-square-123',
            version: 1
          }
        }
      };
      
      const newBookingResponse = {
        result: {
          booking: {
            id: 'new-square-456',
            version: 1
          }
        }
      };
      
      mockSquareClient.getBookingById.mockResolvedValueOnce(existingBookingResponse);
      mockSquareClient.cancelBooking.mockResolvedValueOnce({ result: true });
      mockSquareClient.createBooking.mockResolvedValueOnce(newBookingResponse);
      
      const result = await squareService.updateSquareBooking(appointmentWithSquareId);
      
      expect(result).toEqual({
        success: true,
        newSquareId: 'new-square-456'
      });
      
      expect(mockSquareClient.cancelBooking).toHaveBeenCalledWith({
        bookingId: 'existing-square-123',
        bookingVersion: 1,
        idempotencyKey: expect.stringContaining('cancel-existing-square-123-')
      });
      
      expect(mockPrisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        data: { squareId: 'new-square-456' }
      });
    });
    
    it('should sync appointment if no Square ID exists', async () => {
      const appointmentWithoutSquareId = {
        ...mockAppointment,
        squareId: null
      };
      
      const squareBookingResponse = {
        result: {
          booking: {
            id: 'new-square-123'
          }
        }
      };
      
      mockSquareClient.createBooking.mockResolvedValueOnce(squareBookingResponse);
      
      const result = await squareService.updateSquareBooking(appointmentWithoutSquareId);
      
      expect(result).toEqual({
        success: true,
        newSquareId: 'new-square-123'
      });
      
      // Should not try to cancel since there's no existing Square booking
      expect(mockSquareClient.cancelBooking).not.toHaveBeenCalled();
    });
    
    it('should handle customer not found during update', async () => {
      const appointmentWithSquareId = {
        ...mockAppointment,
        squareId: 'existing-square-123'
      };
      
      mockPrisma.customer.findUnique.mockResolvedValueOnce(null);
      
      const result = await squareService.updateSquareBooking(appointmentWithSquareId);
      
      expect(result).toEqual({
        success: false,
        error: 'Customer not found or missing email'
      });
    });
    
    it('should handle cancel failure during update', async () => {
      const appointmentWithSquareId = {
        ...mockAppointment,
        squareId: 'existing-square-123'
      };
      
      const existingBookingResponse = {
        result: {
          booking: {
            id: 'existing-square-123',
            version: 1
          }
        }
      };
      
      mockSquareClient.getBookingById.mockResolvedValueOnce(existingBookingResponse);
      mockSquareClient.cancelBooking.mockResolvedValueOnce({
        success: false,
        error: 'Cancel failed'
      });
      
      const result = await squareService.updateSquareBooking(appointmentWithSquareId);
      
      expect(result).toEqual({
        success: false,
        error: 'Cancel failed'
      });
    });
    
    it('should continue if cancel returns not found (booking already canceled)', async () => {
      const appointmentWithSquareId = {
        ...mockAppointment,
        squareId: 'existing-square-123'
      };
      
      const existingBookingResponse = {
        result: {
          booking: {
            id: 'existing-square-123',
            version: 1
          }
        }
      };
      
      const newBookingResponse = {
        result: {
          booking: {
            id: 'new-square-456'
          }
        }
      };
      
      mockSquareClient.getBookingById.mockResolvedValueOnce(existingBookingResponse);
      mockSquareClient.cancelBooking.mockResolvedValueOnce({
        success: false,
        notFound: true
      });
      mockSquareClient.createBooking.mockResolvedValueOnce(newBookingResponse);
      
      const result = await squareService.updateSquareBooking(appointmentWithSquareId);
      
      expect(result).toEqual({
        success: true,
        newSquareId: 'new-square-456'
      });
    });
    
    it('should handle update API error', async () => {
      const appointmentWithSquareId = {
        ...mockAppointment,
        squareId: 'existing-square-123'
      };
      
      const apiError = new Error('Update API error');
      mockSquareClient.getBookingById.mockRejectedValueOnce(apiError);
      
      const result = await squareService.updateSquareBooking(appointmentWithSquareId);
      
      expect(result).toEqual({
        success: false,
        error: 'Update API error'
      });
      
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'square_update_failed',
          resource: 'appointment',
          resourceId: 'appointment-123',
          resourceType: 'appointment',
          details: JSON.stringify({
            error: 'Update API error',
            errorDetails: 'Update API error',
            severity: 'medium'
          })
        }
      });
    });
  });
  
  describe('cancelSquareBooking', () => {
    it('should successfully cancel Square booking', async () => {
      const squareId = 'square-booking-123';
      
      const getBookingResponse = {
        result: {
          booking: {
            id: squareId,
            version: 2
          }
        }
      };
      
      const cancelResponse = {
        result: true
      };
      
      mockSquareClient.getBookingById.mockResolvedValueOnce(getBookingResponse);
      mockSquareClient.cancelBooking.mockResolvedValueOnce(cancelResponse);
      
      const result = await squareService.cancelSquareBooking(squareId);
      
      expect(result).toEqual({
        success: true
      });
      
      expect(mockSquareClient.getBookingById).toHaveBeenCalledWith(squareId);
      expect(mockSquareClient.cancelBooking).toHaveBeenCalledWith({
        bookingId: squareId,
        bookingVersion: 2,
        idempotencyKey: expect.stringContaining(`cancel-${squareId}-`)
      });
    });
    
    it('should handle booking not found during get', async () => {
      const squareId = 'non-existent-booking';
      
      mockSquareClient.getBookingById.mockResolvedValueOnce({
        result: null
      });
      
      const result = await squareService.cancelSquareBooking(squareId);
      
      expect(result).toEqual({
        success: false,
        notFound: true,
        error: 'Square booking not found'
      });
      
      expect(mockSquareClient.cancelBooking).not.toHaveBeenCalled();
    });
    
    it('should handle booking without result', async () => {
      const squareId = 'square-booking-123';
      
      mockSquareClient.getBookingById.mockResolvedValueOnce({});
      
      const result = await squareService.cancelSquareBooking(squareId);
      
      expect(result).toEqual({
        success: false,
        notFound: true,
        error: 'Square booking not found'
      });
    });
    
    it('should handle 404 error during cancel', async () => {
      const squareId = 'square-booking-123';
      
      const getBookingResponse = {
        result: {
          booking: {
            id: squareId,
            version: 1
          }
        }
      };
      
      const notFoundError = new Error('Booking not found');
      notFoundError.statusCode = 404;
      
      mockSquareClient.getBookingById.mockResolvedValueOnce(getBookingResponse);
      mockSquareClient.cancelBooking.mockRejectedValueOnce(notFoundError);
      
      const result = await squareService.cancelSquareBooking(squareId);
      
      expect(result).toEqual({
        success: false,
        notFound: true,
        error: 'Square booking not found'
      });
    });
    
    it('should handle "not found" in error message', async () => {
      const squareId = 'square-booking-123';
      
      const getBookingResponse = {
        result: {
          booking: {
            id: squareId,
            version: 1
          }
        }
      };
      
      const notFoundError = new Error('Resource not found');
      
      mockSquareClient.getBookingById.mockResolvedValueOnce(getBookingResponse);
      mockSquareClient.cancelBooking.mockRejectedValueOnce(notFoundError);
      
      const result = await squareService.cancelSquareBooking(squareId);
      
      expect(result).toEqual({
        success: false,
        notFound: true,
        error: 'Square booking not found'
      });
    });
    
    it('should handle other cancel errors', async () => {
      const squareId = 'square-booking-123';
      
      const getBookingResponse = {
        result: {
          booking: {
            id: squareId,
            version: 1
          }
        }
      };
      
      const cancelError = new Error('Cancel API error');
      
      mockSquareClient.getBookingById.mockResolvedValueOnce(getBookingResponse);
      mockSquareClient.cancelBooking.mockRejectedValueOnce(cancelError);
      
      const result = await squareService.cancelSquareBooking(squareId);
      
      expect(result).toEqual({
        success: false,
        error: 'Cancel API error'
      });
    });
    
    it('should handle booking with no version', async () => {
      const squareId = 'square-booking-123';
      
      const getBookingResponse = {
        result: {
          booking: {
            id: squareId
            // No version property
          }
        }
      };
      
      const cancelResponse = {
        result: true
      };
      
      mockSquareClient.getBookingById.mockResolvedValueOnce(getBookingResponse);
      mockSquareClient.cancelBooking.mockResolvedValueOnce(cancelResponse);
      
      const result = await squareService.cancelSquareBooking(squareId);
      
      expect(result.success).toBe(true);
      
      expect(mockSquareClient.cancelBooking).toHaveBeenCalledWith({
        bookingId: squareId,
        bookingVersion: 0, // Default version
        idempotencyKey: expect.any(String)
      });
    });
  });
  
  describe('Error Logging', () => {
    it('should log errors with high severity in production', async () => {
      process.env.NODE_ENV = 'production';
      
      const apiError = new Error('Production API error');
      mockSquareClient.createBooking.mockRejectedValueOnce(apiError);
      
      await squareService.syncAppointmentToSquare(mockAppointment);
      
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'square_sync_failed',
          resource: 'appointment',
          resourceId: 'appointment-123',
          resourceType: 'appointment',
          details: JSON.stringify({
            error: 'Production API error',
            errorDetails: 'Production API error',
            severity: 'high'
          })
        }
      });
    });
    
    it('should handle logging errors gracefully', async () => {
      const apiError = new Error('Square API error');
      const logError = new Error('Logging failed');
      
      mockSquareClient.createBooking.mockRejectedValueOnce(apiError);
      mockPrisma.auditLog.create.mockRejectedValueOnce(logError);
      
      // Should not throw even if logging fails
      const result = await squareService.syncAppointmentToSquare(mockAppointment);
      
      expect(result).toEqual({
        error: 'Square API error'
      });
    });
    
    it('should handle error objects with additional properties', async () => {
      const apiError = {
        message: 'Square validation error',
        errors: [{ field: 'customerId', code: 'INVALID' }]
      };
      
      mockSquareClient.createBooking.mockRejectedValueOnce(apiError);
      
      await squareService.syncAppointmentToSquare(mockAppointment);
      
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'square_sync_failed',
          resource: 'appointment',
          resourceId: 'appointment-123',
          resourceType: 'appointment',
          details: JSON.stringify({
            error: 'Square validation error',
            errorDetails: [{ field: 'customerId', code: 'INVALID' }],
            severity: 'medium'
          })
        }
      });
    });
  });
  
  describe('Environment Configuration', () => {
    it('should use environment location ID', async () => {
      process.env.SQUARE_LOCATION_ID = 'env-location-123';
      
      const squareBookingResponse = {
        result: {
          booking: {
            id: 'square-booking-123'
          }
        }
      };
      
      mockSquareClient.createBooking.mockResolvedValueOnce(squareBookingResponse);
      
      await squareService.syncAppointmentToSquare(mockAppointment);
      
      expect(mockSquareClient.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          locationId: 'env-location-123'
        })
      );
    });
  });
}); 
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppointmentService } from '../appointmentService';
import { prisma } from '../../prisma/prisma';
import { BookingStatus, BookingType } from '../../types/booking';
import { ValidationError, NotFoundError } from '../errors';

// Mock prisma
vi.mock('../../prisma/prisma', () => ({
  prisma: {
    customer: {
      findUnique: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    },
    appointment: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    },
    $transaction: vi.fn()
  }
}));

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;
  
  const mockCustomer = {
    id: 'customer-123',
    email: 'test@example.com',
    name: 'Test Customer',
    phone: '+1234567890',
    createdAt: new Date(),
    updatedAt: new Date(),
    notes: null,
    squareId: null
  };
  
  const mockArtist = {
    id: 'artist-123',
    email: 'artist@example.com',
    password: null,
    role: 'artist',
    name: 'Test Artist',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const mockAppointment = {
    id: 'appointment-123',
    startTime: new Date(Date.now() + 86400000), // Tomorrow
    endTime: new Date(Date.now() + 86400000 + 3600000), // Tomorrow + 1 hour
    duration: 60,
    status: BookingStatus.SCHEDULED,
    type: BookingType.CONSULTATION,
    customerId: 'customer-123',
    artistId: 'artist-123',
    customer: mockCustomer,
    artist: mockArtist,
    tattooRequest: null,
    tattooRequestId: null,
    notes: 'Test appointment',
    priceQuote: 100,
    contactEmail: null,
    contactPhone: null,
    squareId: null,
    date: null,
    paymentId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  beforeEach(() => {
    appointmentService = new AppointmentService();
    vi.clearAllMocks();
    
    // Mock transaction to execute the callback immediately
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return await callback(prisma);
    });
    
    // Default mocks for common operations
    vi.mocked(prisma.customer.findUnique).mockResolvedValue(mockCustomer);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockArtist);
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([]); // No conflicts by default
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('create', () => {
    const validCreateData = {
      startAt: new Date(Date.now() + 86400000), // Tomorrow
      duration: 60,
      customerId: 'customer-123',
      bookingType: BookingType.CONSULTATION,
      artistId: 'artist-123',
      note: 'Test appointment',
      priceQuote: 100
    };
    
    it('should create appointment with customer ID', async () => {
      vi.mocked(prisma.appointment.create).mockResolvedValueOnce(mockAppointment);
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any);
      
      const result = await appointmentService.create(validCreateData);
      
      expect(result).toEqual(mockAppointment);
      expect(prisma.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'customer-123' }
      });
      expect(prisma.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          startTime: validCreateData.startAt,
          endTime: new Date(validCreateData.startAt.getTime() + 60 * 60000),
          duration: 60,
          status: BookingStatus.SCHEDULED,
          type: BookingType.CONSULTATION,
          notes: 'Test appointment',
          priceQuote: 100,
          customer: { connect: { id: 'customer-123' } },
          artist: { connect: { id: 'artist-123' } }
        }),
        include: {
          customer: true,
          artist: true,
          tattooRequest: true
        }
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'appointment_created',
          resource: 'Appointment',
          resourceId: 'appointment-123'
        })
      });
    });
    
    it('should create anonymous appointment with contact info', async () => {
      const anonymousData = {
        startAt: new Date(Date.now() + 86400000), // Tomorrow
        duration: 60,
        contactEmail: 'anonymous@example.com',
        contactPhone: '+1234567890',
        bookingType: BookingType.CONSULTATION
      };
      
      const anonymousAppointment = {
        ...mockAppointment,
        customerId: null,
        customer: null,
        contactEmail: 'anonymous@example.com',
        contactPhone: '+1234567890'
      };
      
      vi.mocked(prisma.appointment.create).mockResolvedValueOnce(anonymousAppointment);
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any);
      
      const result = await appointmentService.create(anonymousData);
      
      expect(result).toEqual(anonymousAppointment);
      expect(prisma.customer.findUnique).not.toHaveBeenCalled();
      expect(prisma.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contactEmail: 'anonymous@example.com',
          contactPhone: '+1234567890'
        }),
        include: {
          customer: true,
          artist: true,
          tattooRequest: true
        }
      });
    });
    
    it('should throw ValidationError if neither customerId nor contactEmail provided', async () => {
      const invalidData = {
        startAt: new Date(Date.now() + 86400000), // Future date to pass date validation
        duration: 60,
        bookingType: BookingType.CONSULTATION
      };
      
      await expect(appointmentService.create(invalidData))
        .rejects.toThrow(ValidationError);
      await expect(appointmentService.create(invalidData))
        .rejects.toThrow('Either customer ID or contact email is required');
    });
    
    it('should throw NotFoundError if customer does not exist', async () => {
      vi.mocked(prisma.customer.findUnique).mockReset();
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(null);
      
      await expect(appointmentService.create(validCreateData))
        .rejects.toThrow(NotFoundError);
      await expect(appointmentService.create(validCreateData))
        .rejects.toThrow('Customer with id customer-123 not found');
    });
    
    it('should handle Prisma unique constraint violation', async () => {
      vi.mocked(prisma.appointment.create).mockRejectedValueOnce({
        code: 'P2002',
        message: 'Unique constraint violation'
      });
      
      await expect(appointmentService.create(validCreateData))
        .rejects.toThrow(ValidationError);
    });
    
    it('should connect tattoo request if provided', async () => {
      const dataWithTattooRequest = {
        ...validCreateData,
        tattooRequestId: 'tattoo-request-123'
      };
      
      vi.mocked(prisma.appointment.create).mockResolvedValueOnce({
        ...mockAppointment,
        tattooRequestId: 'tattoo-request-123'
      } as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any);
      
      await appointmentService.create(dataWithTattooRequest);
      
      expect(prisma.appointment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tattooRequest: { connect: { id: 'tattoo-request-123' } }
        }),
        include: {
          customer: true,
          artist: true,
          tattooRequest: true
        }
      });
    });
    
    it('should validate artist exists if artistId provided', async () => {
      vi.mocked(prisma.user.findUnique).mockReset();
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      
      await expect(appointmentService.create(validCreateData))
        .rejects.toThrow(NotFoundError);
      await expect(appointmentService.create(validCreateData))
        .rejects.toThrow('Artist with id artist-123 not found');
    });
    
    it('should throw ValidationError for appointment in the past', async () => {
      const pastData = {
        ...validCreateData,
        startAt: new Date('2020-01-01T10:00:00Z') // Past date
      };
      
      await expect(appointmentService.create(pastData))
        .rejects.toThrow(ValidationError);
      await expect(appointmentService.create(pastData))
        .rejects.toThrow('Appointment date must be in the future');
    });
    
    it('should throw ValidationError for invalid duration', async () => {
      const invalidDurationData = {
        ...validCreateData,
        startAt: new Date(Date.now() + 86400000), // Future date 
        duration: 0
      };
      
      await expect(appointmentService.create(invalidDurationData))
        .rejects.toThrow(ValidationError);
      await expect(appointmentService.create(invalidDurationData))
        .rejects.toThrow('Duration must be a positive number');
    });
    
    it('should throw ValidationError for duration too short', async () => {
      const shortDurationData = {
        ...validCreateData,
        startAt: new Date(Date.now() + 86400000), // Future date
        duration: 10 // Less than 15 minutes
      };
      
      await expect(appointmentService.create(shortDurationData))
        .rejects.toThrow(ValidationError);
      await expect(appointmentService.create(shortDurationData))
        .rejects.toThrow('Minimum appointment duration is 15 minutes');
    });
    
    it('should throw ValidationError for duration too long', async () => {
      const longDurationData = {
        ...validCreateData,
        startAt: new Date(Date.now() + 86400000), // Future date
        duration: 500 // More than 8 hours
      };
      
      await expect(appointmentService.create(longDurationData))
        .rejects.toThrow(ValidationError);
      await expect(appointmentService.create(longDurationData))
        .rejects.toThrow('Maximum appointment duration is 8 hours');
    });
    
    it('should throw ValidationError for negative price quote', async () => {
      const negativeQuoteData = {
        ...validCreateData,
        startAt: new Date(Date.now() + 86400000), // Future date
        priceQuote: -50
      };
      
      await expect(appointmentService.create(negativeQuoteData))
        .rejects.toThrow(ValidationError);
      await expect(appointmentService.create(negativeQuoteData))
        .rejects.toThrow('Price quote must be a positive number');
    });
    
    it('should check for time conflicts when artist is specified', async () => {
      const futureData = {
        ...validCreateData,
        startAt: new Date(Date.now() + 86400000) // Tomorrow
      };
      
      // Reset and mock conflict found - for multiple calls
      vi.mocked(prisma.appointment.findMany).mockReset();
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([
        { 
          id: 'existing-123', 
          startTime: new Date(Date.now() + 86400000), 
          endTime: new Date(Date.now() + 86400000 + 3600000) 
        }
      ] as any);
      
      await expect(appointmentService.create(futureData))
        .rejects.toThrow(ValidationError);
      
      // Reset for the second call
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([
        { 
          id: 'existing-123', 
          startTime: new Date(Date.now() + 86400000), 
          endTime: new Date(Date.now() + 86400000 + 3600000) 
        }
      ] as any);
      
      await expect(appointmentService.create(futureData))
        .rejects.toThrow('Time conflict detected');
    });
  });
  
  describe('update', () => {
    const updateData = {
      startAt: new Date(Date.now() + 172800000), // Day after tomorrow
      duration: 90,
      status: BookingStatus.CONFIRMED,
      note: 'Updated note',
      priceQuote: 150
    };
    
    beforeEach(() => {
      vi.mocked(prisma.appointment.findUnique).mockResolvedValue(mockAppointment);
      vi.mocked(prisma.appointment.findMany).mockResolvedValue([]); // No conflicts
    });
    
    it('should update appointment successfully', async () => {
      const updatedAppointment = {
        ...mockAppointment,
        startTime: updateData.startAt,
        endTime: new Date(updateData.startAt!.getTime() + 90 * 60000),
        duration: 90,
        status: BookingStatus.CONFIRMED,
        notes: 'Updated note',
        priceQuote: 150
      };
      
      vi.mocked(prisma.appointment.update).mockResolvedValueOnce(updatedAppointment);
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any);
      
      const result = await appointmentService.update('appointment-123', updateData);
      
      expect(result).toEqual(updatedAppointment);
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        data: {
          startTime: updateData.startAt,
          endTime: new Date(updateData.startAt!.getTime() + 90 * 60000),
          duration: 90,
          status: BookingStatus.CONFIRMED,
          notes: 'Updated note',
          priceQuote: 150
        },
        include: {
          customer: true,
          artist: true,
          tattooRequest: true
        }
      });
    });
    
    it('should update only duration and recalculate end time', async () => {
      vi.mocked(prisma.appointment.update).mockResolvedValueOnce({
        ...mockAppointment,
        duration: 120,
        endTime: new Date(mockAppointment.startTime.getTime() + 120 * 60000)
      });
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any);
      
      await appointmentService.update('appointment-123', { duration: 120 });
      
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        data: {
          duration: 120,
          endTime: new Date(mockAppointment.startTime.getTime() + 120 * 60000)
        },
        include: {
          customer: true,
          artist: true,
          tattooRequest: true
        }
      });
    });
    
    it('should disconnect artist when artistId is empty string', async () => {
      vi.mocked(prisma.appointment.update).mockResolvedValueOnce({
        ...mockAppointment,
        artistId: null,
        artist: null
      } as any);
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any);
      
      await appointmentService.update('appointment-123', { artistId: '' });
      
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        data: {
          artist: { disconnect: true }
        },
        include: {
          customer: true,
          artist: true,
          tattooRequest: true
        }
      });
    });
    
    it('should throw NotFoundError if appointment does not exist', async () => {
      vi.mocked(prisma.appointment.findUnique).mockReset();
      vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce(null);
      
      await expect(appointmentService.update('non-existent', updateData))
        .rejects.toThrow(NotFoundError);
    });
    
    it('should validate artist exists when updating artistId', async () => {
      vi.mocked(prisma.user.findUnique).mockReset();
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);
      
      await expect(appointmentService.update('appointment-123', { artistId: 'non-existent-artist' }))
        .rejects.toThrow(NotFoundError);
      await expect(appointmentService.update('appointment-123', { artistId: 'non-existent-artist' }))
        .rejects.toThrow('Artist with id non-existent-artist not found');
    });
    
    it('should check time conflicts when updating start time with existing artist', async () => {
      const appointmentWithArtist = { ...mockAppointment, artistId: 'artist-123' };
      vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce(appointmentWithArtist);
      vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([
        { 
          id: 'conflict-123', 
          startTime: new Date(Date.now() + 172800000), // Day after tomorrow
          endTime: new Date(Date.now() + 172800000 + 3600000) // + 1 hour
        }
      ] as any);
      
      await expect(appointmentService.update('appointment-123', { 
        startAt: new Date(Date.now() + 172800000 + 1800000) // Overlapping time
      })).rejects.toThrow(ValidationError);
    });
  });
  
  describe('cancel', () => {
    it('should cancel appointment successfully', async () => {
      const cancelledAppointment = {
        ...mockAppointment,
        status: BookingStatus.CANCELLED,
        notes: 'Test appointment\n\nCancellation reason: Customer request'
      };
      
      vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce(mockAppointment);
      vi.mocked(prisma.appointment.update).mockResolvedValueOnce(cancelledAppointment);
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any);
      
      const result = await appointmentService.cancel(
        'appointment-123', 
        'Customer request', 
        'user-123'
      );
      
      expect(result).toEqual(cancelledAppointment);
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        data: {
          status: BookingStatus.CANCELLED,
          notes: 'Test appointment\n\nCancellation reason: Customer request'
        },
        include: {
          customer: true,
          artist: true
        }
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'appointment_cancelled',
          userId: 'user-123',
          details: {
            reason: 'Customer request',
            previousStatus: BookingStatus.SCHEDULED
          }
        })
      });
    });
    
    it('should handle cancellation without reason', async () => {
      vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce({
        ...mockAppointment,
        notes: null
      });
      vi.mocked(prisma.appointment.update).mockResolvedValueOnce({
        ...mockAppointment,
        status: BookingStatus.CANCELLED,
        notes: 'Cancellation reason: No reason provided'
      });
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any);
      
      await appointmentService.cancel('appointment-123');
      
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        data: {
          status: BookingStatus.CANCELLED,
          notes: 'Cancellation reason: No reason provided'
        },
        include: {
          customer: true,
          artist: true
        }
      });
    });
    
    it('should throw ValidationError if appointment already cancelled', async () => {
      vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce({
        ...mockAppointment,
        status: BookingStatus.CANCELLED
      });
      
      await expect(appointmentService.cancel('appointment-123'))
        .rejects.toThrow(ValidationError);
    });
  });
  
  describe('findById', () => {
    it('should find appointment by ID', async () => {
      vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce(mockAppointment);
      
      const result = await appointmentService.findById('appointment-123');
      
      expect(result).toEqual(mockAppointment);
      expect(prisma.appointment.findUnique).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        include: {
          customer: true,
          artist: true,
          tattooRequest: true
        }
      });
    });
    
    it('should throw NotFoundError if appointment not found', async () => {
      vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce(null);
      
      await expect(appointmentService.findById('non-existent'))
        .rejects.toThrow(NotFoundError);
      await expect(appointmentService.findById('non-existent'))
        .rejects.toThrow('Appointment with id non-existent not found');
    });
  });
  
  describe('list', () => {
    const mockAppointments = [
      mockAppointment,
      { ...mockAppointment, id: 'appointment-124' },
      { ...mockAppointment, id: 'appointment-125' }
    ];
    
    it('should list appointments with pagination', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce(mockAppointments);
      vi.mocked(prisma.appointment.count).mockResolvedValueOnce(3);
      
      const result = await appointmentService.list({}, 1, 20);
      
      expect(result).toEqual({
        data: mockAppointments,
        pagination: {
          total: 3,
          page: 1,
          limit: 20,
          pages: 1
        }
      });
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          customer: true,
          artist: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { startTime: 'asc' },
        skip: 0,
        take: 20
      });
    });
    
    it('should filter by status', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([mockAppointment]);
      vi.mocked(prisma.appointment.count).mockResolvedValueOnce(1);
      
      await appointmentService.list({ status: BookingStatus.SCHEDULED });
      
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: { status: BookingStatus.SCHEDULED },
        include: expect.any(Object),
        orderBy: { startTime: 'asc' },
        skip: 0,
        take: 20
      });
    });
    
    it('should filter by date range', async () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-01-31');
      
      vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce(mockAppointments);
      vi.mocked(prisma.appointment.count).mockResolvedValueOnce(3);
      
      await appointmentService.list({ from, to });
      
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: {
          startTime: {
            gte: from,
            lte: to
          }
        },
        include: expect.any(Object),
        orderBy: { startTime: 'asc' },
        skip: 0,
        take: 20
      });
    });
    
    it('should handle pagination correctly', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([mockAppointment]);
      vi.mocked(prisma.appointment.count).mockResolvedValueOnce(50);
      
      const result = await appointmentService.list({}, 3, 10);
      
      expect(result.pagination).toEqual({
        total: 50,
        page: 3,
        limit: 10,
        pages: 5
      });
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { startTime: 'asc' },
        skip: 20, // (3-1) * 10
        take: 10
      });
    });
  });
  
  describe('validateAppointmentData', () => {
    it('should validate required customerId', async () => {
      await expect(
        AppointmentService.validateAppointmentData({})
      ).rejects.toThrow('Either customer ID or contact email is required');
      
      await expect(
        AppointmentService.validateAppointmentData({ customerId: 123 })
      ).rejects.toThrow('customerId must be a string');
    });
    
    it('should pass validation with valid data', async () => {
      const validData = {
        customerId: 'customer-123',
        startAt: new Date(Date.now() + 86400000),
        duration: 60,
        bookingType: 'consultation'
      };
      
      await expect(
        AppointmentService.validateAppointmentData(validData)
      ).resolves.toBeUndefined();
    });
    
    it('should pass validation with contact email instead of customerId', async () => {
      const validAnonymousData = {
        contactEmail: 'test@example.com',
        startAt: new Date(Date.now() + 86400000),
        duration: 60,
        bookingType: 'consultation'
      };
      
      await expect(
        AppointmentService.validateAppointmentData(validAnonymousData)
      ).resolves.toBeUndefined();
    });
    
    it('should validate required booking fields', async () => {
      const incompleteData = { customerId: 'customer-123' };
      
      await expect(
        AppointmentService.validateAppointmentData(incompleteData)
      ).rejects.toThrow('startAt is required and must be a Date');
    });
    
    it('should validate contactEmail type when provided', async () => {
      await expect(
        AppointmentService.validateAppointmentData({ 
          contactEmail: 123,
          startAt: new Date(),
          duration: 60,
          bookingType: 'consultation'
        })
      ).rejects.toThrow('contactEmail must be a string');
    });
  });
  
  describe('checkTimeConflicts', () => {
    it('should not throw when no conflicts exist', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([]);
      
      await expect(
        appointmentService.checkTimeConflicts(
          new Date(Date.now() + 86400000),
          new Date(Date.now() + 86400000 + 3600000),
          'artist-123'
        )
      ).resolves.toBeUndefined();
    });
    
    it('should throw ValidationError when conflicts exist', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([
        { 
          id: 'conflict-123', 
          startTime: new Date(Date.now() + 86400000 + 1800000), 
          endTime: new Date(Date.now() + 86400000 + 5400000) 
        }
      ] as any);
      
      await expect(
        appointmentService.checkTimeConflicts(
          new Date(Date.now() + 86400000),
          new Date(Date.now() + 86400000 + 3600000),
          'artist-123'
        )
      ).rejects.toThrow('Time conflict detected with existing appointment');
    });
    
    it('should exclude specific appointment when updating', async () => {
      vi.mocked(prisma.appointment.findMany).mockResolvedValueOnce([]);
      
      await appointmentService.checkTimeConflicts(
        new Date(Date.now() + 86400000),
        new Date(Date.now() + 86400000 + 3600000),
        'artist-123',
        'appointment-123'
      );
      
      expect(prisma.appointment.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: { not: 'appointment-123' }
        }),
        select: { id: true, startTime: true, endTime: true }
      });
    });
  });
}); 
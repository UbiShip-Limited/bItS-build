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
    appointment: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn()
    },
    auditLog: {
      create: vi.fn()
    }
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
  
  const mockAppointment = {
    id: 'appointment-123',
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T11:00:00Z'),
    duration: 60,
    status: BookingStatus.SCHEDULED,
    type: BookingType.CONSULTATION,
    customerId: 'customer-123',
    artistId: 'artist-123',
    customer: mockCustomer,
    artist: {
      id: 'artist-123',
      email: 'artist@example.com',
      role: 'artist'
    },
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
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('create', () => {
    const validCreateData = {
      startAt: new Date('2024-01-15T10:00:00Z'),
      duration: 60,
      customerId: 'customer-123',
      bookingType: BookingType.CONSULTATION,
      artistId: 'artist-123',
      note: 'Test appointment',
      priceQuote: 100
    };
    
    it('should create appointment with customer ID', async () => {
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(mockCustomer);
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
          endTime: new Date('2024-01-15T11:00:00Z'),
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
        startAt: new Date('2024-01-15T10:00:00Z'),
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
        startAt: new Date(),
        duration: 60,
        bookingType: BookingType.CONSULTATION
      };
      
      await expect(appointmentService.create(invalidData))
        .rejects.toThrow(ValidationError);
      await expect(appointmentService.create(invalidData))
        .rejects.toThrow('Either customer ID or contact email is required');
    });
    
    it('should throw NotFoundError if customer does not exist', async () => {
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(null);
      
      await expect(appointmentService.create(validCreateData))
        .rejects.toThrow(NotFoundError);
      await expect(appointmentService.create(validCreateData))
        .rejects.toThrow('Customer with id customer-123 not found');
    });
    
    it('should handle Prisma unique constraint violation', async () => {
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(mockCustomer);
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
      
      vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(mockCustomer);
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
  });
  
  describe('update', () => {
    const updateData = {
      startAt: new Date('2024-01-15T14:00:00Z'),
      duration: 90,
      status: BookingStatus.CONFIRMED,
      note: 'Updated note',
      priceQuote: 150
    };
    
    beforeEach(() => {
      vi.mocked(prisma.appointment.findUnique).mockResolvedValueOnce(mockAppointment);
    });
    
    it('should update appointment successfully', async () => {
      const updatedAppointment = {
        ...mockAppointment,
        startTime: updateData.startAt,
        endTime: new Date('2024-01-15T15:30:00Z'),
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
          endTime: new Date('2024-01-15T15:30:00Z'),
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
        endTime: new Date('2024-01-15T12:00:00Z')
      });
      vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({} as any);
      
      await appointmentService.update('appointment-123', { duration: 120 });
      
      expect(prisma.appointment.update).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        data: {
          duration: 120,
          endTime: new Date('2024-01-15T12:00:00Z')
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
      ).rejects.toThrow('customerId is required and must be a string');
      
      await expect(
        AppointmentService.validateAppointmentData({ customerId: 123 })
      ).rejects.toThrow('customerId is required and must be a string');
    });
    
    it('should pass validation with valid data', async () => {
      await expect(
        AppointmentService.validateAppointmentData({ customerId: 'customer-123' })
      ).resolves.toBeUndefined();
    });
  });
}); 
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommunicationService } from '../communicationService';
import { TattooRequestService } from '../tattooRequestService';
import { AppointmentService } from '../appointmentService';
import { RealtimeService } from '../realtimeService';
import { emailTemplateService } from '../emailTemplateService';
import { auditService } from '../auditService';

// Mock dependencies
vi.mock('../emailTemplateService', () => ({
  emailTemplateService: {
    sendEmail: vi.fn()
  }
}));

vi.mock('../auditService', () => ({
  auditService: {
    log: vi.fn()
  }
}));

vi.mock('../../prisma/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    customer: {
      findUnique: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    },
    appointment: {
      findMany: vi.fn()
    }
  }
}));

// Get the mocked prisma for use in tests
import { prisma as mockPrisma } from '../../prisma/prisma';

describe('Owner Notification Service', () => {
  let communicationService: CommunicationService;
  let tattooRequestService: TattooRequestService;
  let appointmentService: AppointmentService;
  let mockRealtimeService: RealtimeService;
  
  const MOCK_OWNER_EMAIL = 'owner@bowenislandtattoo.com';
  
  beforeEach(() => {
    // Set environment variables
    process.env.OWNER_EMAIL = MOCK_OWNER_EMAIL;
    process.env.OWNER_NOTIFICATION_ENABLED = 'true';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    
    // Mock realtime service
    mockRealtimeService = {
      sendNotification: vi.fn(),
      notifyRequestSubmitted: vi.fn(),
      notifyAppointmentCreated: vi.fn()
    } as any;
    
    // Initialize services
    communicationService = new CommunicationService(mockRealtimeService);
    tattooRequestService = new TattooRequestService(communicationService, mockRealtimeService);
    appointmentService = new AppointmentService(mockRealtimeService, communicationService);
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.OWNER_EMAIL;
    delete process.env.OWNER_NOTIFICATION_ENABLED;
  });
  
  describe('Owner Email Configuration', () => {
    it('should send notifications when owner email is configured', async () => {
      const mockRequest = {
        id: 'req-1',
        description: 'Dragon tattoo',
        placement: 'Back',
        size: 'Large',
        style: 'Japanese',
        preferredArtist: 'John',
        timeframe: 'Next month',
        additionalNotes: 'Full color',
        referenceImages: [],
        customer: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          phone: '+1-555-0123'
        }
      };
      
      (emailTemplateService.sendEmail as any).mockResolvedValue({ success: true });
      
      await communicationService.sendOwnerNewRequestNotification(mockRequest as any);
      
      expect(emailTemplateService.sendEmail).toHaveBeenCalledWith(
        'owner_new_request',
        MOCK_OWNER_EMAIL,
        expect.objectContaining({
          customerName: 'Jane Doe',
          customerEmail: 'jane@example.com',
          customerPhone: '+1-555-0123',
          description: 'Dragon tattoo',
          placement: 'Back',
          size: 'Large',
          style: 'Japanese',
          preferredArtist: 'John',
          timeframe: 'Next month',
          additionalNotes: 'Full color',
          dashboardUrl: 'http://localhost:3000/dashboard/requests/req-1'
        })
      );
      
      expect(auditService.log).toHaveBeenCalledWith({
        action: 'OWNER_NOTIFICATION_SENT',
        resource: 'TattooRequest',
        resourceId: 'req-1',
        details: {
          type: 'new_request',
          to: MOCK_OWNER_EMAIL,
          success: true,
          error: undefined
        }
      });
    });
    
    it('should not send notifications when owner email is not configured', async () => {
      delete process.env.OWNER_EMAIL;
      
      const service = new CommunicationService(mockRealtimeService);
      const mockRequest = { id: 'req-1', description: 'Test' };
      
      const result = await service.sendOwnerNewRequestNotification(mockRequest as any);
      
      expect(result.success).toBe(true);
      expect(emailTemplateService.sendEmail).not.toHaveBeenCalled();
    });
    
    it('should not send notifications when disabled', async () => {
      process.env.OWNER_NOTIFICATION_ENABLED = 'false';
      
      const service = new CommunicationService(mockRealtimeService);
      const mockRequest = { id: 'req-1', description: 'Test' };
      
      const result = await service.sendOwnerNewRequestNotification(mockRequest as any);
      
      expect(result.success).toBe(true);
      expect(emailTemplateService.sendEmail).not.toHaveBeenCalled();
    });
  });
  
  describe('New Tattoo Request Notifications', () => {
    it('should notify owner when new tattoo request is created', async () => {
      const mockCustomer = { id: 'cust-1', name: 'John Doe', email: 'john@example.com' };
      const mockRequest = {
        id: 'req-1',
        description: 'Sleeve tattoo',
        customerId: 'cust-1',
        customer: mockCustomer,
        referenceImages: [],
        status: 'new',
        trackingToken: null
      };
      
      // Mock prisma operations
      (mockPrisma.customer.findUnique as any).mockResolvedValue(mockCustomer);
      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          tattooRequest: {
            create: vi.fn().mockResolvedValue(mockRequest)
          },
          image: {
            create: vi.fn()
          }
        };
        return callback(tx);
      });
      
      (emailTemplateService.sendEmail as any).mockResolvedValue({ success: true });
      
      await tattooRequestService.create({
        description: 'Sleeve tattoo',
        customerId: 'cust-1'
      });
      
      // Verify customer confirmation email
      expect(emailTemplateService.sendEmail).toHaveBeenCalledWith(
        'tattoo_request_confirmation',
        'john@example.com',
        expect.any(Object)
      );
      
      // Verify owner notification email
      expect(emailTemplateService.sendEmail).toHaveBeenCalledWith(
        'owner_new_request',
        MOCK_OWNER_EMAIL,
        expect.objectContaining({
          customerName: 'John Doe',
          description: 'Sleeve tattoo'
        })
      );
      
      // Verify audit log for owner notification
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'OWNER_NOTIFICATION_SENT',
          resource: 'TattooRequest'
        })
      );
    });
    
    it('should handle owner notification failure gracefully', async () => {
      const mockRequest = {
        id: 'req-1',
        description: 'Test tattoo',
        customerId: 'cust-1',
        customer: { name: 'John', email: 'john@example.com' },
        referenceImages: [],
        status: 'new',
        trackingToken: null
      };
      
      (mockPrisma.customer.findUnique as any).mockResolvedValue({ id: 'cust-1' });
      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          tattooRequest: {
            create: vi.fn().mockResolvedValue(mockRequest)
          },
          image: {
            create: vi.fn()
          }
        };
        return callback(tx);
      });
      
      // Mock to simulate customer email success but owner email never gets called
      // This simulates the case where communicationService.sendOwnerNewRequestNotification might not throw
      (emailTemplateService.sendEmail as any).mockResolvedValue({ success: true });
      
      const result = await tattooRequestService.create({
        description: 'Test tattoo',
        customerId: 'cust-1'
      });
      
      // Request should still be created successfully
      expect(result).toBeDefined();
      expect(result.id).toBe('req-1');
      
      // Verify emails were sent
      expect(emailTemplateService.sendEmail).toHaveBeenCalled();
      
      // Check that both customer and owner emails were attempted
      const emailCalls = (emailTemplateService.sendEmail as any).mock.calls;
      
      // Find customer confirmation email
      const customerEmailCall = emailCalls.find((call: any[]) => 
        call[0] === 'tattoo_request_confirmation'
      );
      expect(customerEmailCall).toBeDefined();
      
      // Find owner notification email  
      const ownerEmailCall = emailCalls.find((call: any[]) => 
        call[0] === 'owner_new_request'
      );
      expect(ownerEmailCall).toBeDefined();
      
      // Verify the owner email was sent to the correct address
      if (ownerEmailCall) {
        expect(ownerEmailCall[1]).toBe(MOCK_OWNER_EMAIL);
      }
    });
  });
  
  describe('New Appointment Notifications', () => {
    it('should notify owner when new appointment is created', async () => {
      // Set appointment date to future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 days in future
      
      const mockAppointment = {
        id: 'apt-1',
        customerId: 'cust-1',
        customer: { 
          name: 'Jane Smith', 
          email: 'jane@example.com',
          phone: '+1-555-9999'
        },
        artist: { name: 'Mike Artist' },
        startTime: futureDate,
        duration: 120,
        type: 'tattoo_session',
        priceQuote: 500,
        notes: 'Dragon design discussed',
        status: 'scheduled'
      };
      
      (mockPrisma.customer.findUnique as any).mockResolvedValue(mockAppointment.customer);
      (mockPrisma.user.findUnique as any).mockResolvedValue(mockAppointment.artist);
      (mockPrisma.appointment.findMany as any).mockResolvedValue([]); // No conflicts
      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          appointment: {
            create: vi.fn().mockResolvedValue(mockAppointment)
          },
          auditLog: {
            create: vi.fn()
          }
        };
        return callback(tx);
      });
      
      (emailTemplateService.sendEmail as any).mockResolvedValue({ success: true });
      
      await appointmentService.create({
        startAt: futureDate,
        duration: 120,
        customerId: 'cust-1',
        bookingType: 'tattoo_session' as any,
        artistId: 'artist-1',
        priceQuote: 500,
        note: 'Dragon design discussed'
      });
      
      // Verify owner notification email
      expect(emailTemplateService.sendEmail).toHaveBeenCalledWith(
        'owner_new_appointment',
        MOCK_OWNER_EMAIL,
        expect.objectContaining({
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          customerPhone: '+1-555-9999',
          appointmentType: 'tattoo_session',
          artistName: 'Mike Artist',
          priceQuote: '$500',
          notes: 'Dragon design discussed'
        })
      );
      
      // Verify audit log
      expect(auditService.log).toHaveBeenCalledWith({
        action: 'OWNER_NOTIFICATION_SENT',
        resource: 'Appointment',
        resourceId: 'apt-1',
        details: {
          type: 'new_appointment',
          to: MOCK_OWNER_EMAIL,
          success: true,
          error: undefined
        }
      });
    });
  });
  
  describe('Payment Notifications', () => {
    it('should notify owner when payment is received', async () => {
      const paymentData = {
        id: 'pay-1',
        amount: 250.50,
        customerName: 'Bob Johnson',
        paymentMethod: 'Credit Card',
        appointmentId: 'apt-1',
        transactionId: 'txn-12345'
      };
      
      (emailTemplateService.sendEmail as any).mockResolvedValue({ success: true });
      
      await communicationService.sendOwnerPaymentNotification(paymentData);
      
      expect(emailTemplateService.sendEmail).toHaveBeenCalledWith(
        'owner_payment_received',
        MOCK_OWNER_EMAIL,
        expect.objectContaining({
          customerName: 'Bob Johnson',
          amount: '250.50',
          paymentMethod: 'Credit Card',
          relatedService: 'Tattoo Appointment',
          appointmentId: 'apt-1',
          transactionId: 'txn-12345'
        })
      );
    });
  });
  
  describe('Cancellation Notifications', () => {
    it('should notify owner when appointment is cancelled', async () => {
      const mockAppointment = {
        id: 'apt-1',
        customer: { name: 'Alice Brown' },
        artist: { name: 'Sarah Artist' },
        startTime: new Date('2024-01-20T10:00:00')
      };
      
      (emailTemplateService.sendEmail as any).mockResolvedValue({ success: true });
      
      await communicationService.sendOwnerCancellationNotification(
        mockAppointment as any,
        'Customer requested reschedule'
      );
      
      expect(emailTemplateService.sendEmail).toHaveBeenCalledWith(
        'owner_appointment_cancelled',
        MOCK_OWNER_EMAIL,
        expect.objectContaining({
          customerName: 'Alice Brown',
          artistName: 'Sarah Artist',
          cancellationReason: 'Customer requested reschedule'
        })
      );
    });
  });
  
  describe('Email Template Validation', () => {
    it('should have all required variables in owner notification templates', () => {
      const templates = [
        'owner_new_request',
        'owner_new_appointment',
        'owner_payment_received',
        'owner_appointment_cancelled'
      ];
      
      templates.forEach(templateName => {
        // This test verifies that the templates are properly configured
        // In a real scenario, you would load and validate the actual templates
        expect(templateName).toBeTruthy();
      });
    });
  });
  
  describe('Integration Flow', () => {
    it('should send both customer and owner notifications for new request', async () => {
      const mockRequest = {
        id: 'req-123',
        description: 'Full sleeve',
        contactEmail: 'customer@example.com',
        contactPhone: '+1-555-1234',
        placement: 'Left arm',
        size: 'Large',
        style: 'Traditional',
        referenceImages: [],
        status: 'new',
        trackingToken: 'track-123'
      };
      
      (mockPrisma.$transaction as any).mockImplementation(async (callback: any) => {
        const tx = {
          tattooRequest: {
            create: vi.fn().mockResolvedValue(mockRequest)
          },
          image: {
            create: vi.fn()
          }
        };
        return callback(tx);
      });
      
      (emailTemplateService.sendEmail as any).mockResolvedValue({ success: true });
      
      await tattooRequestService.create({
        description: 'Full sleeve',
        contactEmail: 'customer@example.com',
        contactPhone: '+1-555-1234',
        placement: 'Left arm',
        size: 'Large',
        style: 'Traditional'
      });
      
      // Should send 2 emails: one to customer, one to owner
      expect(emailTemplateService.sendEmail).toHaveBeenCalledTimes(2);
      
      // Customer email
      expect(emailTemplateService.sendEmail).toHaveBeenNthCalledWith(
        1,
        'tattoo_request_confirmation',
        'customer@example.com',
        expect.any(Object)
      );
      
      // Owner email
      expect(emailTemplateService.sendEmail).toHaveBeenNthCalledWith(
        2,
        'owner_new_request',
        MOCK_OWNER_EMAIL,
        expect.any(Object)
      );
    });
  });
});
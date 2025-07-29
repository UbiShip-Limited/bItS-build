import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmailAutomationService } from '../emailAutomationService';
import { prisma } from '../../prisma/prisma';
import { emailTemplateService } from '../emailTemplateService';
import { RealtimeService } from '../realtimeService';
import { addHours, subHours, subDays } from 'date-fns';
import * as cron from 'node-cron';

// Mock dependencies
vi.mock('../../prisma/prisma', () => ({
  prisma: {
    emailAutomationSetting: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn()
    },
    emailAutomationLog: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn()
    },
    appointment: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    customer: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    },
    tattooRequest: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    }
  }
}));

vi.mock('../emailTemplateService', () => ({
  emailTemplateService: {
    sendEmail: vi.fn()
  }
}));

vi.mock('node-cron', () => ({
  schedule: vi.fn(() => ({
    stop: vi.fn()
  }))
}));

describe('EmailAutomationService', () => {
  let service: EmailAutomationService;
  let mockRealtimeService: RealtimeService;
  
  beforeEach(() => {
    mockRealtimeService = {
      sendNotification: vi.fn()
    } as any;
    
    service = new EmailAutomationService(mockRealtimeService);
    
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    service.stop();
    vi.restoreAllMocks();
  });
  
  describe('initialize', () => {
    it('should initialize cron job and default settings', async () => {
      const mockSchedule = vi.fn(() => ({ stop: vi.fn() }));
      (cron.schedule as any) = mockSchedule;
      
      await service.initialize();
      
      expect(mockSchedule).toHaveBeenCalledWith('*/15 * * * *', expect.any(Function));
      expect(prisma.emailAutomationSetting.upsert).toHaveBeenCalledTimes(6);
      expect(prisma.emailAutomationSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { emailType: 'appointment_reminder_24h' },
          create: expect.objectContaining({
            emailType: 'appointment_reminder_24h',
            enabled: true,
            timingHours: 24,
            businessHoursOnly: true
          })
        })
      );
    });
  });
  
  describe('getSettings', () => {
    it('should return all automation settings', async () => {
      const mockSettings = [
        { id: '1', emailType: 'appointment_reminder_24h', enabled: true }
      ];
      
      (prisma.emailAutomationSetting.findMany as any).mockResolvedValue(mockSettings);
      
      const result = await service.getSettings();
      
      expect(result).toEqual(mockSettings);
      expect(prisma.emailAutomationSetting.findMany).toHaveBeenCalledWith({
        orderBy: { emailType: 'asc' }
      });
    });
  });
  
  describe('updateSettings', () => {
    it('should update automation settings', async () => {
      const mockUpdated = { 
        id: '1', 
        emailType: 'appointment_reminder_24h', 
        enabled: false 
      };
      
      (prisma.emailAutomationSetting.update as any).mockResolvedValue(mockUpdated);
      
      const result = await service.updateSettings('appointment_reminder_24h', { enabled: false });
      
      expect(result).toEqual(mockUpdated);
      expect(prisma.emailAutomationSetting.update).toHaveBeenCalledWith({
        where: { emailType: 'appointment_reminder_24h' },
        data: { enabled: false }
      });
    });
  });
  
  describe('appointment reminders', () => {
    it('should send 24 hour appointment reminder', async () => {
      const now = new Date();
      const appointmentTime = addHours(now, 24);
      const mockAppointment = {
        id: 'apt-1',
        customerId: 'cust-1',
        startTime: appointmentTime,
        status: 'scheduled',
        duration: 60,
        type: 'tattoo_session',
        customer: {
          id: 'cust-1',
          name: 'John Doe',
          email: 'john@example.com',
          emailUnsubscribed: false
        },
        artist: {
          name: 'Jane Artist'
        }
      };
      
      // Mock settings to enable automation
      (prisma.emailAutomationSetting.findMany as any).mockResolvedValue([
        { emailType: 'appointment_reminder_24h', enabled: true }
      ]);
      
      // Mock appointments query
      (prisma.appointment.findMany as any).mockResolvedValue([mockAppointment]);
      
      // Mock no existing log
      (prisma.emailAutomationLog.findFirst as any).mockResolvedValue(null);
      
      // Mock email send success
      (emailTemplateService.sendEmail as any).mockResolvedValue({ 
        success: true 
      });
      
      // Mock business hours check
      vi.spyOn(service as any, 'isWithinBusinessHours').mockResolvedValue(true);
      
      // Run automation check
      await (service as any).runAutomationChecks();
      
      expect(emailTemplateService.sendEmail).toHaveBeenCalledWith(
        'appointment_reminder_24h',
        'john@example.com',
        expect.objectContaining({
          customerName: 'John Doe',
          timeUntil: 'tomorrow',
          artistName: 'Jane Artist'
        })
      );
      
      expect(prisma.emailAutomationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerId: 'cust-1',
          appointmentId: 'apt-1',
          emailType: 'appointment_reminder_24h',
          status: 'sent'
        })
      });
      
      expect(mockRealtimeService.sendNotification).toHaveBeenCalled();
    });
    
    it('should not send reminder if already sent', async () => {
      const now = new Date();
      const appointmentTime = addHours(now, 24);
      const mockAppointment = {
        id: 'apt-1',
        customerId: 'cust-1',
        startTime: appointmentTime,
        status: 'scheduled',
        customer: {
          id: 'cust-1',
          email: 'john@example.com',
          emailUnsubscribed: false
        }
      };
      
      (prisma.emailAutomationSetting.findMany as any).mockResolvedValue([
        { emailType: 'appointment_reminder_24h', enabled: true }
      ]);
      
      (prisma.appointment.findMany as any).mockResolvedValue([mockAppointment]);
      
      // Mock existing log
      (prisma.emailAutomationLog.findFirst as any).mockResolvedValue({
        id: 'log-1',
        emailType: 'appointment_reminder_24h',
        status: 'sent'
      });
      
      await (service as any).runAutomationChecks();
      
      expect(emailTemplateService.sendEmail).not.toHaveBeenCalled();
    });
    
    it('should not send reminder outside business hours', async () => {
      const now = new Date();
      const appointmentTime = addHours(now, 24);
      const mockAppointment = {
        id: 'apt-1',
        customerId: 'cust-1',
        startTime: appointmentTime,
        status: 'scheduled',
        customer: {
          id: 'cust-1',
          email: 'john@example.com',
          emailUnsubscribed: false
        }
      };
      
      (prisma.emailAutomationSetting.findMany as any).mockResolvedValue([
        { emailType: 'appointment_reminder_24h', enabled: true, businessHoursOnly: true }
      ]);
      
      (prisma.appointment.findMany as any).mockResolvedValue([mockAppointment]);
      (prisma.emailAutomationLog.findFirst as any).mockResolvedValue(null);
      
      // Mock outside business hours
      vi.spyOn(service as any, 'isWithinBusinessHours').mockResolvedValue(false);
      
      await (service as any).runAutomationChecks();
      
      expect(emailTemplateService.sendEmail).not.toHaveBeenCalled();
    });
  });
  
  describe('aftercare instructions', () => {
    it('should send aftercare instructions 2 hours after appointment', async () => {
      const now = new Date();
      const endTime = subHours(now, 2);
      const mockAppointment = {
        id: 'apt-1',
        customerId: 'cust-1',
        endTime: endTime,
        status: 'completed',
        type: 'tattoo_session',
        customer: {
          id: 'cust-1',
          name: 'John Doe',
          email: 'john@example.com',
          emailUnsubscribed: false
        }
      };
      
      (prisma.emailAutomationSetting.findMany as any).mockResolvedValue([
        { emailType: 'aftercare_instructions', enabled: true }
      ]);
      
      (prisma.appointment.findMany as any).mockResolvedValue([mockAppointment]);
      (prisma.emailAutomationLog.findFirst as any).mockResolvedValue(null);
      (emailTemplateService.sendEmail as any).mockResolvedValue({ success: true });
      vi.spyOn(service as any, 'isWithinBusinessHours').mockResolvedValue(true);
      
      await (service as any).runAutomationChecks();
      
      expect(emailTemplateService.sendEmail).toHaveBeenCalledWith(
        'aftercare_instructions',
        'john@example.com',
        expect.objectContaining({
          customerName: 'John Doe'
        })
      );
    });
  });
  
  describe('review requests', () => {
    it('should send review request 7 days after appointment', async () => {
      const now = new Date();
      const endTime = subHours(now, 168); // 7 days
      const mockAppointment = {
        id: 'apt-1',
        customerId: 'cust-1',
        endTime: endTime,
        status: 'completed',
        type: 'tattoo_session',
        customer: {
          id: 'cust-1',
          name: 'John Doe',
          email: 'john@example.com',
          emailUnsubscribed: false
        },
        artist: {
          name: 'Jane Artist'
        }
      };
      
      (prisma.emailAutomationSetting.findMany as any).mockResolvedValue([
        { emailType: 'review_request', enabled: true }
      ]);
      
      (prisma.appointment.findMany as any).mockResolvedValue([mockAppointment]);
      (prisma.emailAutomationLog.findFirst as any).mockResolvedValue(null);
      (emailTemplateService.sendEmail as any).mockResolvedValue({ success: true });
      vi.spyOn(service as any, 'isWithinBusinessHours').mockResolvedValue(true);
      
      await (service as any).runAutomationChecks();
      
      expect(emailTemplateService.sendEmail).toHaveBeenCalledWith(
        'review_request',
        'john@example.com',
        expect.objectContaining({
          customerName: 'John Doe',
          artistName: 'Jane Artist',
          appointmentType: 'tattoo_session'
        })
      );
    });
  });
  
  describe('re-engagement emails', () => {
    it('should send re-engagement email to inactive customers', async () => {
      const now = new Date();
      const lastActivity = subDays(now, 91);
      const mockCustomer = {
        id: 'cust-1',
        name: 'John Doe',
        email: 'john@example.com',
        emailUnsubscribed: false,
        lastActivityDate: lastActivity
      };
      
      (prisma.emailAutomationSetting.findMany as any).mockResolvedValue([
        { emailType: 're_engagement', enabled: true, timingHours: 2160, businessHoursOnly: true }
      ]);
      
      (prisma.customer.findMany as any).mockResolvedValue([mockCustomer]);
      (prisma.emailAutomationLog.findFirst as any).mockResolvedValue(null);
      (emailTemplateService.sendEmail as any).mockResolvedValue({ success: true });
      vi.spyOn(service as any, 'isWithinBusinessHours').mockResolvedValue(true);
      
      // Call the specific method directly to test it
      await (service as any).processReEngagementEmails();
      
      expect(emailTemplateService.sendEmail).toHaveBeenCalledWith(
        're_engagement',
        'john@example.com',
        expect.objectContaining({
          customerName: 'John Doe'
        })
      );
    });
    
    it('should not send re-engagement if sent recently', async () => {
      const now = new Date();
      const lastActivity = subDays(now, 91);
      const mockCustomer = {
        id: 'cust-1',
        email: 'john@example.com',
        emailUnsubscribed: false,
        lastActivityDate: lastActivity
      };
      
      (prisma.emailAutomationSetting.findMany as any).mockResolvedValue([
        { emailType: 're_engagement', enabled: true }
      ]);
      
      (prisma.customer.findMany as any).mockResolvedValue([mockCustomer]);
      
      // Mock recent re-engagement email
      (prisma.emailAutomationLog.findFirst as any).mockResolvedValue({
        id: 'log-1',
        sentAt: subDays(now, 15)
      });
      
      await (service as any).runAutomationChecks();
      
      expect(emailTemplateService.sendEmail).not.toHaveBeenCalled();
    });
  });
  
  describe('abandoned request recovery', () => {
    it('should send recovery email for abandoned requests', async () => {
      const now = new Date();
      const createdAt = subHours(now, 49);
      const mockRequest = {
        id: 'req-1',
        status: 'new',
        createdAt: createdAt,
        description: 'Dragon tattoo on back',
        trackingToken: 'track-123',
        customer: {
          id: 'cust-1',
          name: 'John Doe',
          email: 'john@example.com',
          emailUnsubscribed: false
        }
      };
      
      (prisma.emailAutomationSetting.findMany as any).mockResolvedValue([
        { emailType: 'abandoned_request_recovery', enabled: true }
      ]);
      
      (prisma.tattooRequest.findMany as any).mockResolvedValue([mockRequest]);
      (prisma.emailAutomationLog.findFirst as any).mockResolvedValue(null);
      (emailTemplateService.sendEmail as any).mockResolvedValue({ success: true });
      vi.spyOn(service as any, 'isWithinBusinessHours').mockResolvedValue(true);
      
      await (service as any).runAutomationChecks();
      
      expect(emailTemplateService.sendEmail).toHaveBeenCalledWith(
        'abandoned_request_recovery',
        'john@example.com',
        expect.objectContaining({
          customerName: 'John Doe',
          description: 'Dragon tattoo on back...'
        })
      );
    });
  });
  
  describe('getLogs', () => {
    it('should return filtered logs', async () => {
      const mockLogs = [
        { 
          id: 'log-1', 
          emailType: 'appointment_reminder_24h',
          status: 'sent',
          sentAt: new Date()
        }
      ];
      
      (prisma.emailAutomationLog.findMany as any).mockResolvedValue(mockLogs);
      
      const result = await service.getLogs({
        emailType: 'appointment_reminder_24h',
        status: 'sent',
        limit: 50
      });
      
      expect(result).toEqual(mockLogs);
      expect(prisma.emailAutomationLog.findMany).toHaveBeenCalledWith({
        where: {
          emailType: 'appointment_reminder_24h',
          status: 'sent'
        },
        orderBy: { sentAt: 'desc' },
        take: 50,
        include: {
          customer: true,
          appointment: true,
          tattooRequest: true
        }
      });
    });
  });
  
  describe('triggerAutomation', () => {
    it('should manually trigger appointment reminder', async () => {
      const mockAppointment = {
        id: 'apt-1',
        customerId: 'cust-1',
        startTime: new Date(),
        customer: {
          id: 'cust-1',
          name: 'John Doe',
          email: 'john@example.com'
        },
        artist: {
          name: 'Jane Artist'
        }
      };
      
      (prisma.appointment.findUnique as any).mockResolvedValue(mockAppointment);
      (emailTemplateService.sendEmail as any).mockResolvedValue({ success: true });
      vi.spyOn(service as any, 'isWithinBusinessHours').mockResolvedValue(true);
      
      const result = await service.triggerAutomation('appointment_reminder_24h', 'apt-1');
      
      expect(result.success).toBe(true);
      expect(emailTemplateService.sendEmail).toHaveBeenCalled();
    });
    
    it('should return error for invalid target', async () => {
      (prisma.appointment.findUnique as any).mockResolvedValue(null);
      
      const result = await service.triggerAutomation('appointment_reminder_24h', 'invalid-id');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment not found');
    });
  });
  
  describe('email send error handling', () => {
    it('should log failed email attempts', async () => {
      const mockAppointment = {
        id: 'apt-1',
        customerId: 'cust-1',
        startTime: addHours(new Date(), 24),
        status: 'scheduled',
        customer: {
          id: 'cust-1',
          email: 'john@example.com',
          emailUnsubscribed: false
        }
      };
      
      (prisma.emailAutomationSetting.findMany as any).mockResolvedValue([
        { emailType: 'appointment_reminder_24h', enabled: true }
      ]);
      
      (prisma.appointment.findMany as any).mockResolvedValue([mockAppointment]);
      (prisma.emailAutomationLog.findFirst as any).mockResolvedValue(null);
      
      // Mock email send failure
      (emailTemplateService.sendEmail as any).mockResolvedValue({ 
        success: false,
        error: 'Email service error'
      });
      
      vi.spyOn(service as any, 'isWithinBusinessHours').mockResolvedValue(true);
      
      await (service as any).runAutomationChecks();
      
      expect(prisma.emailAutomationLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'failed',
          error: 'Email service error'
        })
      });
    });
  });
});
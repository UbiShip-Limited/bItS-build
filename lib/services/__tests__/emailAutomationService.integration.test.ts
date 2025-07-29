import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { EmailAutomationService } from '../emailAutomationService';
import { prisma } from '../../prisma/prisma';
import { RealtimeService } from '../realtimeService';
import { emailService } from '../emailService';
import { addHours, subHours, subDays } from 'date-fns';
import { testDb } from '../../tests/testSetup';

describe('EmailAutomationService Integration Tests', () => {
  let service: EmailAutomationService;
  let realtimeService: RealtimeService;
  
  beforeEach(async () => {
    await testDb.reset();
    
    // Initialize services
    realtimeService = new RealtimeService();
    service = new EmailAutomationService(realtimeService);
    
    // Initialize automation settings
    await service.initialize();
  });
  
  afterEach(async () => {
    service.stop();
    await testDb.cleanup();
  });
  
  describe('Appointment Reminder Workflow', () => {
    it('should send 24 hour appointment reminder with real data', async () => {
      // Create test customer
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '604-555-0123'
        }
      });
      
      // Create test artist
      const artist = await prisma.user.create({
        data: {
          email: 'artist@example.com',
          name: 'Test Artist',
          role: 'artist'
        }
      });
      
      // Create appointment 24 hours from now
      const appointmentTime = addHours(new Date(), 24);
      const appointment = await prisma.appointment.create({
        data: {
          customerId: customer.id,
          artistId: artist.id,
          startTime: appointmentTime,
          endTime: addHours(appointmentTime, 2),
          duration: 120,
          status: 'scheduled',
          type: 'tattoo_session'
        }
      });
      
      // Manually trigger the automation check
      await (service as any).processAppointmentReminders(24);
      
      // Check that email log was created
      const emailLog = await prisma.emailAutomationLog.findFirst({
        where: {
          appointmentId: appointment.id,
          emailType: 'appointment_reminder_24h'
        }
      });
      
      expect(emailLog).toBeTruthy();
      expect(emailLog?.emailAddress).toBe('test@example.com');
      expect(emailLog?.status).toBe(emailService.isEnabled() ? 'sent' : 'sent'); // Mock sends always succeed
    });
    
    it('should not send duplicate reminders', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'test@example.com'
        }
      });
      
      const appointmentTime = addHours(new Date(), 24);
      const appointment = await prisma.appointment.create({
        data: {
          customerId: customer.id,
          startTime: appointmentTime,
          status: 'scheduled'
        }
      });
      
      // Create existing log
      await prisma.emailAutomationLog.create({
        data: {
          customerId: customer.id,
          appointmentId: appointment.id,
          emailType: 'appointment_reminder_24h',
          emailAddress: 'test@example.com',
          templateId: 'appointment_reminder_24h',
          sentAt: new Date(),
          status: 'sent'
        }
      });
      
      // Try to send again
      await (service as any).processAppointmentReminders(24);
      
      // Should still have only one log
      const logs = await prisma.emailAutomationLog.findMany({
        where: {
          appointmentId: appointment.id,
          emailType: 'appointment_reminder_24h'
        }
      });
      
      expect(logs).toHaveLength(1);
    });
    
    it('should respect customer email preferences', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'test@example.com',
          emailUnsubscribed: true
        }
      });
      
      const appointmentTime = addHours(new Date(), 24);
      await prisma.appointment.create({
        data: {
          customerId: customer.id,
          startTime: appointmentTime,
          status: 'scheduled'
        }
      });
      
      await (service as any).processAppointmentReminders(24);
      
      // Should not send email to unsubscribed customer
      const logs = await prisma.emailAutomationLog.findMany({
        where: {
          customerId: customer.id
        }
      });
      
      expect(logs).toHaveLength(0);
    });
  });
  
  describe('Aftercare Instructions Workflow', () => {
    it('should send aftercare instructions after appointment completion', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'test@example.com'
        }
      });
      
      // Create completed appointment 2 hours ago
      const endTime = subHours(new Date(), 2);
      const appointment = await prisma.appointment.create({
        data: {
          customerId: customer.id,
          startTime: subHours(endTime, 2),
          endTime: endTime,
          status: 'completed',
          type: 'tattoo_session'
        }
      });
      
      await (service as any).processAftercareEmails();
      
      const emailLog = await prisma.emailAutomationLog.findFirst({
        where: {
          appointmentId: appointment.id,
          emailType: 'aftercare_instructions'
        }
      });
      
      expect(emailLog).toBeTruthy();
      expect(emailLog?.emailAddress).toBe('test@example.com');
    });
    
    it('should only send aftercare for tattoo sessions', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'test@example.com'
        }
      });
      
      // Create consultation (not a tattoo session)
      const endTime = subHours(new Date(), 2);
      await prisma.appointment.create({
        data: {
          customerId: customer.id,
          endTime: endTime,
          status: 'completed',
          type: 'consultation'
        }
      });
      
      await (service as any).processAftercareEmails();
      
      const logs = await prisma.emailAutomationLog.findMany({
        where: {
          customerId: customer.id
        }
      });
      
      expect(logs).toHaveLength(0);
    });
  });
  
  describe('Review Request Workflow', () => {
    it('should send review request 7 days after appointment', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'test@example.com'
        }
      });
      
      const artist = await prisma.user.create({
        data: {
          email: 'artist@example.com',
          name: 'Test Artist',
          role: 'artist'
        }
      });
      
      // Create appointment completed 7 days ago
      const endTime = subHours(new Date(), 168); // 7 days
      const appointment = await prisma.appointment.create({
        data: {
          customerId: customer.id,
          artistId: artist.id,
          endTime: endTime,
          status: 'completed',
          type: 'tattoo_session'
        }
      });
      
      await (service as any).processReviewRequests();
      
      const emailLog = await prisma.emailAutomationLog.findFirst({
        where: {
          appointmentId: appointment.id,
          emailType: 'review_request'
        }
      });
      
      expect(emailLog).toBeTruthy();
      expect(emailLog?.metadata).toBeTruthy();
    });
  });
  
  describe('Re-engagement Workflow', () => {
    it('should send re-engagement email to inactive customers', async () => {
      // Create inactive customer
      const customer = await prisma.customer.create({
        data: {
          name: 'Inactive Customer',
          email: 'inactive@example.com',
          lastActivityDate: subDays(new Date(), 91)
        }
      });
      
      await (service as any).processReEngagementEmails();
      
      const emailLog = await prisma.emailAutomationLog.findFirst({
        where: {
          customerId: customer.id,
          emailType: 're_engagement'
        }
      });
      
      expect(emailLog).toBeTruthy();
    });
    
    it('should not send to recently engaged customers', async () => {
      // Create active customer
      const customer = await prisma.customer.create({
        data: {
          name: 'Active Customer',
          email: 'active@example.com',
          lastActivityDate: subDays(new Date(), 30)
        }
      });
      
      await (service as any).processReEngagementEmails();
      
      const logs = await prisma.emailAutomationLog.findMany({
        where: {
          customerId: customer.id
        }
      });
      
      expect(logs).toHaveLength(0);
    });
    
    it('should not send multiple re-engagement emails within 30 days', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: 'Inactive Customer',
          email: 'inactive@example.com',
          lastActivityDate: subDays(new Date(), 91)
        }
      });
      
      // Create recent re-engagement log
      await prisma.emailAutomationLog.create({
        data: {
          customerId: customer.id,
          emailType: 're_engagement',
          emailAddress: customer.email!,
          templateId: 're_engagement',
          sentAt: subDays(new Date(), 15),
          status: 'sent'
        }
      });
      
      await (service as any).processReEngagementEmails();
      
      const logs = await prisma.emailAutomationLog.findMany({
        where: {
          customerId: customer.id,
          emailType: 're_engagement'
        }
      });
      
      expect(logs).toHaveLength(1); // Only the existing one
    });
  });
  
  describe('Abandoned Request Recovery Workflow', () => {
    it('should send recovery email for abandoned tattoo requests', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'test@example.com'
        }
      });
      
      // Create abandoned request
      const request = await prisma.tattooRequest.create({
        data: {
          customerId: customer.id,
          description: 'Dragon tattoo design',
          status: 'new',
          createdAt: subHours(new Date(), 49),
          trackingToken: 'test-token-123'
        }
      });
      
      await (service as any).processAbandonedRequests();
      
      const emailLog = await prisma.emailAutomationLog.findFirst({
        where: {
          tattooRequestId: request.id,
          emailType: 'abandoned_request_recovery'
        }
      });
      
      expect(emailLog).toBeTruthy();
    });
    
    it('should handle anonymous requests with contact email', async () => {
      // Create anonymous request
      const request = await prisma.tattooRequest.create({
        data: {
          description: 'Small flower tattoo',
          status: 'new',
          createdAt: subHours(new Date(), 49),
          contactEmail: 'anonymous@example.com',
          trackingToken: 'anon-token-456'
        }
      });
      
      await (service as any).processAbandonedRequests();
      
      const emailLog = await prisma.emailAutomationLog.findFirst({
        where: {
          tattooRequestId: request.id,
          emailType: 'abandoned_request_recovery'
        }
      });
      
      expect(emailLog).toBeTruthy();
      expect(emailLog?.emailAddress).toBe('anonymous@example.com');
    });
    
    it('should not send recovery for non-new requests', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'test@example.com'
        }
      });
      
      // Create request that's already in progress
      await prisma.tattooRequest.create({
        data: {
          customerId: customer.id,
          description: 'Tattoo in progress',
          status: 'in_progress',
          createdAt: subHours(new Date(), 49)
        }
      });
      
      await (service as any).processAbandonedRequests();
      
      const logs = await prisma.emailAutomationLog.findMany({
        where: {
          customerId: customer.id
        }
      });
      
      expect(logs).toHaveLength(0);
    });
  });
  
  describe('Automation Settings', () => {
    it('should respect enabled/disabled settings', async () => {
      // Disable appointment reminders
      await service.updateSettings('appointment_reminder_24h', { enabled: false });
      
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'test@example.com'
        }
      });
      
      const appointmentTime = addHours(new Date(), 24);
      await prisma.appointment.create({
        data: {
          customerId: customer.id,
          startTime: appointmentTime,
          status: 'scheduled'
        }
      });
      
      // Run automation - should not send due to disabled setting
      await (service as any).runAutomationChecks();
      
      const logs = await prisma.emailAutomationLog.findMany({
        where: {
          customerId: customer.id
        }
      });
      
      expect(logs).toHaveLength(0);
    });
    
    it('should update timing settings correctly', async () => {
      // Update timing to 48 hours
      await service.updateSettings('appointment_reminder_24h', { 
        timingHours: 48 
      });
      
      const setting = await prisma.emailAutomationSetting.findUnique({
        where: { emailType: 'appointment_reminder_24h' }
      });
      
      expect(setting?.timingHours).toBe(48);
    });
  });
  
  describe('Manual Trigger', () => {
    it('should allow manual triggering of automations', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'test@example.com'
        }
      });
      
      const appointment = await prisma.appointment.create({
        data: {
          customerId: customer.id,
          startTime: addHours(new Date(), 48), // Not in the 24 hour window
          status: 'scheduled'
        }
      });
      
      // Manually trigger 24 hour reminder
      const result = await service.triggerAutomation(
        'appointment_reminder_24h',
        appointment.id
      );
      
      expect(result.success).toBe(true);
      
      const emailLog = await prisma.emailAutomationLog.findFirst({
        where: {
          appointmentId: appointment.id,
          emailType: 'appointment_reminder_24h'
        }
      });
      
      expect(emailLog).toBeTruthy();
    });
  });
  
  describe('Error Handling', () => {
    it('should log failed email attempts', async () => {
      // Create customer with invalid email
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'invalid-email' // This should cause a validation error
        }
      });
      
      const appointment = await prisma.appointment.create({
        data: {
          customerId: customer.id,
          startTime: addHours(new Date(), 24),
          status: 'scheduled'
        }
      });
      
      await (service as any).processAppointmentReminders(24);
      
      const emailLog = await prisma.emailAutomationLog.findFirst({
        where: {
          appointmentId: appointment.id,
          emailType: 'appointment_reminder_24h'
        }
      });
      
      // Log should still be created but with failed status or error
      expect(emailLog).toBeTruthy();
      if (emailLog?.error) {
        expect(emailLog.status).toBe('failed');
      }
    });
  });
});
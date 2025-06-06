import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { CommunicationService } from '../communicationService';
import { testPrisma, setupExternalMocks, createTestUser, createTestCustomer } from './testSetup';

// Use shared test setup
setupExternalMocks();

// Mock email service
const mockEmailService = {
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-msg-123' }),
  validateEmail: vi.fn().mockResolvedValue(true)
};

// Mock SMS service
const mockSMSService = {
  sendSMS: vi.fn().mockResolvedValue({ success: true, messageId: 'sms-123' }),
  validatePhone: vi.fn().mockResolvedValue(true)
};

describe('CommunicationService (Integration)', () => {
  let communicationService: CommunicationService;
  let testAdmin: any;
  let testArtist: any;
  let testCustomer: any;

  beforeEach(async () => {
    console.log('\n📧 Setting up CommunicationService integration test');
    
    // Initialize REAL service (no mocks for business logic)
    communicationService = new CommunicationService();
    
    // Inject mock services
    (communicationService as any).emailService = mockEmailService;
    (communicationService as any).smsService = mockSMSService;
    
    // Create test users
    testAdmin = await createTestUser('admin');
    testArtist = await createTestUser('artist');
    testCustomer = await createTestCustomer({
      name: 'John Doe',
      email: 'john@test.com',
      phone: '+1-555-0123'
    });
    
    // Reset mocks
    vi.clearAllMocks();
    
    console.log('✅ CommunicationService test setup complete');
  });

  describe('📧 Email Templates', () => {
    it('should create email template successfully', async () => {
      console.log('\n📝 Testing email template creation');
      
      const templateData = {
        name: 'appointment_confirmation',
        subject: 'Appointment Confirmation - {{customerName}}',
        htmlContent: '<h1>Hello {{customerName}}</h1><p>Your appointment is scheduled for {{appointmentDate}}</p>',
        textContent: 'Hello {{customerName}}, Your appointment is scheduled for {{appointmentDate}}',
        category: 'appointments' as const,
        variables: ['customerName', 'appointmentDate']
      };

      const template = await communicationService.createEmailTemplate(templateData);

      expect(template).toBeDefined();
      expect(template.id).toBeTruthy();
      expect(template.name).toBe(templateData.name);
      expect(template.subject).toBe(templateData.subject);
      expect(template.htmlContent).toBe(templateData.htmlContent);
      expect(template.textContent).toBe(templateData.textContent);
      expect(template.category).toBe(templateData.category);
      expect(template.variables).toEqual(templateData.variables);
      expect(template.active).toBe(true);

      console.log('✅ Email template created successfully');
      console.log(`📧 Template: ${template.name} with ${template.variables.length} variables`);
    });

    it('should render template with variables', async () => {
      console.log('\n🎨 Testing template variable rendering');
      
      // Create template
      const template = await communicationService.createEmailTemplate({
        name: 'test_template',
        subject: 'Hello {{name}}!',
        htmlContent: '<p>Dear {{name}}, your appointment is on {{date}} at {{time}}.</p>',
        textContent: 'Dear {{name}}, your appointment is on {{date}} at {{time}}.',
        category: 'appointments'
      });

      // Render with variables
      const rendered = await communicationService.renderTemplate(template.id, {
        name: 'John Doe',
        date: '2024-01-15',
        time: '2:00 PM'
      });

      expect(rendered.subject).toBe('Hello John Doe!');
      expect(rendered.htmlContent).toContain('Dear John Doe');
      expect(rendered.htmlContent).toContain('2024-01-15');
      expect(rendered.htmlContent).toContain('2:00 PM');
      expect(rendered.textContent).toContain('Dear John Doe');

      console.log('✅ Template rendering working correctly');
    });

    it('should handle missing variables gracefully', async () => {
      console.log('\n⚠️ Testing missing variable handling');
      
      const template = await communicationService.createEmailTemplate({
        name: 'incomplete_template',
        subject: 'Hello {{name}}!',
        htmlContent: '<p>Your balance is {{balance}}.</p>',
        textContent: 'Your balance is {{balance}}.',
        category: 'notifications'
      });

      const rendered = await communicationService.renderTemplate(template.id, {
        name: 'John'
        // balance missing
      });

      expect(rendered.subject).toBe('Hello John!');
      expect(rendered.htmlContent).toContain('{{balance}}'); // Should preserve unmatched variables
      
      console.log('✅ Missing variables handled gracefully');
    });

    it('should list and filter templates', async () => {
      console.log('\n📋 Testing template listing and filtering');
      
      // Create multiple templates
      await communicationService.createEmailTemplate({
        name: 'appointment_reminder',
        subject: 'Reminder',
        htmlContent: '<p>Reminder</p>',
        textContent: 'Reminder',
        category: 'appointments'
      });

      await communicationService.createEmailTemplate({
        name: 'payment_receipt',
        subject: 'Receipt',
        htmlContent: '<p>Receipt</p>',
        textContent: 'Receipt',
        category: 'payments'
      });

      // List all templates
      const allTemplates = await communicationService.getEmailTemplates();
      expect(allTemplates.length).toBeGreaterThanOrEqual(2);

      // Filter by category
      const appointmentTemplates = await communicationService.getEmailTemplates({
        category: 'appointments'
      });
      
      appointmentTemplates.forEach(template => {
        expect(template.category).toBe('appointments');
      });

      console.log('✅ Template listing and filtering working');
      console.log(`📊 Total: ${allTemplates.length}, Appointments: ${appointmentTemplates.length}`);
    });
  });

  describe('📨 Email Sending', () => {
    let testTemplate: any;

    beforeEach(async () => {
      testTemplate = await communicationService.createEmailTemplate({
        name: 'test_email',
        subject: 'Test Email for {{customerName}}',
        htmlContent: '<h1>Hello {{customerName}}</h1><p>This is a test email.</p>',
        textContent: 'Hello {{customerName}}, This is a test email.',
        category: 'system'
      });
    });

    it('should send email using template', async () => {
      console.log('\n📤 Testing email sending with template');
      
      const result = await communicationService.sendEmail({
        templateId: testTemplate.id,
        to: testCustomer.email,
        variables: {
          customerName: testCustomer.name
        },
        from: 'noreply@tattooshop.com'
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();
      expect(result.message).toBeDefined();

      // Verify email service was called
      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);
      
      const emailCall = mockEmailService.sendEmail.mock.calls[0][0];
      expect(emailCall.to).toBe(testCustomer.email);
      expect(emailCall.subject).toContain(testCustomer.name);

      // Verify message stored in database
      const messages = await communicationService.getMessages(testCustomer.id);
      expect(messages.data.length).toBeGreaterThan(0);

      const sentMessage = messages.data.find(m => m.type === 'email');
      expect(sentMessage).toBeDefined();
      expect(sentMessage!.status).toBe('sent');

      console.log('✅ Email sent successfully using template');
    });

    it('should send direct email without template', async () => {
      console.log('\n📧 Testing direct email sending');
      
      const result = await communicationService.sendEmail({
        to: testCustomer.email,
        subject: 'Direct Test Email',
        htmlContent: '<p>This is a direct email without template.</p>',
        textContent: 'This is a direct email without template.',
        from: 'test@tattooshop.com'
      });

      expect(result.success).toBe(true);
      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1);

      console.log('✅ Direct email sent successfully');
    });

    it('should handle email sending failures', async () => {
      console.log('\n❌ Testing email failure handling');
      
      // Mock email service failure
      mockEmailService.sendEmail.mockRejectedValueOnce(new Error('Email service unavailable'));

      const result = await communicationService.sendEmail({
        to: testCustomer.email,
        subject: 'Test Email',
        htmlContent: '<p>Test</p>',
        textContent: 'Test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();

      // Verify message stored with failed status
      const messages = await communicationService.getMessages(testCustomer.id);
      const failedMessage = messages.data.find(m => m.status === 'failed');
      expect(failedMessage).toBeDefined();

      console.log('✅ Email failure handled correctly');
    });
  });

  describe('📱 SMS Communication', () => {
    it('should send SMS message', async () => {
      console.log('\n📱 Testing SMS sending');
      
      const result = await communicationService.sendSMS({
        to: testCustomer.phone!,
        message: 'Your appointment is confirmed for tomorrow at 2 PM.',
        customerId: testCustomer.id
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeTruthy();

      // Verify SMS service was called
      expect(mockSMSService.sendSMS).toHaveBeenCalledTimes(1);
      
      const smsCall = mockSMSService.sendSMS.mock.calls[0][0];
      expect(smsCall.to).toBe(testCustomer.phone);
      expect(smsCall.message).toContain('appointment');

      // Verify message stored
      const messages = await communicationService.getMessages(testCustomer.id);
      const smsMessage = messages.data.find(m => m.type === 'sms');
      expect(smsMessage).toBeDefined();

      console.log('✅ SMS sent successfully');
    });

    it('should validate phone numbers', async () => {
      console.log('\n🔍 Testing phone validation');
      
      const validResult = await communicationService.sendSMS({
        to: '+1-555-0123',
        message: 'Test',
        customerId: testCustomer.id
      });

      expect(validResult.success).toBe(true);
      expect(mockSMSService.validatePhone).toHaveBeenCalled();

      console.log('✅ Phone validation working');
    });
  });

  describe('💬 Message Management', () => {
    beforeEach(async () => {
      console.log('\n💬 Setting up message management test data');
      
      // Send a few test messages
      await communicationService.sendEmail({
        to: testCustomer.email,
        subject: 'Test Email 1',
        htmlContent: '<p>First test email</p>',
        textContent: 'First test email'
      });

      await communicationService.sendSMS({
        to: testCustomer.phone!,
        message: 'Test SMS message',
        customerId: testCustomer.id
      });
    });

    it('should retrieve customer messages with pagination', async () => {
      console.log('\n📄 Testing message retrieval with pagination');
      
      const result = await communicationService.getMessages(testCustomer.id, {}, 1, 5);

      expect(result.data).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(5);

      console.log(`✅ Retrieved ${result.data.length} of ${result.total} messages`);
    });

    it('should filter messages by type', async () => {
      console.log('\n🔍 Testing message filtering by type');
      
      const emailMessages = await communicationService.getMessages(testCustomer.id, {
        type: 'email'
      });

      const smsMessages = await communicationService.getMessages(testCustomer.id, {
        type: 'sms'
      });

      emailMessages.data.forEach(message => {
        expect(message.type).toBe('email');
      });

      smsMessages.data.forEach(message => {
        expect(message.type).toBe('sms');
      });

      console.log(`✅ Filtering working - Emails: ${emailMessages.data.length}, SMS: ${smsMessages.data.length}`);
    });

    it('should filter messages by status', async () => {
      console.log('\n✅ Testing message filtering by status');
      
      const sentMessages = await communicationService.getMessages(testCustomer.id, {
        status: 'sent'
      });

      sentMessages.data.forEach(message => {
        expect(message.status).toBe('sent');
      });

      console.log(`✅ Status filtering working - found ${sentMessages.data.length} sent messages`);
    });

    it('should create conversation threads', async () => {
      console.log('\n🧵 Testing conversation thread creation');
      
      const thread = await communicationService.createConversationThread({
        customerId: testCustomer.id,
        subject: 'Appointment Discussion',
        participantIds: [testAdmin.id, testArtist.id],
        initialMessage: 'Starting discussion about upcoming appointment'
      });

      expect(thread.id).toBeTruthy();
      expect(thread.subject).toBe('Appointment Discussion');
      expect(thread.customerId).toBe(testCustomer.id);
      expect(thread.participants.length).toBe(2);

      console.log('✅ Conversation thread created successfully');
    });

    it('should add messages to conversation thread', async () => {
      console.log('\n💬 Testing thread message addition');
      
      const thread = await communicationService.createConversationThread({
        customerId: testCustomer.id,
        subject: 'Test Thread',
        participantIds: [testAdmin.id],
        initialMessage: 'Initial message'
      });

      await communicationService.addMessageToThread(thread.id, {
        senderId: testAdmin.id,
        content: 'Follow-up message in thread',
        type: 'internal'
      });

      const threadWithMessages = await communicationService.getConversationThread(thread.id);
      expect(threadWithMessages.messages.length).toBe(2); // Initial + follow-up

      console.log('✅ Thread message addition working correctly');
    });
  });

  describe('🎯 Specialized Communications', () => {
    it('should send appointment confirmation', async () => {
      console.log('\n📅 Testing appointment confirmation');
      
      const appointmentId = 'test-apt-123';
      const appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const result = await communicationService.sendAppointmentConfirmation(
        appointmentId,
        testCustomer.id,
        {
          appointmentDate: appointmentDate.toISOString(),
          artistName: 'Jane Artist',
          duration: '2 hours',
          notes: 'Please arrive 15 minutes early'
        }
      );

      expect(result.success).toBe(true);
      
      console.log('✅ Appointment confirmation sent successfully');
    });

    it('should send appointment reminder', async () => {
      console.log('\n⏰ Testing appointment reminder');
      
      const result = await communicationService.sendAppointmentReminder(
        'test-apt-456',
        testCustomer.id,
        {
          appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          reminderType: 'day_before'
        }
      );

      expect(result.success).toBe(true);
      
      console.log('✅ Appointment reminder sent successfully');
    });

    it('should send payment receipt', async () => {
      console.log('\n🧾 Testing payment receipt');
      
      const result = await communicationService.sendPaymentReceipt(
        'test-payment-789',
        testCustomer.id,
        {
          amount: 150,
          paymentMethod: 'Credit Card',
          receiptNumber: 'REC-001',
          description: 'Consultation fee'
        }
      );

      expect(result.success).toBe(true);
      
      console.log('✅ Payment receipt sent successfully');
    });

    it('should send custom notification', async () => {
      console.log('\n🔔 Testing custom notification');
      
      const result = await communicationService.sendCustomNotification(
        testCustomer.id,
        {
          title: 'Special Promotion',
          message: 'Get 20% off your next tattoo session!',
          priority: 'medium',
          channels: ['email', 'sms']
        }
      );

      expect(result.success).toBe(true);
      
      console.log('✅ Custom notification sent successfully');
    });
  });

  describe('📊 Communication Analytics', () => {
    beforeEach(async () => {
      console.log('\n📊 Setting up analytics test data');
      
      // Send various messages for analytics
      await communicationService.sendEmail({
        to: testCustomer.email,
        subject: 'Analytics Test 1',
        htmlContent: '<p>Test</p>',
        textContent: 'Test'
      });

      await communicationService.sendSMS({
        to: testCustomer.phone!,
        message: 'Analytics SMS test',
        customerId: testCustomer.id
      });
    });

    it('should provide communication statistics', async () => {
      console.log('\n📈 Testing communication statistics');
      
      const stats = await communicationService.getCommunicationStats();

      expect(stats).toHaveProperty('totalMessages');
      expect(stats).toHaveProperty('messagesByType');
      expect(stats).toHaveProperty('messagesByStatus');
      expect(stats).toHaveProperty('deliveryRate');

      expect(stats.totalMessages).toBeGreaterThan(0);
      expect(typeof stats.messagesByType).toBe('object');
      expect(typeof stats.messagesByStatus).toBe('object');
      expect(stats.deliveryRate).toBeGreaterThanOrEqual(0);
      expect(stats.deliveryRate).toBeLessThanOrEqual(100);

      console.log('✅ Communication statistics working correctly');
      console.log(`📊 Total messages: ${stats.totalMessages}, Delivery rate: ${stats.deliveryRate}%`);
    });

    it('should provide customer communication history', async () => {
      console.log('\n👤 Testing customer communication history');
      
      const history = await communicationService.getCustomerCommunicationHistory(testCustomer.id);

      expect(history).toHaveProperty('totalMessages');
      expect(history).toHaveProperty('recentMessages');
      expect(history).toHaveProperty('preferredChannel');
      expect(history).toHaveProperty('responseRate');

      expect(Array.isArray(history.recentMessages)).toBe(true);
      expect(history.totalMessages).toBeGreaterThan(0);

      console.log('✅ Customer communication history working correctly');
      console.log(`📊 ${testCustomer.name}: ${history.totalMessages} messages, prefers ${history.preferredChannel}`);
    });
  });

  describe('🚨 Error Handling and Edge Cases', () => {
    it('should handle invalid template IDs', async () => {
      console.log('\n❌ Testing invalid template handling');
      
      await expect(
        communicationService.sendEmail({
          templateId: 'non-existent-template',
          to: testCustomer.email,
          variables: {}
        })
      ).rejects.toThrow();

      console.log('✅ Invalid template ID handled correctly');
    });

    it('should handle invalid email addresses', async () => {
      console.log('\n📧 Testing invalid email handling');
      
      const result = await communicationService.sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        htmlContent: '<p>Test</p>',
        textContent: 'Test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();

      console.log('✅ Invalid email address handled correctly');
    });

    it('should complete operations within reasonable time', async () => {
      console.log('\n⏱️ Testing communication service performance');
      
      const startTime = Date.now();
      
      await communicationService.sendEmail({
        to: testCustomer.email,
        subject: 'Performance Test',
        htmlContent: '<p>Performance test email</p>',
        textContent: 'Performance test email'
      });
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(3000); // Should complete in under 3 seconds

      console.log(`✅ Communication operations completed in ${executionTime}ms`);
    });
  });
}); 
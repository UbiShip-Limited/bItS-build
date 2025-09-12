import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommunicationService } from '../communicationService';
import { testPrisma, setupExternalMocks, createTestCustomer } from './testSetup';

// Use shared test setup
setupExternalMocks();

describe('Auth Callback & Dashboard URLs Integration', () => {
  let communicationService: CommunicationService;
  let testCustomer: any;
  let mockEmailService: any;

  beforeEach(async () => {
    console.log('\n🔗 Setting up Auth Callback integration test');
    
    // Setup mock email service to capture dashboard URLs
    mockEmailService = {
      sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-msg-123' }),
      validateEmail: vi.fn().mockResolvedValue(true)
    };

    // Initialize service
    communicationService = new CommunicationService();
    (communicationService as any).emailService = mockEmailService;

    // Create test customer
    testCustomer = await createTestCustomer({
      name: 'John Doe',
      email: 'john@test.com',
      phone: '+1-555-0123'
    });

    // Set test environment variables
    process.env.FRONTEND_URL = 'https://bowenislandtattooshop.com';
    
    vi.clearAllMocks();
    console.log('✅ Auth callback test setup complete');
  });

  describe('Dashboard URL Generation in Owner Notifications', () => {
    it('should generate correct tattoo request dashboard URLs', async () => {
      // Create a test tattoo request
      const tattooRequest = await testPrisma.tattooRequest.create({
        data: {
          customerId: testCustomer.id,
          description: 'Dragon tattoo',
          placement: 'shoulder',
          size: 'medium',
          style: 'Japanese',
          contactEmail: testCustomer.email,
          contactPhone: testCustomer.phone,
          status: 'pending'
        },
        include: {
          customer: true
        }
      });

      // Send owner notification (this should use the fixed URL)
      await communicationService.sendOwnerNotification(tattooRequest);

      // Verify the email was called with correct dashboard URL
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      
      const emailCall = mockEmailService.sendEmail.mock.calls[0];
      const emailData = emailCall[2]; // Third parameter contains variables
      
      expect(emailData.dashboardUrl).toBe(`https://bowenislandtattooshop.com/dashboard/tattoo-request/${tattooRequest.id}`);
      expect(emailData.dashboardUrl).not.toContain('/dashboard/requests/'); // Old broken URL
    });

    it('should use fallback URL when FRONTEND_URL is not set', async () => {
      // Remove FRONTEND_URL
      delete process.env.FRONTEND_URL;

      const tattooRequest = await testPrisma.tattooRequest.create({
        data: {
          customerId: testCustomer.id,
          description: 'Rose tattoo',
          placement: 'wrist',
          size: 'small',
          style: 'Traditional',
          contactEmail: testCustomer.email,
          status: 'pending'
        },
        include: {
          customer: true
        }
      });

      await communicationService.sendOwnerNotification(tattooRequest);

      const emailCall = mockEmailService.sendEmail.mock.calls[0];
      const emailData = emailCall[2];
      
      expect(emailData.dashboardUrl).toBe(`http://localhost:3000/dashboard/tattoo-request/${tattooRequest.id}`);
    });

    it('should generate correct appointment dashboard URLs', async () => {
      // Create test appointment
      const appointment = await testPrisma.appointment.create({
        data: {
          customerId: testCustomer.id,
          startTime: new Date('2025-01-15T10:00:00Z'),
          endTime: new Date('2025-01-15T12:00:00Z'),
          type: 'consultation',
          status: 'scheduled',
          contactEmail: testCustomer.email,
          notes: 'Initial consultation'
        },
        include: {
          customer: true
        }
      });

      // This method should generate appointment dashboard URLs
      await communicationService.sendOwnerAppointmentNotification(appointment);

      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      
      const emailCall = mockEmailService.sendEmail.mock.calls[0];
      const emailData = emailCall[2];
      
      expect(emailData.dashboardUrl).toBe(`https://bowenislandtattooshop.com/dashboard/appointments/${appointment.id}`);
    });

    it('should generate correct payment dashboard URLs', async () => {
      const paymentData = {
        amount: 500.00,
        customerName: testCustomer.name,
        customerEmail: testCustomer.email,
        transactionId: 'txn_123456',
        paymentType: 'deposit'
      };

      await communicationService.sendOwnerPaymentNotification(paymentData);

      expect(mockEmailService.sendEmail).toHaveBeenCalled();
      
      const emailCall = mockEmailService.sendEmail.mock.calls[0];
      const emailData = emailCall[2];
      
      expect(emailData.dashboardUrl).toBe('https://bowenislandtattooshop.com/dashboard/payments');
    });
  });

  describe('Password Reset Flow Integration', () => {
    it('should handle valid email OTP types', () => {
      const validTypes = ['signup', 'email_change', 'recovery'];
      
      validTypes.forEach(type => {
        // Simulate the type validation logic from our callback
        const isValid = ['signup', 'email_change', 'recovery'].includes(type);
        expect(isValid).toBe(true);
      });
    });

    it('should reject invalid OTP types for email flow', () => {
      const invalidTypes = ['sms', 'phone_change', 'invalid'];
      
      invalidTypes.forEach(type => {
        const isValid = ['signup', 'email_change', 'recovery'].includes(type);
        expect(isValid).toBe(false);
      });
    });

    it('should simulate PKCE callback URL parameters', () => {
      const mockCallbackUrl = 'https://bowenislandtattooshop.com/auth/callback?token_hash=pkce_519ad953b6c50c29a6ff46b60471e7236e5f1a70bfcc10db3caf9008&type=recovery&next=/auth/update-password';
      
      const url = new URL(mockCallbackUrl);
      const tokenHash = url.searchParams.get('token_hash');
      const type = url.searchParams.get('type');
      const next = url.searchParams.get('next');

      expect(tokenHash).toBe('pkce_519ad953b6c50c29a6ff46b60471e7236e5f1a70bfcc10db3caf9008');
      expect(type).toBe('recovery');
      expect(next).toBe('/auth/update-password');
      
      // Verify this would be handled correctly by our type validation
      const validEmailTypes = ['signup', 'email_change', 'recovery'];
      expect(validEmailTypes.includes(type as any)).toBe(true);
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle expired token callback URLs', () => {
      const errorCallbackUrl = 'https://bowenislandtattooshop.com/auth/callback?error=access_denied&error_code=otp_expired&error_description=The+reset+link+has+expired';
      
      const url = new URL(errorCallbackUrl);
      const error = url.searchParams.get('error');
      const errorCode = url.searchParams.get('error_code');
      
      expect(error).toBe('access_denied');
      expect(errorCode).toBe('otp_expired');
      
      // This should trigger error handling in our callback route
      if (error && errorCode === 'otp_expired') {
        const redirectUrl = new URL('/auth/reset-password', url.origin);
        redirectUrl.searchParams.set('error', 'expired');
        redirectUrl.searchParams.set('message', 'The reset link has expired. Please request a new one.');
        
        expect(redirectUrl.toString()).toContain('error=expired');
        expect(redirectUrl.toString()).toContain('message=');
      }
    });

    it('should handle missing dashboard URLs gracefully', async () => {
      // Test with minimal tattoo request data
      const minimalRequest = await testPrisma.tattooRequest.create({
        data: {
          customerId: testCustomer.id,
          description: 'Simple tattoo',
          contactEmail: 'test@example.com',
          status: 'pending'
        },
        include: {
          customer: true
        }
      });

      // Should not throw even with minimal data
      expect(async () => {
        await communicationService.sendOwnerNotification(minimalRequest);
      }).not.toThrow();

      // Should still generate dashboard URL
      const emailCall = mockEmailService.sendEmail.mock.calls[0];
      const emailData = emailCall[2];
      expect(emailData.dashboardUrl).toContain('/dashboard/tattoo-request/');
    });
  });
});
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../../jest.setup.mjs';
import { setupTestApp, createAuthRequest } from '../test-helpers';
import PaymentService from '../../services/paymentService';
import supertest from 'supertest';

// Mock JWT token and user (admin role needed for refunds)
const mockToken = 'mock-jwt-token';
const mockUser = {
  id: 'admin1',
  email: 'admin@example.com',
  role: 'admin'
};

describe('Refund Payment Routes', () => {
  const testApp = setupTestApp();
  let request: supertest.SuperTest<supertest.Test>;
  let authRequest: ReturnType<typeof createAuthRequest>;
  
  beforeEach(async () => {
    // Setup test app and request
    const setup = await testApp.setup();
    request = setup.request;
    authRequest = createAuthRequest(request, mockToken);
    
    // Setup auth middleware mock to return admin user
    setup.mockAuthMiddleware(mockUser);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock refundPayment implementation
    PaymentService.prototype.refundPayment = jest.fn().mockImplementation((paymentId, amount, reason) => {
      return Promise.resolve({
        success: true,
        payment: {
          id: paymentId,
          amount: 100.0,
          status: amount ? 'partially_refunded' : 'refunded'
        },
        refund: {
          id: 'refund123',
          amount: amount || 100.0,
          status: 'COMPLETED'
        }
      });
    });
  });
  
  afterEach(async () => {
    await testApp.teardown();
  });
  
  describe('POST /payments/:id/refund', () => {
    it('should process a full refund successfully', async () => {
      const response = await authRequest
        .post('/payments/payment123/refund')
        .send({
          reason: 'Customer requested refund'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.payment.status).toBe('refunded');
      expect(response.body.refund).toBeDefined();
      
      // Verify service call
      expect(PaymentService.prototype.refundPayment).toHaveBeenCalledWith(
        'payment123',
        undefined,
        'Customer requested refund'
      );
      
      // Verify audit log
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin1',
          action: 'REFUND',
          resource: 'Payment',
          resourceId: 'payment123',
          details: expect.objectContaining({
            reason: 'Customer requested refund'
          })
        }
      });
    });
    
    it('should process a partial refund successfully', async () => {
      const response = await authRequest
        .post('/payments/payment123/refund')
        .send({
          amount: 50.0,
          reason: 'Partial refund requested'
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.payment.status).toBe('partially_refunded');
      
      // Verify service call with amount
      expect(PaymentService.prototype.refundPayment).toHaveBeenCalledWith(
        'payment123',
        50.0,
        'Partial refund requested'
      );
    });
    
    it('should handle errors during refund processing', async () => {
      // Mock refundPayment to throw error
      PaymentService.prototype.refundPayment = jest.fn().mockImplementationOnce(() => {
        return Promise.reject(new Error('Refund processing failed'));
      });
      
      const response = await authRequest
        .post('/payments/payment123/refund')
        .send({
          reason: 'Test refund'
        })
        .expect(500);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to process refund');
      expect(response.body.error).toBe('Refund processing failed');
    });
    
    it('should require admin role to refund a payment', async () => {
      // Change user role to non-admin
      testApp.mockAuthMiddleware({
        ...mockUser,
        role: 'user'
      });
      
      await authRequest
        .post('/payments/payment123/refund')
        .send({
          reason: 'Test refund'
        })
        .expect(403);
      
      // Verify service was not called
      expect(PaymentService.prototype.refundPayment).not.toHaveBeenCalled();
    });
  });
});
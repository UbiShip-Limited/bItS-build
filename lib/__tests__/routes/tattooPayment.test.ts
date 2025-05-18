import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient } from '../../../jest.setup.mjs';
import { setupTestApp, createAuthRequest } from '../test-helpers';
import PaymentService, { PaymentType } from '../../services/paymentService';
import BookingService, { BookingType } from '../../services/bookingService';
import supertest from 'supertest';

// Mock JWT token and user
const mockToken = 'mock-jwt-token';
const mockUser = {
  id: 'user1',
  email: 'user@example.com',
  role: 'user'
};

describe('Tattoo Payment Routes', () => {
  const testApp = setupTestApp();
  let request: supertest.SuperTest<supertest.Test>;
  let authRequest: ReturnType<typeof createAuthRequest>;
  
  // Mock data
  const mockTattooDepositRequest = {
    sourceId: 'src_123456',
    amount: 100.0,
    customerId: 'customer123',
    tattooRequestId: 'tattoo123',
    sessionDate: new Date().toISOString(),
    duration: 180,
    note: 'Test tattoo deposit',
    staffId: 'staff123'
  };
  
  const mockTattooFinalRequest = {
    sourceId: 'src_123456',
    amount: 400.0,
    customerId: 'customer123',
    tattooRequestId: 'tattoo123',
    note: 'Test final payment',
    staffId: 'staff123'
  };
  
  beforeEach(async () => {
    // Setup test app and request
    const setup = await testApp.setup();
    request = setup.request;
    authRequest = createAuthRequest(request, mockToken);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock service implementations
    PaymentService.prototype.processPayment = jest.fn().mockImplementation((params) => {
      return Promise.resolve({
        success: true,
        payment: {
          id: 'payment123',
          amount: params.amount,
          status: 'completed',
          paymentType: params.paymentType,
          customerId: params.customerId
        },
        squarePayment: {
          id: 'sq_payment_123'
        }
      });
    });
    
    BookingService.prototype.createBooking = jest.fn().mockImplementation((params) => {
      return Promise.resolve({
        success: true,
        booking: {
          id: 'booking123',
          startAt: new Date(params.startAt),
          duration: params.duration,
          customerId: params.customerId,
          bookingType: params.bookingType,
          artistId: params.artistId
        }
      });
    });
  });
  
  afterEach(async () => {
    await testApp.teardown();
  });
  
  describe('POST /payments/tattoo-deposit', () => {
    it('should process a tattoo deposit payment with booking successfully', async () => {
      const response = await authRequest
        .post('/payments/tattoo-deposit')
        .send(mockTattooDepositRequest)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.booking).toBeDefined();
      
      // Verify service calls
      expect(BookingService.prototype.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          startAt: expect.any(Date),
          duration: 180,
          customerId: 'customer123',
          bookingType: BookingType.TATTOO_SESSION,
          artistId: 'staff123'
        })
      );
      
      expect(PaymentService.prototype.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceId: 'src_123456',
          amount: 100.0,
          customerId: 'customer123',
          paymentType: PaymentType.TATTOO_DEPOSIT,
          bookingId: 'booking123'
        })
      );
      
      // Verify tattoo request was updated
      expect(mockPrismaClient.tattooRequest.update).toHaveBeenCalledWith({
        where: { id: 'tattoo123' },
        data: { 
          deposit_paid: true,
          deposit_amount: 100.0,
          payment_id: 'payment123',
          status: 'deposit_paid'
        }
      });
    });
    
    it('should process a tattoo deposit payment without booking', async () => {
      const requestWithoutDate = { ...mockTattooDepositRequest };
      delete requestWithoutDate.sessionDate;
      
      const response = await authRequest
        .post('/payments/tattoo-deposit')
        .send(requestWithoutDate)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.booking).toBeUndefined();
      
      // Verify booking service was not called
      expect(BookingService.prototype.createBooking).not.toHaveBeenCalled();
      expect(PaymentService.prototype.processPayment).toHaveBeenCalled();
    });
  });
  
  describe('POST /payments/tattoo-final', () => {
    it('should process a final tattoo payment successfully', async () => {
      const response = await authRequest
        .post('/payments/tattoo-final')
        .send(mockTattooFinalRequest)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      
      // Verify payment service call
      expect(PaymentService.prototype.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceId: 'src_123456',
          amount: 400.0,
          customerId: 'customer123',
          paymentType: PaymentType.TATTOO_FINAL
        })
      );
      
      // Verify tattoo request was updated
      expect(mockPrismaClient.tattooRequest.update).toHaveBeenCalledWith({
        where: { id: 'tattoo123' },
        data: { 
          final_paid: true,
          final_amount: 400.0,
          final_payment_id: 'payment123',
          status: 'completed'
        }
      });
    });
  });
});
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient, mockSquareClient } from '../../../jest.setup.mjs';
import { setupTestApp, createAuthRequest, dateToISOStrings } from '../test-helpers';
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

describe('Consultation Payment Routes', () => {
  const testApp = setupTestApp();
  let request: supertest.SuperTest<supertest.Test>;
  let authRequest: ReturnType<typeof createAuthRequest>;
  
  // Mock data
  const mockConsultationPaymentRequest = {
    sourceId: 'src_123456',
    amount: 50.0,
    customerId: 'customer123',
    note: 'Test consultation',
    consultationDate: new Date().toISOString(),
    duration: 60
  };
  
  const mockDrawingConsultationRequest = {
    sourceId: 'src_123456',
    amount: 75.0,
    customerId: 'customer123',
    note: 'Test drawing consultation',
    consultationDate: new Date().toISOString(),
    duration: 90
  };
  
  beforeEach(async () => {
    // Setup test app and request
    const setup = await testApp.setup();
    request = setup.request;
    authRequest = createAuthRequest(request, mockToken);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock PaymentService's processPayment method
    const mockProcessPayment = jest.fn().mockImplementation((params) => {
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
    
    // Mock BookingService's createBooking method
    const mockCreateBooking = jest.fn().mockImplementation((params) => {
      return Promise.resolve({
        success: true,
        booking: {
          id: 'booking123',
          startAt: new Date(params.startAt),
          duration: params.duration,
          customerId: params.customerId,
          bookingType: params.bookingType
        }
      });
    });
    
    // Apply mocks to prototype methods
    PaymentService.prototype.processPayment = mockProcessPayment;
    BookingService.prototype.createBooking = mockCreateBooking;
  });
  
  afterEach(async () => {
    await testApp.teardown();
  });
  
  describe('POST /payments/consultation', () => {
    it('should process a consultation payment successfully', async () => {
      const response = await authRequest
        .post('/payments/consultation')
        .send(mockConsultationPaymentRequest)
        .expect(200)
        .expect('Content-Type', /json/);
      
      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.booking).toBeDefined();
      
      // Verify service calls
      expect(BookingService.prototype.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          startAt: expect.any(Date),
          duration: 60,
          customerId: 'customer123',
          bookingType: BookingType.CONSULTATION
        })
      );
      
      expect(PaymentService.prototype.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceId: 'src_123456',
          amount: 50.0,
          customerId: 'customer123',
          paymentType: PaymentType.CONSULTATION,
          bookingId: 'booking123'
        })
      );
      
      // Verify the booking was linked to the payment
      expect(mockPrismaClient.appointment.update).toHaveBeenCalledWith({
        where: { id: 'booking123' },
        data: { id: 'payment123' }
      });
    });
    
    it('should process a consultation payment without booking when date not provided', async () => {
      const requestWithoutDate = { ...mockConsultationPaymentRequest };
      delete requestWithoutDate.consultationDate;
      
      const response = await authRequest
        .post('/payments/consultation')
        .send(requestWithoutDate)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.payment).toBeDefined();
      expect(response.body.booking).toBeUndefined();
      
      // Verify only payment service was called
      expect(BookingService.prototype.createBooking).not.toHaveBeenCalled();
      expect(PaymentService.prototype.processPayment).toHaveBeenCalled();
    });
    
    it('should handle errors during payment processing', async () => {
      // Mock payment service to throw error
      (PaymentService.prototype.processPayment as jest.Mock).mockImplementationOnce(() => {
        return Promise.reject(new Error('Payment processing failed'));
      });
      
      const response = await authRequest
        .post('/payments/consultation')
        .send(mockConsultationPaymentRequest)
        .expect(500);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to process consultation payment');
      expect(response.body.error).toBe('Payment processing failed');
    });
  });
  
  describe('POST /payments/drawing-consultation', () => {
    it('should process a drawing consultation payment successfully', async () => {
      const response = await authRequest
        .post('/payments/drawing-consultation')
        .send(mockDrawingConsultationRequest)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      
      // Verify service calls with drawing consultation parameters
      expect(BookingService.prototype.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: 90,
          bookingType: BookingType.DRAWING_CONSULTATION
        })
      );
      
      expect(PaymentService.prototype.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 75.0,
          paymentType: PaymentType.DRAWING_CONSULTATION
        })
      );
    });
  });
});
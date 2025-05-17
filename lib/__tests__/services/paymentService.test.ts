import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient, mockSquareClient } from '../../../jest.setup.mjs';
import { v4 as uuidv4 } from 'uuid';
import PaymentService, { PaymentType } from '../../services/paymentService.js';

// Mock the uuid generation for consistent test results
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid-123')
}));

// Import the already mocked Square client
import SquareClient from '../../square/index.js';

describe('PaymentService', () => {
  let paymentService: PaymentService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock the customer lookup to return a customer with the EXACT pattern used in the service
    mockPrismaClient.customer.findUnique.mockImplementation((args) => {
      if (args && args.where && args.where.id === 'customer123') {
        return Promise.resolve({
          id: 'customer123',
          name: 'Test Customer',
          email: 'test@example.com',
          phoneNumber: '+1234567890',
          squareId: 'square-customer-123'
        });
      }
      return Promise.resolve(null);
    });
    
    // Setup mock Square client response
    mockSquareClient.createPayment.mockResolvedValue({
      result: {
        payment: {
          id: 'sq_payment_123',
          amount_money: { amount: 5000, currency: 'CAD' },
          status: 'COMPLETED',
          source_type: 'CARD'
        }
      }
    });
    
    // Setup mock Prisma responses
    mockPrismaClient.payment.create.mockResolvedValue({
      id: 'payment123',
      amount: 50.0,
      status: 'completed',
      paymentMethod: 'card',
      paymentType: 'consultation',
      squareId: 'sq_payment_123',
      customerId: 'customer123',
      bookingId: 'booking123',
      referenceId: 'mocked-uuid-123',
      paymentDetails: {
        id: 'sq_payment_123',
        amount_money: { amount: 5000, currency: 'CAD' },
        status: 'COMPLETED',
        source_type: 'CARD'
      }
    });
    
    mockPrismaClient.auditLog.create.mockResolvedValue({
      id: 'audit123'
    });
    
    // Initialize PaymentService
    paymentService = new PaymentService();
  });
  
  describe('processPayment', () => {
    it('should process a consultation payment successfully', async () => {
      const paymentParams = {
        sourceId: 'source_123',
        amount: 50.0,
        customerId: 'customer123',
        paymentType: PaymentType.CONSULTATION,
        bookingId: 'booking123',
        note: 'Test consultation payment'
      };
      
      const result = await paymentService.processPayment(paymentParams);
      
      // Check result
      expect(result.success).toBe(true);
      expect(result.payment.id).toBe('payment123');
      expect(result.payment.amount).toBe(50.0);
      expect(result.payment.status).toBe('completed');
      expect(result.payment.paymentType).toBe('consultation');
      
      // Check Square client was called correctly
      expect(mockSquareClient.createPayment).toHaveBeenCalledWith({
        sourceId: 'source_123',
        amount: 50.0,
        currency: 'CAD',
        customerId: 'customer123',
        note: 'Test consultation payment',
        idempotencyKey: 'mocked-uuid-123',
        referenceId: 'booking123'
      });
      
      // Check Prisma payment.create was called correctly
      expect(mockPrismaClient.payment.create).toHaveBeenCalledWith({
        data: {
          amount: 50.0,
          status: 'completed',
          paymentMethod: 'card',
          paymentType: PaymentType.CONSULTATION,
          squareId: 'sq_payment_123',
          customerId: 'customer123',
          bookingId: 'booking123',
          referenceId: 'booking123',
          paymentDetails: expect.any(Object)
        }
      });
      
      // Check audit log was created
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'payment_processed',
          resourceType: 'payment',
          resourceId: 'payment123',
          details: expect.objectContaining({
            paymentType: PaymentType.CONSULTATION,
            amount: 50.0,
            customerId: 'customer123'
          })
        }
      });
    });
    
    it('should process a drawing consultation payment successfully', async () => {
      const paymentParams = {
        sourceId: 'source_123',
        amount: 75.0,
        customerId: 'customer123',
        paymentType: PaymentType.DRAWING_CONSULTATION,
        bookingId: 'booking123',
        note: 'Test drawing consultation payment'
      };
      
      // Setup payment return value specific to this test
      mockPrismaClient.payment.create.mockResolvedValueOnce({
        id: 'payment123',
        amount: 75.0,
        status: 'completed',
        paymentMethod: 'card',
        paymentType: 'drawing_consultation',
        squareId: 'sq_payment_123',
        customerId: 'customer123',
        bookingId: 'booking123',
        referenceId: 'mocked-uuid-123',
        paymentDetails: {
          id: 'sq_payment_123',
          amount_money: { amount: 7500, currency: 'CAD' },
          status: 'COMPLETED',
          source_type: 'CARD'
        }
      });
      
      const result = await paymentService.processPayment(paymentParams);
      
      // Check result
      expect(result.success).toBe(true);
      expect(result.payment.paymentType).toBe('drawing_consultation');
      expect(result.payment.amount).toBe(75.0);
    });
    
    it('should process a tattoo deposit payment successfully', async () => {
      const paymentParams = {
        sourceId: 'source_123',
        amount: 100.0,
        customerId: 'customer123',
        paymentType: PaymentType.TATTOO_DEPOSIT,
        bookingId: 'booking123',
        note: 'Test tattoo deposit payment'
      };
      
      // Setup payment return value specific to this test
      mockPrismaClient.payment.create.mockResolvedValueOnce({
        id: 'payment123',
        amount: 100.0,
        status: 'completed',
        paymentMethod: 'card',
        paymentType: 'tattoo_deposit',
        squareId: 'sq_payment_123',
        customerId: 'customer123',
        bookingId: 'booking123',
        referenceId: 'mocked-uuid-123',
        paymentDetails: {
          id: 'sq_payment_123',
          amount_money: { amount: 10000, currency: 'CAD' },
          status: 'COMPLETED',
          source_type: 'CARD'
        }
      });
      
      const result = await paymentService.processPayment(paymentParams);
      
      // Check result
      expect(result.success).toBe(true);
      expect(result.payment.paymentType).toBe('tattoo_deposit');
      expect(result.payment.amount).toBe(100.0);
    });
    
    it('should handle Square API errors gracefully', async () => {
      // Setup Square client to throw an error
      mockSquareClient.createPayment.mockRejectedValueOnce(new Error('Square API error'));
      
      const paymentParams = {
        sourceId: 'source_123',
        amount: 50.0,
        customerId: 'customer123',
        paymentType: PaymentType.CONSULTATION,
        note: 'Test consultation payment'
      };
      
      // Should throw the error
      await expect(paymentService.processPayment(paymentParams)).rejects.toThrow('Square API error');
      
      // Check audit log for failure was created
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'payment_failed',
          resourceType: 'payment',
          details: expect.objectContaining({
            paymentType: PaymentType.CONSULTATION,
            amount: 50.0,
            customerId: 'customer123',
            error: 'Square API error'
          })
        }
      });
    });
    
    it('should generate a referenceId if bookingId is not provided', async () => {
      const paymentParams = {
        sourceId: 'source_123',
        amount: 50.0,
        customerId: 'customer123',
        paymentType: PaymentType.CONSULTATION,
        note: 'Test consultation payment without booking'
      };
      
      await paymentService.processPayment(paymentParams);
      
      // Check that uuid was used for referenceId
      expect(mockSquareClient.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceId: 'mocked-uuid-123'
        })
      );
    });
  });
}); 
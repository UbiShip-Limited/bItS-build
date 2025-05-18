// Mock the uuid generation for consistent test results
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid-123')
}));

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { mockPrismaClient, mockSquareClient } from '../../../jest.setup.mjs';
import { v4 as uuidv4 } from 'uuid';
import PaymentService, { PaymentType } from '../../services/paymentService.js';

describe('PaymentService', () => {
  let paymentService: PaymentService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock the customer lookup to return a customer with the EXACT pattern used in the service
    (mockPrismaClient.customer.findUnique as jest.Mock).mockImplementation((args: any) => {
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
    
    // Setup mock for error testing
    mockSquareClient.createPayment.mockImplementation((params: any) => {
      return Promise.resolve({
        result: {
          payment: {
            id: 'sq_payment_123',
            amount_money: { amount: 5000, currency: 'CAD' },
            status: 'COMPLETED',
            source_type: 'CARD'
          }
        }
      });
    });
    
    // Setup mock Prisma responses
    (mockPrismaClient.payment.create as jest.Mock).mockImplementation((args: { data: any }) => {
      return Promise.resolve({
        id: 'payment123',
        amount: args.data.amount,
        status: 'completed',
        paymentMethod: args.data.paymentMethod,
        paymentType: args.data.paymentType,
        squareId: args.data.squareId,
        customerId: args.data.customerId,
        bookingId: args.data.bookingId,
        referenceId: args.data.referenceId,
        paymentDetails: args.data.paymentDetails
      });
    });
    
    (mockPrismaClient.auditLog.create as jest.Mock).mockImplementation((args: { data: any }) => {
      return Promise.resolve({
        id: 'audit123',
        ...args.data
      });
    });
    
    // Initialize PaymentService with mock
    paymentService = new PaymentService(mockPrismaClient as any, mockSquareClient);
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
      expect(mockSquareClient.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceId: 'source_123',
          amount: 50.0,
          currency: 'CAD',
          customerId: 'square-customer-123',
          note: 'Test consultation payment',
          referenceId: 'booking123'
        })
      );
      
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
          resource: 'payment',
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
      (mockPrismaClient.payment.create as jest.Mock).mockImplementationOnce((args: { data: any }) => {
        return Promise.resolve({
          id: 'payment123',
          amount: args.data.amount,
          status: 'completed',
          paymentMethod: args.data.paymentMethod,
          paymentType: args.data.paymentType,
          squareId: args.data.squareId,
          customerId: args.data.customerId,
          bookingId: args.data.bookingId,
          referenceId: args.data.referenceId,
          paymentDetails: args.data.paymentDetails
        });
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
      (mockPrismaClient.payment.create as jest.Mock).mockImplementationOnce((args: { data: any }) => {
        return Promise.resolve({
          id: 'payment123',
          amount: args.data.amount,
          status: 'completed',
          paymentMethod: args.data.paymentMethod,
          paymentType: args.data.paymentType,
          squareId: args.data.squareId,
          customerId: args.data.customerId,
          bookingId: args.data.bookingId,
          referenceId: args.data.referenceId,
          paymentDetails: args.data.paymentDetails
        });
      });
      
      const result = await paymentService.processPayment(paymentParams);
      
      // Check result
      expect(result.success).toBe(true);
      expect(result.payment.paymentType).toBe('tattoo_deposit');
      expect(result.payment.amount).toBe(100.0);
    });
    
    it('should handle Square API errors gracefully', async () => {
      // Setup Square client to throw an error
      mockSquareClient.createPayment.mockImplementationOnce(() => {
        return Promise.reject(new Error('Square API error'));
      });
      
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
          resource: 'payment',
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
      
      // Check that uuid was used for referenceId - no exact match needed
      expect(mockSquareClient.createPayment).toHaveBeenCalled();
      
      // Check that prisma.payment.create was called with a referenceId
      expect(mockPrismaClient.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referenceId: expect.any(String)
          })
        })
      );
    });
  });

  describe('refundPayment', () => {
    beforeEach(() => {
      // Setup mock for payment.findUnique
      (mockPrismaClient.payment.findUnique as jest.Mock).mockImplementation(() => {
        return Promise.resolve({
          id: 'payment123',
          amount: 50.0,
          status: 'completed',
          squareId: 'sq_payment_123',
          customerId: 'customer123'
        });
      });

      // Setup mock for payment.update
      (mockPrismaClient.payment.update as jest.Mock).mockImplementation((args: { data: any }) => {
        return Promise.resolve({
          id: 'payment123',
          amount: 50.0,
          status: args.data.status || 'refunded',
          squareId: 'sq_payment_123',
          customerId: 'customer123',
          refundDetails: args.data.refundDetails || {
            id: 'ref_123',
            status: 'COMPLETED'
          }
        });
      });
    });

    it('should process a full refund successfully', async () => {
      const result = await paymentService.refundPayment('payment123', undefined, 'Customer requested refund');
      
      // Check result
      expect(result.success).toBe(true);
      expect(result.payment.status).toBe('refunded');
      expect(result.refund.id).toBe('ref_123');
      
      // Check Square client was called correctly without amount (full refund)
      expect(mockSquareClient.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: 'sq_payment_123',
          reason: 'Customer requested refund'
        })
      );
      
      // Check payment was updated correctly
      expect(mockPrismaClient.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment123' },
        data: {
          status: 'refunded',
          refundDetails: expect.any(Object)
        }
      });
      
      // Check audit log was created
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'payment_refunded',
          resource: 'payment',
          resourceId: 'payment123',
          details: expect.objectContaining({
            paymentId: 'payment123',
            amount: 50.0,
            reason: 'Customer requested refund'
          })
        }
      });
    });

    it('should process a partial refund successfully', async () => {
      // Setup partial refund mock responses
      (mockPrismaClient.payment.update as jest.Mock).mockImplementationOnce((args: { data: any }) => {
        return Promise.resolve({
          id: 'payment123',
          amount: 50.0,
          status: 'partially_refunded',
          squareId: 'sq_payment_123',
          customerId: 'customer123',
          refundDetails: args.data.refundDetails || {
            id: 'ref_123',
            status: 'COMPLETED'
          }
        });
      });

      const partialAmount = 25.0;
      const result = await paymentService.refundPayment('payment123', partialAmount, 'Partial refund requested');
      
      // Check result
      expect(result.success).toBe(true);
      expect(result.payment.status).toBe('partially_refunded');
      
      // Check Square client was called with correct partial amount
      expect(mockSquareClient.createRefund).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentId: 'sq_payment_123',
          amountMoney: {
            amount: partialAmount,
            currency: 'CAD'
          },
          reason: 'Partial refund requested'
        })
      );
      
      // Check payment was updated with partially_refunded status
      expect(mockPrismaClient.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment123' },
        data: {
          status: 'partially_refunded',
          refundDetails: expect.any(Object)
        }
      });
    });

    it('should handle errors when payment is not found', async () => {
      // Setup mock to return null payment
      (mockPrismaClient.payment.findUnique as jest.Mock).mockImplementationOnce(() => {
        return Promise.resolve(null);
      });
      
      await expect(paymentService.refundPayment('nonexistent123')).rejects.toThrow(
        'Payment not found or missing Square ID: nonexistent123'
      );
      
      // Check audit log for failure was created
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'refund_failed',
          resource: 'payment',
          resourceId: 'nonexistent123',
          details: expect.objectContaining({
            paymentId: 'nonexistent123',
            errorCode: 'REFUND_FAILED'
          })
        }
      });
    });

    it('should handle Square API errors during refund', async () => {
      // Setup Square client to throw a detailed error
      const squareError = {
        message: 'Failed to process refund',
        errors: [{
          category: 'PAYMENT_METHOD_ERROR',
          code: 'PAYMENT_NOT_REFUNDABLE',
          detail: 'The payment cannot be refunded'
        }]
      };
      mockSquareClient.createRefund.mockImplementationOnce(() => {
        return Promise.reject(squareError);
      });
      
      await expect(paymentService.refundPayment('payment123')).rejects.toEqual(squareError);
      
      // Check audit log for failure with specific error code
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'refund_failed',
          resource: 'payment',
          resourceId: 'payment123',
          details: expect.objectContaining({
            paymentId: 'payment123',
            errorCode: 'PAYMENT_NOT_REFUNDABLE',
            error: 'The payment cannot be refunded'
          })
        }
      });
    });
  });
}); 
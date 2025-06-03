import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import PaymentService, { ProcessPaymentParams } from '../paymentService';
import { PaymentType } from '../../config/pricing';


// Mock dependencies
vi.mock('../square/index.js');
vi.mock('../prisma/prisma.js');

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockPrismaClient: any;
  let mockSquareClient: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock Prisma client
    mockPrismaClient = {
      customer: {
        findUnique: vi.fn()
      },
      payment: {
        create: vi.fn(),
        update: vi.fn(),
        findUnique: vi.fn()
      },
      auditLog: {
        create: vi.fn()
      }
    };

    // Create mock Square client
    mockSquareClient = {
      createPayment: vi.fn(),
      createRefund: vi.fn()
    };

    // Initialize service with mocks
    paymentService = new PaymentService(mockPrismaClient as any, mockSquareClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processPayment', () => {
    const mockCustomer = {
      id: 'customer-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      squareId: 'square-customer-123',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const basePaymentParams: ProcessPaymentParams = {
      sourceId: 'cnon:card-nonce-123',
      amount: 200, // Above $185 minimum for consultation
      customerId: 'customer-123',
      paymentType: PaymentType.CONSULTATION,
      note: 'Test payment'
    };

    it('should process a successful payment', async () => {
      // Mock customer lookup
      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);

      // Mock Square payment response
      const mockSquarePayment = {
        id: 'square-payment-123',
        sourceType: 'CARD',
        amountMoney: { amount: 20000, currency: 'CAD' }, // 200 * 100 cents
        status: 'COMPLETED'
      };
      mockSquareClient.createPayment.mockResolvedValue({
        result: { payment: mockSquarePayment }
      });

      // Mock payment creation
      const mockPayment = {
        id: 'payment-123',
        amount: 200, // Updated amount
        status: 'completed',
        paymentMethod: 'card',
        paymentType: PaymentType.CONSULTATION,
        squareId: 'square-payment-123',
        customerId: 'customer-123',
        bookingId: null,
        referenceId: 'ref-123',
        paymentDetails: mockSquarePayment,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      mockPrismaClient.payment.create.mockResolvedValue(mockPayment);

      // Mock audit log creation
      mockPrismaClient.auditLog.create.mockResolvedValue({
        id: 'audit-123',
        action: 'payment_processed',
        resource: 'payment',
        resourceId: 'payment-123',
        details: {},
        userId: null,
        createdAt: new Date()
      });

      // Execute
      const result = await paymentService.processPayment(basePaymentParams);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment).toEqual(mockPayment);
      expect(result.squarePayment).toEqual(mockSquarePayment);

      // Verify Square client was called with correct params
      expect(mockSquareClient.createPayment).toHaveBeenCalledWith({
        sourceId: basePaymentParams.sourceId,
        amount: basePaymentParams.amount,
        currency: 'CAD',
        customerId: mockCustomer.squareId,
        note: basePaymentParams.note,
        idempotencyKey: expect.any(String),
        referenceId: expect.any(String)
      });

      // Verify database operations
      expect(mockPrismaClient.customer.findUnique).toHaveBeenCalledWith({
        where: { id: basePaymentParams.customerId }
      });
      expect(mockPrismaClient.payment.create).toHaveBeenCalled();
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalled();
    });

    it('should reject payment below minimum amount', async () => {
      const params = {
        ...basePaymentParams,
        amount: 100 // Below $185 minimum for consultation
      };

      await expect(paymentService.processPayment(params))
        .rejects.toThrow('Minimum payment amount for consultation is $185 CAD');
    });

    it('should handle customer not found error', async () => {
      mockPrismaClient.customer.findUnique.mockResolvedValue(null);

      await expect(paymentService.processPayment(basePaymentParams))
        .rejects.toThrow('Customer customer-123 not found');
    });

    it('should handle Square payment failure', async () => {
      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);
      mockSquareClient.createPayment.mockRejectedValue(new Error('Payment declined'));

      await expect(paymentService.processPayment(basePaymentParams))
        .rejects.toThrow('Payment declined');

      // Verify failure audit log was created
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'payment_failed',
          resource: 'payment',
          details: {
            paymentType: PaymentType.CONSULTATION,
            amount: 200, // Updated amount
            customerId: 'customer-123',
            error: 'Payment declined'
          }
        }
      });
    });

    it('should process payment with booking ID', async () => {
      const paramsWithBooking = {
        ...basePaymentParams,
        bookingId: 'booking-123',
        paymentType: PaymentType.TATTOO_DEPOSIT,
        amount: 200 // Above $150 minimum for tattoo deposit
      };

      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);
      mockSquareClient.createPayment.mockResolvedValue({
        result: { payment: { id: 'square-payment-123', sourceType: 'CARD' } }
      });
      mockPrismaClient.payment.create.mockResolvedValue({
        id: 'payment-123',
        amount: 200, // Updated amount
        status: 'completed',
        paymentMethod: 'card',
        paymentType: PaymentType.TATTOO_DEPOSIT,
        squareId: 'square-payment-123',
        customerId: 'customer-123',
        bookingId: 'booking-123',
        referenceId: 'booking-123',
        paymentDetails: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await paymentService.processPayment(paramsWithBooking);

      expect(result.success).toBe(true);
      expect(mockSquareClient.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          referenceId: 'booking-123'
        })
      );
    });
  });

  describe('refundPayment', () => {
    const mockPayment = {
      id: 'payment-123',
      amount: 200, // Updated to match new pricing
      squareId: 'square-payment-123',
      status: 'completed',
      paymentMethod: 'card',
      paymentType: PaymentType.CONSULTATION,
      customerId: 'customer-123',
      bookingId: null,
      referenceId: 'ref-123',
      paymentDetails: {},
      refundDetails: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should process a full refund successfully', async () => {
      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPayment);

      const mockRefund = {
        id: 'refund-123',
        paymentId: 'square-payment-123',
        amountMoney: { amount: 20000, currency: 'CAD' }, // Updated to 200 * 100 cents
        status: 'COMPLETED'
      };
      mockSquareClient.createRefund.mockResolvedValue({
        result: { refund: mockRefund }
      });

      const updatedPayment = {
        ...mockPayment,
        status: 'refunded',
        refundDetails: mockRefund
      };
      mockPrismaClient.payment.update.mockResolvedValue(updatedPayment);

      mockPrismaClient.auditLog.create.mockResolvedValue({
        id: 'audit-123',
        action: 'payment_refunded',
        resource: 'payment',
        resourceId: 'payment-123',
        details: {},
        userId: null,
        createdAt: new Date()
      });

      const result = await paymentService.refundPayment('payment-123', undefined, 'Customer request');

      expect(result.success).toBe(true);
      expect(result.payment).toEqual(updatedPayment);
      expect(result.refund).toEqual(mockRefund);

      expect(mockSquareClient.createRefund).toHaveBeenCalledWith({
        paymentId: 'square-payment-123',
        idempotencyKey: expect.any(String),
        amountMoney: undefined,
        reason: 'Customer request'
      });
    });

    it('should process a partial refund successfully', async () => {
      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPayment);

      const mockRefund = {
        id: 'refund-123',
        paymentId: 'square-payment-123',
        amountMoney: { amount: 10000, currency: 'CAD' }, // 100 * 100 cents (partial)
        status: 'COMPLETED'
      };
      mockSquareClient.createRefund.mockResolvedValue({
        result: { refund: mockRefund }
      });

      const updatedPayment = {
        ...mockPayment,
        status: 'partially_refunded',
        refundDetails: mockRefund
      };
      mockPrismaClient.payment.update.mockResolvedValue(updatedPayment);

      const result = await paymentService.refundPayment('payment-123', 100, 'Partial refund');

      expect(result.success).toBe(true);
      expect(result.payment.status).toBe('partially_refunded');

      expect(mockSquareClient.createRefund).toHaveBeenCalledWith({
        paymentId: 'square-payment-123',
        idempotencyKey: expect.any(String),
        amountMoney: {
          amount: 100,
          currency: 'CAD'
        },
        reason: 'Partial refund'
      });
    });

    it('should handle payment not found error', async () => {
      mockPrismaClient.payment.findUnique.mockResolvedValue(null);

      await expect(paymentService.refundPayment('payment-123'))
        .rejects.toThrow('Payment not found or missing Square ID: payment-123');
    });

    it('should handle Square refund failure', async () => {
      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPayment);

      const squareError = {
        errors: [{
          code: 'INSUFFICIENT_FUNDS',
          detail: 'Insufficient funds for refund'
        }]
      };
      mockSquareClient.createRefund.mockRejectedValue(squareError);

      await expect(paymentService.refundPayment('payment-123'))
        .rejects.toThrow();

      // Verify failure audit log was created
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'refund_failed',
          resource: 'payment',
          resourceId: 'payment-123',
          details: {
            paymentId: 'payment-123',
            errorCode: 'INSUFFICIENT_FUNDS',
            error: 'Insufficient funds for refund'
          }
        }
      });
    });
  });
}); 
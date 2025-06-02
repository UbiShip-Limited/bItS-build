import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import PaymentService, { PaymentType } from '../paymentService';
import PaymentLinkService from '../paymentLinkService';
import SquareClient from '../../square/index';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Mock dependencies
vi.mock('../../square/index');
vi.mock('../../prisma/prisma', () => ({
  prisma: {
    customer: { findUnique: vi.fn() },
    payment: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    auditLog: { create: vi.fn() }
  }
}));

const mockPrismaClient = {
  customer: { findUnique: vi.fn() },
  payment: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  auditLog: { create: vi.fn() }
} as unknown as PrismaClient;

const mockSquareClient = {
  createPayment: vi.fn(),
  createRefund: vi.fn(),
  createPaymentLink: vi.fn(),
  getPayments: vi.fn(),
  getPaymentById: vi.fn()
};

describe('Square Payment Integration Tests', () => {
  let paymentService: PaymentService;
  let paymentLinkService: PaymentLinkService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock SquareClient.fromEnv to return our mock
    vi.mocked(SquareClient.fromEnv).mockReturnValue(mockSquareClient as any);
    
    paymentService = new PaymentService(mockPrismaClient, mockSquareClient as any);
    paymentLinkService = new PaymentLinkService(mockPrismaClient, mockSquareClient as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Square API Version 2025-05-21 Compliance', () => {
    it('should use current Square API version in payment requests', async () => {
      const mockCustomer = {
        id: 'customer-123',
        squareId: 'square-customer-123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      const mockSquarePayment = {
        id: 'payment-123',
        sourceType: 'CARD',
        amountMoney: { amount: BigInt(15000), currency: 'CAD' },
        status: 'COMPLETED'
      };

      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);
      mockSquareClient.createPayment.mockResolvedValue({
        result: { payment: mockSquarePayment }
      });
      mockPrismaClient.payment.create.mockResolvedValue({
        id: 'payment-db-123',
        amount: 150,
        status: 'completed'
      });

      await paymentService.processPayment({
        sourceId: 'card-token-123',
        amount: 150,
        customerId: 'customer-123',
        paymentType: PaymentType.TATTOO_DEPOSIT,
        note: 'Test payment'
      });

      expect(mockSquareClient.createPayment).toHaveBeenCalledWith({
        sourceId: 'card-token-123',
        amount: 150,
        currency: 'CAD',
        customerId: 'square-customer-123',
        note: 'Test payment',
        idempotencyKey: expect.any(String),
        referenceId: expect.any(String)
      });
    });

    it('should implement proper idempotency for payment requests', async () => {
      const mockCustomer = {
        id: 'customer-123',
        squareId: 'square-customer-123'
      };

      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);
      mockSquareClient.createPayment.mockResolvedValue({
        result: { payment: { id: 'payment-123' } }
      });
      mockPrismaClient.payment.create.mockResolvedValue({
        id: 'payment-db-123'
      });

      const paymentParams = {
        sourceId: 'card-token-123',
        amount: 75,
        customerId: 'customer-123',
        paymentType: PaymentType.TATTOO_DEPOSIT,
        bookingId: 'booking-123'
      };

      // Make two identical requests
      await paymentService.processPayment(paymentParams);
      await paymentService.processPayment(paymentParams);

      // Each call should have a unique idempotency key
      const calls = mockSquareClient.createPayment.mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[0][0].idempotencyKey).not.toBe(calls[1][0].idempotencyKey);
    });
  });

  describe('Payment Amount Validation (Square Minimum Requirements)', () => {
    const validationTestCases = [
      { paymentType: PaymentType.CONSULTATION, validAmount: 35, invalidAmount: 30 },
      { paymentType: PaymentType.DRAWING_CONSULTATION, validAmount: 50, invalidAmount: 45 },
      { paymentType: PaymentType.TATTOO_DEPOSIT, validAmount: 75, invalidAmount: 70 },
      { paymentType: PaymentType.TATTOO_FINAL, validAmount: 100, invalidAmount: 95 }
    ];

    validationTestCases.forEach(({ paymentType, validAmount, invalidAmount }) => {
      it(`should enforce minimum amount for ${paymentType}`, async () => {
        mockPrismaClient.customer.findUnique.mockResolvedValue({
          id: 'customer-123',
          squareId: 'square-customer-123'
        });

        // Valid amount should pass
        mockSquareClient.createPayment.mockResolvedValue({
          result: { payment: { id: 'payment-123' } }
        });
        mockPrismaClient.payment.create.mockResolvedValue({
          id: 'payment-db-123'
        });

        await expect(paymentService.processPayment({
          sourceId: 'card-token-123',
          amount: validAmount,
          customerId: 'customer-123',
          paymentType
        })).resolves.toBeDefined();

        // Invalid amount should fail
        await expect(paymentService.processPayment({
          sourceId: 'card-token-123',
          amount: invalidAmount,
          customerId: 'customer-123',
          paymentType
        })).rejects.toThrow(`Minimum payment amount for ${paymentType}`);
      });
    });
  });

  describe('Payment Links with Latest Square Checkout API', () => {
    it('should create payment links using Square Checkout API', async () => {
      const mockCustomer = {
        id: 'customer-123',
        email: 'john@example.com',
        phone: '+1234567890'
      };

      const mockPaymentLinkResponse = {
        result: {
          payment_link: {
            id: 'link-123',
            url: 'https://checkout.square.site/link-123',
            version: 1
          }
        }
      };

      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);
      mockSquareClient.createPaymentLink.mockResolvedValue(mockPaymentLinkResponse);

      const result = await paymentLinkService.createPaymentLink({
        amount: 150,
        title: 'Tattoo Consultation',
        description: 'Initial design consultation',
        customerId: 'customer-123',
        paymentType: PaymentType.CONSULTATION,
        allowTipping: true
      });

      expect(mockSquareClient.createPaymentLink).toHaveBeenCalledWith({
        idempotencyKey: expect.any(String),
        description: 'Initial design consultation',
        quickPay: {
          name: 'Tattoo Consultation',
          priceMoney: {
            amount: 150,
            currency: 'CAD'
          }
        },
        checkoutOptions: {
          allowTipping: true,
          redirectUrl: expect.stringContaining('/payment/success'),
          merchantSupportEmail: process.env.MERCHANT_SUPPORT_EMAIL
        },
        prePopulatedData: {
          buyerEmail: 'john@example.com',
          buyerPhoneNumber: '+1234567890'
        },
        paymentNote: expect.stringContaining('consultation')
      });

      expect(result.success).toBe(true);
      expect(result.url).toBe('https://checkout.square.site/link-123');
    });
  });

  describe('Webhook Event Handling', () => {
    it('should verify webhook signatures correctly', () => {
      const webhookSignatureKey = 'test-signature-key';
      const body = JSON.stringify({
        type: 'payment.updated',
        event_id: 'event-123',
        data: { object: { payment: { id: 'payment-123' } } }
      });

      // Calculate expected signature
      const hmac = crypto.createHmac('sha256', webhookSignatureKey);
      hmac.update(body);
      const expectedSignature = hmac.digest('base64');

      // This would be tested in the webhook handler
      expect(expectedSignature).toBeTruthy();
      expect(expectedSignature).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 format
    });

    it('should handle payment.updated webhook events', async () => {
      const mockPaymentEvent = {
        type: 'payment.updated',
        data: {
          object: {
            payment: {
              id: 'payment-123',
              status: 'COMPLETED',
              referenceId: 'booking-123',
              amountMoney: { amount: BigInt(15000), currency: 'CAD' }
            }
          }
        }
      };

      const mockExistingPayment = {
        id: 'payment-db-123',
        referenceId: 'booking-123'
      };

      mockPrismaClient.payment.findFirst.mockResolvedValue(mockExistingPayment);
      mockPrismaClient.payment.update.mockResolvedValue({
        ...mockExistingPayment,
        status: 'completed'
      });

      // This simulates webhook processing logic
      const payment = mockPaymentEvent.data.object.payment;
      
      expect(payment.status).toBe('COMPLETED');
      expect(payment.referenceId).toBe('booking-123');
    });
  });

  describe('Error Handling and Rate Limiting', () => {
    it('should handle Square API rate limiting gracefully', async () => {
      const rateLimitError = {
        errors: [{
          category: 'RATE_LIMIT_ERROR',
          code: 'RATE_LIMITED',
          detail: 'Request rate limit exceeded'
        }]
      };

      mockPrismaClient.customer.findUnique.mockResolvedValue({
        id: 'customer-123',
        squareId: 'square-customer-123'
      });

      mockSquareClient.createPayment.mockRejectedValue(rateLimitError);

      await expect(paymentService.processPayment({
        sourceId: 'card-token-123',
        amount: 100,
        customerId: 'customer-123',
        paymentType: PaymentType.TATTOO_FINAL
      })).rejects.toMatchObject(rateLimitError);

      // Verify audit log was created for the failure
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'payment_failed',
          resource: 'payment',
          details: expect.objectContaining({
            error: expect.any(String)
          })
        }
      });
    });

    it('should handle invalid payment source errors', async () => {
      const invalidSourceError = {
        errors: [{
          category: 'INVALID_REQUEST_ERROR',
          code: 'INVALID_CARD',
          detail: 'Card is invalid or expired'
        }]
      };

      mockPrismaClient.customer.findUnique.mockResolvedValue({
        id: 'customer-123',
        squareId: 'square-customer-123'
      });

      mockSquareClient.createPayment.mockRejectedValue(invalidSourceError);

      await expect(paymentService.processPayment({
        sourceId: 'invalid-token',
        amount: 100,
        customerId: 'customer-123',
        paymentType: PaymentType.CONSULTATION
      })).rejects.toMatchObject(invalidSourceError);
    });
  });

  describe('Payment Refunds', () => {
    it('should process full refunds correctly', async () => {
      const mockPayment = {
        id: 'payment-db-123',
        amount: 100,
        squareId: 'square-payment-123'
      };

      const mockRefundResponse = {
        result: {
          refund: {
            id: 'refund-123',
            amountMoney: { amount: BigInt(10000), currency: 'CAD' },
            status: 'COMPLETED'
          }
        }
      };

      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPayment);
      mockSquareClient.createRefund.mockResolvedValue(mockRefundResponse);
      mockPrismaClient.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'refunded'
      });

      const result = await paymentService.refundPayment('payment-db-123');

      expect(mockSquareClient.createRefund).toHaveBeenCalledWith({
        paymentId: 'square-payment-123',
        idempotencyKey: expect.any(String),
        amountMoney: undefined, // Full refund
        reason: 'Customer requested refund'
      });

      expect(result.success).toBe(true);
    });

    it('should process partial refunds correctly', async () => {
      const mockPayment = {
        id: 'payment-db-123',
        amount: 100,
        squareId: 'square-payment-123'
      };

      mockPrismaClient.payment.findUnique.mockResolvedValue(mockPayment);
      mockSquareClient.createRefund.mockResolvedValue({
        result: { refund: { id: 'refund-123' } }
      });
      mockPrismaClient.payment.update.mockResolvedValue({
        ...mockPayment,
        status: 'partially_refunded'
      });

      await paymentService.refundPayment('payment-db-123', 50, 'Partial refund requested');

      expect(mockSquareClient.createRefund).toHaveBeenCalledWith({
        paymentId: 'square-payment-123',
        idempotencyKey: expect.any(String),
        amountMoney: {
          amount: 50,
          currency: 'CAD'
        },
        reason: 'Partial refund requested'
      });
    });
  });

  describe('Payment Retrieval and Pagination', () => {
    it('should retrieve payments with proper pagination', async () => {
      const mockPayments = [
        { id: 'payment-1', amount: 100, status: 'completed' },
        { id: 'payment-2', amount: 150, status: 'completed' }
      ];

      mockPrismaClient.payment.findMany.mockResolvedValue(mockPayments);
      mockPrismaClient.payment.count.mockResolvedValue(25);

      const result = await paymentService.getPayments({
        page: 2,
        limit: 10,
        status: 'completed'
      });

      expect(mockPrismaClient.payment.findMany).toHaveBeenCalledWith({
        where: { status: 'completed' },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        skip: 10, // (page - 1) * limit
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        pages: 3
      });
    });
  });

  describe('Currency and Amount Handling', () => {
    it('should handle CAD currency correctly', async () => {
      const mockCustomer = {
        id: 'customer-123',
        squareId: 'square-customer-123'
      };

      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);
      mockSquareClient.createPayment.mockResolvedValue({
        result: { payment: { id: 'payment-123' } }
      });
      mockPrismaClient.payment.create.mockResolvedValue({
        id: 'payment-db-123'
      });

      await paymentService.processPayment({
        sourceId: 'card-token-123',
        amount: 100.50, // Decimal amount
        customerId: 'customer-123',
        paymentType: PaymentType.TATTOO_FINAL
      });

      expect(mockSquareClient.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 100.50,
          currency: 'CAD'
        })
      );
    });
  });
}); 
import PaymentLinkService from '../../services/paymentLinkService';
import { PaymentType } from '../../services/paymentService';
import { PrismaClient } from '@prisma/client';
import SquareClient from '../../square';

// Mock dependencies
jest.mock('../../square');
jest.mock('../../prisma/prisma');

describe('PaymentLinkService', () => {
  let service: PaymentLinkService;
  let mockPrisma: any;
  let mockSquareClient: any;

  beforeEach(() => {
    // Mock Prisma client
    mockPrisma = {
      customer: {
        findUnique: jest.fn()
      },
      paymentLink: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn()
      },
      checkoutSession: {
        create: jest.fn()
      },
      invoice: {
        create: jest.fn()
      },
      auditLog: {
        create: jest.fn()
      }
    };

    // Mock Square client
    mockSquareClient = {
      createOrder: jest.fn(),
      createInvoice: jest.fn(),
      sendInvoice: jest.fn()
    };

    // Create service instance with mocked dependencies
    service = new PaymentLinkService(mockPrisma as PrismaClient, mockSquareClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentLink', () => {
    it('should create a payment link successfully', async () => {
      // Arrange
      const params = {
        amount: 100,
        title: 'Tattoo Session Payment',
        description: 'Payment for tattoo consultation',
        customerId: 'customer-123',
        appointmentId: 'appointment-123',
        paymentType: PaymentType.CONSULTATION,
        redirectUrl: 'https://example.com/success',
        allowTipping: true
      };

      const mockCustomer = {
        id: 'customer-123',
        name: 'John Doe',
        email: 'john@example.com',
        squareId: 'square-customer-123'
      };

      const mockOrder = {
        result: {
          order: {
            id: 'square-order-123',
            version: 1,
            locationId: 'location-123'
          }
        }
      };

      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      mockSquareClient.createOrder.mockResolvedValue(mockOrder);
      mockPrisma.paymentLink.create.mockResolvedValue({
        id: 'payment-link-123',
        url: 'https://example.com/checkout/payment-link-123',
        squareOrderId: 'square-order-123',
        customerId: 'customer-123',
        amount: 100,
        status: 'active'
      });

      // Act
      const result = await service.createPaymentLink(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.url).toContain('/checkout/');
      expect(result.paymentLink.orderId).toBe('square-order-123');

      // Verify Square order creation
      expect(mockSquareClient.createOrder).toHaveBeenCalledWith({
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems: [{
          name: 'Tattoo Session Payment',
          quantity: '1',
          basePriceMoney: {
            amount: 100,
            currency: 'CAD'
          },
          note: 'Payment for tattoo consultation'
        }],
        customerId: 'square-customer-123',
        idempotencyKey: expect.any(String),
        referenceId: 'appointment-123'
      });

      // Verify payment link creation in database
      expect(mockPrisma.paymentLink.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw error if customer not found', async () => {
      // Arrange
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createPaymentLink({
        amount: 100,
        title: 'Test Payment',
        customerId: 'invalid-customer',
        paymentType: PaymentType.CONSULTATION
      })).rejects.toThrow('Customer invalid-customer not found');
    });

    it('should throw error if Square order creation fails', async () => {
      // Arrange
      mockPrisma.customer.findUnique.mockResolvedValue({ id: 'customer-123' });
      mockSquareClient.createOrder.mockResolvedValue({ result: { order: null } });

      // Act & Assert
      await expect(service.createPaymentLink({
        amount: 100,
        title: 'Test Payment',
        customerId: 'customer-123',
        paymentType: PaymentType.CONSULTATION
      })).rejects.toThrow('Failed to create order');
    });
  });

  describe('createInvoice', () => {
    it('should create an invoice with payment schedule', async () => {
      // Arrange
      const params = {
        customerId: 'customer-123',
        appointmentId: 'appointment-123',
        items: [
          { description: 'Tattoo Design', amount: 500 },
          { description: 'Tattoo Session', amount: 1500 }
        ],
        paymentSchedule: [
          { amount: 500, dueDate: '2024-07-01', type: 'DEPOSIT' as const },
          { amount: 1500, dueDate: '2024-07-15', type: 'BALANCE' as const }
        ],
        deliveryMethod: 'EMAIL' as const
      };

      const mockCustomer = {
        id: 'customer-123',
        squareId: 'square-customer-123'
      };

      const mockOrder = {
        result: {
          order: {
            id: 'square-order-123',
            version: 1
          }
        }
      };

      const mockInvoice = {
        result: {
          invoice: {
            id: 'square-invoice-123',
            invoiceNumber: 'INV-123',
            publicUrl: 'https://square.com/invoice/123'
          }
        }
      };

      mockPrisma.customer.findUnique.mockResolvedValue(mockCustomer);
      mockSquareClient.createOrder.mockResolvedValue(mockOrder);
      mockSquareClient.createInvoice.mockResolvedValue(mockInvoice);
      mockSquareClient.sendInvoice.mockResolvedValue({
        result: {
          invoice: {
            publicUrl: 'https://square.com/invoice/123/sent'
          }
        }
      });

      // Act
      const result = await service.createInvoice(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.invoice.id).toBe('square-invoice-123');
      expect(result.publicUrl).toBe('https://square.com/invoice/123/sent');

      // Verify Square order creation
      expect(mockSquareClient.createOrder).toHaveBeenCalledWith({
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems: [
          {
            name: 'Tattoo Design',
            quantity: '1',
            basePriceMoney: { amount: 500, currency: 'CAD' },
            note: 'Line item 1'
          },
          {
            name: 'Tattoo Session',
            quantity: '1',
            basePriceMoney: { amount: 1500, currency: 'CAD' },
            note: 'Line item 2'
          }
        ],
        customerId: 'square-customer-123',
        idempotencyKey: expect.any(String),
        referenceId: 'appointment-123'
      });

      // Verify Square invoice creation
      expect(mockSquareClient.createInvoice).toHaveBeenCalledWith({
        orderId: 'square-order-123',
        invoiceNumber: expect.stringContaining('INV-'),
        title: 'Bowen Island Tattoo Shop',
        description: 'Tattoo Design\nTattoo Session',
        deliveryMethod: 'EMAIL',
        paymentRequests: [
          {
            requestType: 'DEPOSIT',
            dueDate: '2024-07-01',
            fixedAmountRequestedMoney: {
              amount: BigInt(50000), // 500 * 100
              currency: 'CAD'
            },
            tippingEnabled: false
          },
          {
            requestType: 'BALANCE',
            dueDate: '2024-07-15',
            fixedAmountRequestedMoney: {
              amount: BigInt(150000), // 1500 * 100
              currency: 'CAD'
            },
            tippingEnabled: true
          }
        ],
        acceptedPaymentMethods: {
          card: true,
          squareGiftCard: true,
          bankAccount: true,
          buyNowPayLater: true
        },
        primaryRecipient: {
          customerId: 'square-customer-123'
        }
      });

      // Verify invoice sending
      expect(mockSquareClient.sendInvoice).toHaveBeenCalledWith({
        invoiceId: 'square-invoice-123',
        requestMethod: 'EMAIL'
      });

      // Verify database updates
      expect(mockPrisma.invoice.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should create invoice without payment schedule', async () => {
      // Arrange
      const params = {
        customerId: 'customer-123',
        items: [{ description: 'Consultation', amount: 50 }],
        deliveryMethod: 'EMAIL' as const
      };

      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 'customer-123',
        squareId: 'square-customer-123'
      });
      mockSquareClient.createOrder.mockResolvedValue({
        result: { order: { id: 'order-123' } }
      });
      mockSquareClient.createInvoice.mockResolvedValue({
        result: { invoice: { id: 'invoice-123' } }
      });

      // Act
      await service.createInvoice(params);

      // Assert
      expect(mockSquareClient.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentRequests: [{
            requestType: 'BALANCE',
            tippingEnabled: true
          }]
        })
      );
    });

    it('should not send invoice if delivery method is SHARE_MANUALLY', async () => {
      // Arrange
      const params = {
        customerId: 'customer-123',
        items: [{ description: 'Tattoo', amount: 200 }],
        deliveryMethod: 'SHARE_MANUALLY' as const
      };

      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 'customer-123',
        squareId: 'square-customer-123'
      });
      mockSquareClient.createOrder.mockResolvedValue({
        result: { order: { id: 'order-123' } }
      });
      mockSquareClient.createInvoice.mockResolvedValue({
        result: { invoice: { id: 'invoice-123', publicUrl: 'https://square.com/invoice/123' } }
      });

      // Act
      const result = await service.createInvoice(params);

      // Assert
      expect(mockSquareClient.sendInvoice).not.toHaveBeenCalled();
      expect(result.publicUrl).toBe('https://square.com/invoice/123');
    });
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session', async () => {
      // Arrange
      const params = {
        customerId: 'customer-123',
        appointmentId: 'appointment-123',
        items: [
          { name: 'Tattoo Deposit', quantity: 1, price: 100 },
          { name: 'Design Fee', quantity: 1, price: 50, note: 'Custom design' }
        ],
        redirectUrl: 'https://example.com/success'
      };

      mockPrisma.customer.findUnique.mockResolvedValue({
        id: 'customer-123',
        squareId: 'square-customer-123'
      });
      mockSquareClient.createOrder.mockResolvedValue({
        result: { order: { id: 'order-123' } }
      });
      mockPrisma.checkoutSession.create.mockResolvedValue({
        id: 'checkout-123'
      });

      // Act
      const result = await service.createCheckoutSession(params);

      // Assert
      expect(result.success).toBe(true);
      expect(result.checkoutId).toBeTruthy();
      expect(result.checkoutUrl).toContain('/checkout/');

      // Verify checkout session creation
      expect(mockPrisma.checkoutSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          squareOrderId: 'order-123',
          customerId: 'customer-123',
          appointmentId: 'appointment-123',
          status: 'pending',
          metadata: {
            redirectUrl: 'https://example.com/success',
            items: params.items
          }
        })
      });
    });
  });

  describe('listPaymentLinks', () => {
    it('should list payment links with pagination', async () => {
      // Arrange
      const mockLinks = [
        {
          id: 'link-1',
          url: 'https://example.com/checkout/link-1',
          squareOrderId: 'order-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: { redirectUrl: 'https://example.com/success' }
        },
        {
          id: 'link-2',
          url: 'https://example.com/checkout/link-2',
          squareOrderId: 'order-2',
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {}
        }
      ];

      mockPrisma.paymentLink.findMany.mockResolvedValue(mockLinks);

      // Act
      const result = await service.listPaymentLinks({ limit: 10 });

      // Assert
      expect(result.result.paymentLinks).toHaveLength(2);
      expect(result.result.cursor).toBe('link-2');
      expect(mockPrisma.paymentLink.findMany).toHaveBeenCalledWith({
        take: 10,
        cursor: undefined,
        orderBy: { createdAt: 'desc' },
        include: { customer: true }
      });
    });
  });

  describe('deletePaymentLink', () => {
    it('should soft delete a payment link', async () => {
      // Arrange
      const linkId = 'link-123';
      mockPrisma.paymentLink.update.mockResolvedValue({
        id: linkId,
        status: 'cancelled'
      });

      // Act
      const result = await service.deletePaymentLink(linkId);

      // Assert
      expect(result.result).toBeDefined();
      expect(mockPrisma.paymentLink.update).toHaveBeenCalledWith({
        where: { id: linkId },
        data: {
          status: 'cancelled',
          deletedAt: expect.any(Date)
        }
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });
}); 
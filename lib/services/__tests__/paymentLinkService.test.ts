import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import PaymentLinkService, { PaymentLinkParams, InvoiceParams } from '../paymentLinkService';
import { PaymentType } from '../paymentService';

// Mock dependencies
vi.mock('../square/index.js');
vi.mock('../prisma/prisma.js');

describe('PaymentLinkService', () => {
  let paymentLinkService: PaymentLinkService;
  let mockPrismaClient: any;
  let mockSquareClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock Prisma client
    mockPrismaClient = {
      customer: {
        findUnique: vi.fn()
      },
      paymentLink: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn()
      },
      invoice: {
        create: vi.fn()
      },
      checkoutSession: {
        create: vi.fn()
      },
      auditLog: {
        create: vi.fn()
      }
    };

    // Create mock Square client
    mockSquareClient = {
      createPaymentLink: vi.fn(),
      createOrder: vi.fn(),
      createInvoice: vi.fn(),
      sendInvoice: vi.fn()
    };

    // Initialize service with mocks
    paymentLinkService = new PaymentLinkService(mockPrismaClient as any, mockSquareClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createPaymentLink', () => {
    const mockCustomer = {
      id: 'customer-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      squareId: 'square-customer-123',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const baseLinkParams: PaymentLinkParams = {
      amount: 100,
      title: 'Consultation Payment',
      description: 'Payment for tattoo consultation',
      customerId: 'customer-123',
      paymentType: PaymentType.CONSULTATION,
      allowTipping: true
    };

    it('should create a payment link successfully', async () => {
      // Mock customer lookup
      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);

      // Mock Square payment link response
      const mockSquarePaymentLink = {
        id: 'link-123',
        order_id: 'order-123',
        url: 'https://checkout.square.site/link-123',
        created_at: new Date().toISOString(),
        version: 1
      };
      mockSquareClient.createPaymentLink.mockResolvedValue({
        result: { payment_link: mockSquarePaymentLink }
      });

      // Mock database operations
      mockPrismaClient.paymentLink.create.mockResolvedValue({
        id: 'link-123',
        squareOrderId: 'order-123',
        customerId: 'customer-123',
        amount: 100,
        status: 'active',
        url: mockSquarePaymentLink.url,
        metadata: {},
        createdAt: new Date()
      });

      mockPrismaClient.auditLog.create.mockResolvedValue({
        id: 'audit-123',
        action: 'payment_link_created',
        resource: 'payment_link',
        resourceId: 'link-123',
        details: {},
        userId: null,
        createdAt: new Date()
      });

      // Execute
      const result = await paymentLinkService.createPaymentLink(baseLinkParams);

      // Assert
      expect(result.success).toBe(true);
      expect(result.url).toBe(mockSquarePaymentLink.url);
      expect(result.paymentLink).toEqual(mockSquarePaymentLink);

      // Verify Square client was called correctly
      expect(mockSquareClient.createPaymentLink).toHaveBeenCalledWith({
        idempotencyKey: expect.any(String),
        description: baseLinkParams.description,
        quickPay: {
          name: baseLinkParams.title,
          priceMoney: {
            amount: baseLinkParams.amount,
            currency: 'CAD'
          }
        },
        checkoutOptions: {
          allowTipping: true,
          redirectUrl: expect.stringContaining('/payment/success'),
          merchantSupportEmail: process.env.MERCHANT_SUPPORT_EMAIL
        },
        prePopulatedData: {
          buyerEmail: mockCustomer.email,
          buyerPhoneNumber: mockCustomer.phone
        },
        paymentNote: expect.stringContaining(PaymentType.CONSULTATION)
      });
    });

    it('should handle customer not found error', async () => {
      mockPrismaClient.customer.findUnique.mockResolvedValue(null);

      await expect(paymentLinkService.createPaymentLink(baseLinkParams))
        .rejects.toThrow('Customer customer-123 not found');
    });

    it('should create payment link with appointment ID', async () => {
      const paramsWithAppointment = {
        ...baseLinkParams,
        appointmentId: 'appointment-123',
        redirectUrl: 'https://example.com/success'
      };

      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);
      mockSquareClient.createPaymentLink.mockResolvedValue({
        result: {
          payment_link: {
            id: 'link-123',
            order_id: 'order-123',
            url: 'https://checkout.square.site/link-123'
          }
        }
      });
      mockPrismaClient.paymentLink.create.mockResolvedValue({});
      mockPrismaClient.auditLog.create.mockResolvedValue({});

      await paymentLinkService.createPaymentLink(paramsWithAppointment);

      expect(mockSquareClient.createPaymentLink).toHaveBeenCalledWith(
        expect.objectContaining({
          checkoutOptions: expect.objectContaining({
            redirectUrl: paramsWithAppointment.redirectUrl
          }),
          paymentNote: expect.stringContaining('appointment-123')
        })
      );
    });

    it('should handle Square API failure', async () => {
      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);
      mockSquareClient.createPaymentLink.mockRejectedValue(new Error('Square API error'));

      await expect(paymentLinkService.createPaymentLink(baseLinkParams))
        .rejects.toThrow('Square API error');

      // Verify failure audit log was created
      expect(mockPrismaClient.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: 'payment_link_failed',
          resource: 'payment_link',
          details: {
            paymentType: PaymentType.CONSULTATION,
            amount: 100,
            customerId: 'customer-123',
            error: 'Square API error'
          }
        }
      });
    });
  });

  describe('createInvoice', () => {
    const mockCustomer = {
      id: 'customer-123',
      name: 'John Doe',
      email: 'john@example.com',
      squareId: 'square-customer-123',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const baseInvoiceParams: InvoiceParams = {
      customerId: 'customer-123',
      items: [
        { description: 'Tattoo Session - 2 hours', amount: 300 },
        { description: 'Custom Design Fee', amount: 100 }
      ],
      deliveryMethod: 'EMAIL'
    };

    it('should create an invoice successfully', async () => {
      // Mock customer lookup
      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);

      // Mock Square order creation
      const mockOrder = {
        id: 'order-123',
        total_money: { amount: 40000, currency: 'CAD' }
      };
      mockSquareClient.createOrder.mockResolvedValue({
        result: { order: mockOrder }
      });

      // Mock Square invoice creation
      const mockInvoice = {
        id: 'invoice-123',
        invoice_number: 'INV-123456',
        status: 'SENT',
        publicUrl: 'https://squareup.com/pay-invoice/invoice-123'
      };
      mockSquareClient.createInvoice.mockResolvedValue({
        result: { invoice: mockInvoice }
      });

      // Mock Square invoice send
      mockSquareClient.sendInvoice.mockResolvedValue({
        result: { invoice: { ...mockInvoice, publicUrl: mockInvoice.publicUrl } }
      });

      // Mock database operations
      mockPrismaClient.invoice.create.mockResolvedValue({
        id: 'db-invoice-123',
        amount: 400,
        status: 'pending',
        description: 'Tattoo Session - 2 hours, Custom Design Fee'
      });

      mockPrismaClient.auditLog.create.mockResolvedValue({});

      // Execute
      const result = await paymentLinkService.createInvoice(baseInvoiceParams);

      // Assert
      expect(result.success).toBe(true);
      expect(result.invoice).toEqual(mockInvoice);
      expect(result.publicUrl).toBe(mockInvoice.publicUrl);

      // Verify Square order creation
      expect(mockSquareClient.createOrder).toHaveBeenCalledWith({
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems: [
          {
            name: 'Tattoo Session - 2 hours',
            quantity: '1',
            basePriceMoney: { amount: 300, currency: 'CAD' },
            note: 'Line item 1'
          },
          {
            name: 'Custom Design Fee',
            quantity: '1',
            basePriceMoney: { amount: 100, currency: 'CAD' },
            note: 'Line item 2'
          }
        ],
        customerId: mockCustomer.squareId,
        idempotencyKey: expect.any(String),
        referenceId: expect.any(String)
      });

      // Verify invoice was sent
      expect(mockSquareClient.sendInvoice).toHaveBeenCalledWith({
        invoiceId: mockInvoice.id,
        requestMethod: 'EMAIL'
      });
    });

    it('should create invoice with payment schedule', async () => {
      const paramsWithSchedule = {
        ...baseInvoiceParams,
        paymentSchedule: [
          { amount: 150, dueDate: '2024-03-01', type: 'DEPOSIT' as const },
          { amount: 250, dueDate: '2024-03-15', type: 'BALANCE' as const }
        ]
      };

      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);
      mockSquareClient.createOrder.mockResolvedValue({
        result: { order: { id: 'order-123' } }
      });
      mockSquareClient.createInvoice.mockResolvedValue({
        result: { invoice: { id: 'invoice-123' } }
      });
      
      // Add missing sendInvoice mock
      mockSquareClient.sendInvoice.mockResolvedValue({
        result: { invoice: { id: 'invoice-123', publicUrl: 'https://square.com/invoice-123' } }
      });
      
      mockPrismaClient.invoice.create.mockResolvedValue({});
      mockPrismaClient.auditLog.create.mockResolvedValue({});

      await paymentLinkService.createInvoice(paramsWithSchedule);

      // Verify invoice was created with payment requests
      expect(mockSquareClient.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentRequests: [
            {
              requestType: 'DEPOSIT',
              dueDate: '2024-03-01',
              fixedAmountRequestedMoney: {
                amount: expect.any(BigInt),
                currency: 'CAD'
              },
              tippingEnabled: false
            },
            {
              requestType: 'BALANCE',
              dueDate: '2024-03-15',
              fixedAmountRequestedMoney: {
                amount: expect.any(BigInt),
                currency: 'CAD'
              },
              tippingEnabled: true
            }
          ]
        })
      );
    });

    it('should handle manual delivery method', async () => {
      const paramsWithManualDelivery = {
        ...baseInvoiceParams,
        deliveryMethod: 'SHARE_MANUALLY' as const
      };

      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);
      mockSquareClient.createOrder.mockResolvedValue({
        result: { order: { id: 'order-123' } }
      });
      mockSquareClient.createInvoice.mockResolvedValue({
        result: { 
          invoice: { 
            id: 'invoice-123',
            publicUrl: 'https://squareup.com/pay-invoice/invoice-123'
          } 
        }
      });
      mockPrismaClient.invoice.create.mockResolvedValue({});
      mockPrismaClient.auditLog.create.mockResolvedValue({});

      const result = await paymentLinkService.createInvoice(paramsWithManualDelivery);

      // Verify invoice was not sent
      expect(mockSquareClient.sendInvoice).not.toHaveBeenCalled();
      expect(result.publicUrl).toBe('https://squareup.com/pay-invoice/invoice-123');
    });

    it('should handle customer without Square ID', async () => {
      const customerWithoutSquareId = { ...mockCustomer, squareId: null };
      mockPrismaClient.customer.findUnique.mockResolvedValue(customerWithoutSquareId);

      await expect(paymentLinkService.createInvoice(baseInvoiceParams))
        .rejects.toThrow('Customer customer-123 not found or missing Square ID');
    });
  });

  describe('createCheckoutSession', () => {
    const mockCustomer = {
      id: 'customer-123',
      name: 'John Doe',
      squareId: 'square-customer-123',
      email: null,
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const checkoutParams = {
      customerId: 'customer-123',
      items: [
        { name: 'Tattoo Session', quantity: 1, price: 200, note: '2 hours' },
        { name: 'Touch-up', quantity: 1, price: 50 }
      ],
      redirectUrl: 'https://example.com/success',
      appointmentId: 'appointment-123'
    };

    it('should create a checkout session successfully', async () => {
      // Mock customer lookup
      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);

      // Mock Square order creation
      const mockOrder = {
        id: 'order-123',
        total_money: { amount: 25000, currency: 'CAD' }
      };
      mockSquareClient.createOrder.mockResolvedValue({
        result: { order: mockOrder }
      });

      // Mock checkout session creation
      mockPrismaClient.checkoutSession.create.mockResolvedValue({
        id: 'checkout-123',
        squareOrderId: 'order-123',
        customerId: 'customer-123',
        status: 'pending'
      });

      mockPrismaClient.auditLog.create.mockResolvedValue({});

      // Execute
      const result = await paymentLinkService.createCheckoutSession(checkoutParams);

      // Assert
      expect(result.success).toBe(true);
      expect(result.checkoutId).toBeTruthy();
      expect(result.checkoutUrl).toContain('/checkout/');

      // Verify Square order creation
      expect(mockSquareClient.createOrder).toHaveBeenCalledWith({
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems: [
          {
            name: 'Tattoo Session',
            quantity: '1',
            basePriceMoney: { amount: 200, currency: 'CAD' },
            note: '2 hours'
          },
          {
            name: 'Touch-up',
            quantity: '1',
            basePriceMoney: { amount: 50, currency: 'CAD' },
            note: undefined
          }
        ],
        customerId: mockCustomer.squareId,
        idempotencyKey: expect.any(String),
        referenceId: 'appointment-123'
      });

      // Verify checkout session was stored
      expect(mockPrismaClient.checkoutSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          squareOrderId: mockOrder.id,
          customerId: checkoutParams.customerId,
          appointmentId: checkoutParams.appointmentId,
          status: 'pending',
          metadata: {
            redirectUrl: checkoutParams.redirectUrl,
            items: checkoutParams.items
          }
        })
      });
    });

    it('should handle order creation failure', async () => {
      mockPrismaClient.customer.findUnique.mockResolvedValue(mockCustomer);
      mockSquareClient.createOrder.mockRejectedValue(new Error('Order creation failed'));

      await expect(paymentLinkService.createCheckoutSession(checkoutParams))
        .rejects.toThrow('Order creation failed');
    });
  });
}); 
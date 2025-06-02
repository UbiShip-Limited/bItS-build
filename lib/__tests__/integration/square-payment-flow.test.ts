import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import PaymentLinkService from '../../services/paymentLinkService';
import { PaymentType } from '../../services/paymentService';
import { prisma } from '../../prisma/prisma';
import SquareClient from '../../square';

describe('Square Payment Integration Flow', () => {
  let paymentLinkService: PaymentLinkService;
  let testCustomerId: string;

  beforeAll(async () => {
    // Initialize service
    paymentLinkService = new PaymentLinkService();
    
    // Create test customer
    const customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+1234567890'
      }
    });
    testCustomerId = customer.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.customer.delete({
      where: { id: testCustomerId }
    });
  });

  describe('Payment Link Creation', () => {
    test('should create a payment link for consultation', async () => {
      const params = {
        amount: 50,
        title: 'Tattoo Consultation',
        description: 'Initial consultation for tattoo design',
        customerId: testCustomerId,
        paymentType: PaymentType.CONSULTATION,
        allowTipping: true
      };

      const result = await paymentLinkService.createPaymentLink(params);
      
      expect(result.success).toBe(true);
      expect(result.url).toMatch(/^https:\/\//);
      expect(result.paymentLink).toHaveProperty('id');
      expect(result.paymentLink).toHaveProperty('order_id');
    });

    test('should create a payment link with custom fields', async () => {
      const params = {
        amount: 200,
        title: 'Tattoo Deposit',
        customerId: testCustomerId,
        paymentType: PaymentType.TATTOO_DEPOSIT,
        customFields: [
          { title: 'Preferred appointment date' },
          { title: 'Design notes' }
        ]
      };

      const result = await paymentLinkService.createPaymentLink(params);
      
      expect(result.success).toBe(true);
      expect(result.url).toBeDefined();
    });

    test('should validate minimum amounts', async () => {
      const params = {
        amount: 10, // Below minimum for consultation
        title: 'Low Amount Consultation',
        customerId: testCustomerId,
        paymentType: PaymentType.CONSULTATION
      };

      await expect(paymentLinkService.createPaymentLink(params))
        .rejects.toThrow();
    });
  });

  describe('Invoice Creation', () => {
    test('should create an invoice with payment schedule', async () => {
      const params = {
        customerId: testCustomerId,
        items: [
          { description: 'Full sleeve tattoo design', amount: 500 },
          { description: '8-hour tattoo session', amount: 1200 }
        ],
        paymentSchedule: [
          { amount: 425, dueDate: '2024-07-01', type: 'DEPOSIT' as const },
          { amount: 1275, dueDate: '2024-07-15', type: 'BALANCE' as const }
        ],
        deliveryMethod: 'EMAIL' as const
      };

      const result = await paymentLinkService.createInvoice(params);
      
      expect(result.success).toBe(true);
      expect(result.invoice).toHaveProperty('id');
      expect(result.invoice).toHaveProperty('invoiceNumber');
    });

    test('should create a simple invoice without schedule', async () => {
      const params = {
        customerId: testCustomerId,
        items: [
          { description: 'Consultation fee', amount: 50 }
        ],
        deliveryMethod: 'SHARE_MANUALLY' as const
      };

      const result = await paymentLinkService.createInvoice(params);
      
      expect(result.success).toBe(true);
      expect(result.publicUrl).toBeDefined();
    });
  });

  describe('Checkout Session Creation', () => {
    test('should create a checkout session with multiple items', async () => {
      const params = {
        customerId: testCustomerId,
        items: [
          { name: 'Tattoo Session - 4 hours', quantity: 1, price: 600 },
          { name: 'Premium Aftercare Kit', quantity: 1, price: 45 }
        ],
        redirectUrl: 'https://example.com/success'
      };

      const result = await paymentLinkService.createCheckoutSession(params);
      
      expect(result.success).toBe(true);
      expect(result.checkoutUrl).toMatch(/^https?:\/\//);
      expect(result.checkoutId).toBeDefined();
    });
  });

  describe('Payment Link Management', () => {
    test('should list payment links', async () => {
      const result = await paymentLinkService.listPaymentLinks({ limit: 10 });
      
      expect(result.result).toHaveProperty('paymentLinks');
      expect(Array.isArray(result.result.paymentLinks)).toBe(true);
    });

    test('should retrieve payment link details', async () => {
      // First create a payment link
      const createResult = await paymentLinkService.createPaymentLink({
        amount: 100,
        title: 'Test Payment',
        customerId: testCustomerId,
        paymentType: PaymentType.TATTOO_DEPOSIT
      });

      // Then retrieve it
      const getResult = await paymentLinkService.getPaymentLink(createResult.paymentLink.id);
      
      expect(getResult.result.paymentLink).toHaveProperty('id', createResult.paymentLink.id);
    });

    test('should soft delete a payment link', async () => {
      // Create a payment link
      const createResult = await paymentLinkService.createPaymentLink({
        amount: 100,
        title: 'To Be Deleted',
        customerId: testCustomerId,
        paymentType: PaymentType.TATTOO_DEPOSIT
      });

      // Delete it
      const deleteResult = await paymentLinkService.deletePaymentLink(createResult.paymentLink.id);
      
      expect(deleteResult.result).toBeDefined();
      
      // Verify it's marked as cancelled in the database
      const paymentLink = await prisma.paymentLink.findUnique({
        where: { id: createResult.paymentLink.id }
      });
      
      expect(paymentLink?.status).toBe('cancelled');
      expect(paymentLink?.deletedAt).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid customer ID', async () => {
      const params = {
        amount: 100,
        title: 'Invalid Customer Test',
        customerId: 'invalid-customer-id',
        paymentType: PaymentType.CONSULTATION
      };

      await expect(paymentLinkService.createPaymentLink(params))
        .rejects.toThrow('Customer invalid-customer-id not found');
    });

    test('should handle missing Square customer ID', async () => {
      // Create customer without Square ID
      const customerWithoutSquareId = await prisma.customer.create({
        data: {
          name: 'No Square ID',
          email: 'nosquare@example.com'
        }
      });

      const params = {
        customerId: customerWithoutSquareId.id,
        items: [{ description: 'Test', amount: 50 }]
      };

      await expect(paymentLinkService.createInvoice(params))
        .rejects.toThrow('missing Square ID');

      // Cleanup
      await prisma.customer.delete({
        where: { id: customerWithoutSquareId.id }
      });
    });
  });
}); 
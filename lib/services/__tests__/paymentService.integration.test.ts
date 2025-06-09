import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import PaymentService, { PaymentType, PaymentValidationError, DuplicatePaymentError } from '../paymentService';
import { PrismaClient } from '@prisma/client';

// Test database
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./test.db'
    }
  }
});

// Mock external services only (keep business logic real)  
beforeAll(async () => {
  // Set test environment and pricing
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('BYPASS_AUTH', 'true');
  vi.stubEnv('PRICE_CONSULTATION_MIN', '185');
  vi.stubEnv('PRICE_DRAWING_CONSULTATION_MIN', '120');
  vi.stubEnv('PRICE_TATTOO_DEPOSIT_MIN', '150');
  vi.stubEnv('PRICE_TATTOO_FINAL_MIN', '185');
});

// Mock Square client at top level - EXACT path from import
vi.mock('../square/index.js', () => ({
  default: {
    fromEnv: vi.fn(() => ({
      createPayment: vi.fn().mockResolvedValue({
        result: {
          payment: {
            id: 'sq-payment-mock',
            status: 'COMPLETED',
            amountMoney: { amount: 50000, currency: 'CAD' },
            sourceType: 'CARD',
            cardDetails: { card: { last4: '1234', cardBrand: 'VISA' } },
            createdAt: new Date().toISOString()
          }
        }
      }),
      createRefund: vi.fn().mockResolvedValue({
        result: {
          refund: {
            id: 'sq-refund-mock',
            status: 'COMPLETED',
            amountMoney: { amount: 25000, currency: 'CAD' }
          }
        }
      }),
      getPaymentById: vi.fn().mockResolvedValue({
        result: { payment: { id: 'sq-payment-mock', status: 'COMPLETED' } }
      })
    }))
  }
}));

// Mock Cloudinary
vi.mock('../../cloudinary', () => ({
  default: {
    validateUploadResult: vi.fn().mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/test.jpg',
      publicId: 'test-image-123'
    }),
    transferImagesToCustomer: vi.fn().mockResolvedValue(true),
    getTattooRequestImages: vi.fn().mockResolvedValue([])
  }
}));

afterAll(async () => {
  await testPrisma.$disconnect();
  vi.unstubAllEnvs();
});

describe('PaymentService (Integration)', () => {
  let paymentService: PaymentService;
  let testCustomer: any;

  beforeEach(async () => {
    // Clean database before each test - exact same pattern as working integration test
    await testPrisma.auditLog.deleteMany();
    await testPrisma.payment.deleteMany();
    await testPrisma.customer.deleteMany();

    // Initialize REAL service (no mocks)
    paymentService = new PaymentService();
    
    // Create test customer with unique email
    const uniqueId = Date.now() + Math.random();
    testCustomer = await testPrisma.customer.create({
      data: {
        name: 'Test Customer',
        email: `customer-${uniqueId}@test.com`,
        phone: '+1234567890',
        squareId: 'sq-customer-test'
      }
    });
  });

  describe('💳 Core Payment Processing', () => {
    it('should process consultation payment successfully', async () => {
      console.log('\n💳 Testing consultation payment processing');
      
      const paymentParams = {
        sourceId: 'card-nonce-consultation',
        amount: 200, // Above $185 minimum
        customerId: testCustomer.id,
        paymentType: PaymentType.CONSULTATION,
        note: 'Initial design consultation'
      };

      const result = await paymentService.processPayment(paymentParams);

      // Verify payment processing success
      expect(result.success).toBe(true);
      expect(result.payment).toBeDefined();
      expect(result.payment.amount).toBe(200);
      expect(result.payment.paymentType).toBe(PaymentType.CONSULTATION);
      expect(result.payment.status).toBe('completed');
      expect(result.payment.customerId).toBe(testCustomer.id);
      
      // Verify Square payment integration
      expect(result.squarePayment).toBeDefined();
      expect(result.squarePayment!.id).toBe('sq-payment-mock');

      // Verify database storage
      const dbPayment = await testPrisma.payment.findUnique({
        where: { id: result.payment.id }
      });
      expect(dbPayment).toBeTruthy();
      expect(dbPayment!.squareId).toBe('sq-payment-mock');

      console.log('✅ Consultation payment processed successfully');
    });

    it('should enforce minimum payment amounts correctly', async () => {
      console.log('\n🚫 Testing minimum amount validation');
      
      // Consultation: $185 minimum
      await expect(
        paymentService.processPayment({
          sourceId: 'card-nonce-low',
          amount: 180, // Below $185
          customerId: testCustomer.id,
          paymentType: PaymentType.CONSULTATION
        })
      ).rejects.toThrow('Minimum payment amount for consultation is $185 CAD');

      // Drawing consultation: $120 minimum  
      await expect(
        paymentService.processPayment({
          sourceId: 'card-nonce-low',
          amount: 100, // Below $120
          customerId: testCustomer.id,
          paymentType: PaymentType.DRAWING_CONSULTATION
        })
      ).rejects.toThrow('Minimum payment amount for drawing_consultation is $120 CAD');

      // Tattoo deposit: $150 minimum
      await expect(
        paymentService.processPayment({
          sourceId: 'card-nonce-low',
          amount: 140, // Below $150
          customerId: testCustomer.id,
          paymentType: PaymentType.TATTOO_DEPOSIT
        })
      ).rejects.toThrow('Minimum payment amount for tattoo_deposit is $150 CAD');

      console.log('✅ Minimum amount validation working correctly');
    });

    it('should validate customer existence', async () => {
      console.log('\n👤 Testing customer validation');
      
      await expect(
        paymentService.processPayment({
          sourceId: 'card-nonce-invalid-customer',
          amount: 200,
          customerId: 'non-existent-customer',
          paymentType: PaymentType.CONSULTATION
        })
      ).rejects.toThrow('Customer non-existent-customer not found');

      console.log('✅ Customer validation working correctly');
    });
  });

  describe('💰 Payment Refunds', () => {
    let processedPayment: any;

    beforeEach(async () => {
      console.log('\n💰 Setting up payment for refund testing');
      
      // Create a payment to refund
      const result = await paymentService.processPayment({
        sourceId: 'card-nonce-for-refund',
        amount: 300,
        customerId: testCustomer.id,
        paymentType: PaymentType.TATTOO_DEPOSIT
      });
      processedPayment = result.payment;
      
      console.log(`Payment created: ${processedPayment.id}`);
    });

    it('should process full refund successfully', async () => {
      console.log('\n🔄 Testing full refund');
      
      const refundResult = await paymentService.refundPayment(
        processedPayment.id,
        undefined, // Full refund
        'Customer cancellation'
      );

      expect(refundResult.success).toBe(true);
      expect(refundResult.payment.status).toBe('refunded');
      expect(refundResult.refund).toBeDefined();
      expect(refundResult.refund.id).toBe('sq-refund-mock');

      // Verify database update
      const updatedPayment = await testPrisma.payment.findUnique({
        where: { id: processedPayment.id }
      });
      expect(updatedPayment!.status).toBe('refunded');

      console.log('✅ Full refund processed successfully');
    });

    it('should validate refund business rules', async () => {
      console.log('\n📋 Testing refund validation rules');
      
      // Cannot refund more than original amount
      await expect(
        paymentService.refundPayment(processedPayment.id, 500) // More than $300 original
      ).rejects.toThrow('Refund amount cannot exceed payment amount');

      // Cannot refund non-existent payment
      await expect(
        paymentService.refundPayment('non-existent-payment-id')
      ).rejects.toThrow('Payment not found or missing Square ID');

      console.log('✅ Refund validation rules working correctly');
    });
  });

  describe('📊 Payment Data and Business Logic', () => {
    it('should use centralized pricing configuration', async () => {
      console.log('\n📊 Testing pricing configuration integration');
      
      const testCases = [
        { type: PaymentType.CONSULTATION, minAmount: 185 },
        { type: PaymentType.DRAWING_CONSULTATION, minAmount: 120 },
        { type: PaymentType.TATTOO_DEPOSIT, minAmount: 150 },
        { type: PaymentType.TATTOO_FINAL, minAmount: 185 }
      ];

      for (const testCase of testCases) {
        console.log(`Testing ${testCase.type} minimum: $${testCase.minAmount}`);
        
        // Amount just below minimum should fail
        await expect(
          paymentService.processPayment({
            sourceId: 'test-card',
            amount: testCase.minAmount - 1,
            customerId: testCustomer.id,
            paymentType: testCase.type
          })
        ).rejects.toThrow(PaymentValidationError);

        // Amount at minimum should succeed
        const result = await paymentService.processPayment({
          sourceId: 'test-card-valid',
          amount: testCase.minAmount,
          customerId: testCustomer.id,
          paymentType: testCase.type
        });
        expect(result.success).toBe(true);
      }

      console.log('✅ Pricing configuration working correctly');
    });

    it('should handle complete payment workflow', async () => {
      console.log('\n🔄 Testing complete payment workflow');
      
      // Step 1: Process payment
      const paymentResult = await paymentService.processPayment({
        sourceId: 'workflow-card',
        amount: 500,
        customerId: testCustomer.id,
        paymentType: PaymentType.TATTOO_FINAL,
        bookingId: 'booking-workflow-123',
        note: 'Final payment for sleeve tattoo'
      });

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.payment.bookingId).toBe('booking-workflow-123');
      
      // Step 2: Verify audit trail
      const auditLogs = await testPrisma.auditLog.findMany({
        where: { resourceId: paymentResult.payment.id }
      });
      expect(auditLogs.length).toBeGreaterThanOrEqual(1);
      
      // Step 3: Process partial refund
      const refundResult = await paymentService.refundPayment(
        paymentResult.payment.id,
        200,
        'Partial service adjustment'
      );
      
      expect(refundResult.success).toBe(true);
      expect(refundResult.payment.status).toBe('partially_refunded');

      console.log('✅ Complete payment workflow successful');
    });
  });
}); 
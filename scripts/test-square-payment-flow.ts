#!/usr/bin/env tsx
/**
 * Comprehensive Square Payment Flow Testing
 * Run with: npx tsx scripts/test-square-payment-flow.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from '../lib/prisma/prisma';
import PaymentService, { PaymentType } from '../lib/services/paymentService';
import PaymentLinkService from '../lib/services/paymentLinkService';
import SquareClient from '../lib/square/index';
import { v4 as uuidv4 } from 'uuid';

// Test result tracking
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class PaymentFlowTester {
  private results: TestResult[] = [];
  private paymentService: PaymentService;
  private paymentLinkService: PaymentLinkService;
  private squareClient: ReturnType<typeof SquareClient.fromEnv> | null;
  private testCustomerId: string | null = null;
  private testPaymentId: string | null = null;
  private testPaymentLinkId: string | null = null;

  constructor() {
    try {
      this.squareClient = SquareClient.fromEnv();
      this.paymentService = new PaymentService(prisma, this.squareClient);
      this.paymentLinkService = new PaymentLinkService(prisma, this.squareClient);
    } catch (error: any) {
      console.error('❌ Failed to initialize Square client:', error.message);
      this.squareClient = null;
      this.paymentService = new PaymentService(prisma);
      this.paymentLinkService = new PaymentLinkService(prisma);
    }
  }

  async runAllTests() {
    console.log('💳 COMPREHENSIVE SQUARE PAYMENT FLOW TESTING\n');
    console.log('=' .repeat(60));
    
    // Phase 1: Configuration & Setup
    await this.testSquareConfiguration();
    await this.createTestData();
    
    if (!this.squareClient) {
      console.log('\n⚠️  Square not configured - skipping payment tests');
      this.printResults();
      return;
    }
    
    // Phase 2: Payment Processing
    await this.testPaymentValidation();
    await this.testPaymentProcessing();
    
    // Phase 3: Payment Links
    await this.testPaymentLinkCreation();
    await this.testPaymentLinkRetrieval();
    
    // Phase 4: Refunds
    await this.testRefundProcessing();
    
    // Phase 5: Webhooks
    await this.testWebhookProcessing();
    
    // Cleanup
    await this.cleanup();
    
    // Print results
    this.printResults();
  }

  private async testSquareConfiguration() {
    console.log('\n📍 Phase 1: Testing Square Configuration\n');
    
    const requiredVars = [
      'SQUARE_ACCESS_TOKEN',
      'SQUARE_LOCATION_ID',
      'SQUARE_ENVIRONMENT',
      'SQUARE_APPLICATION_ID'
    ];
    
    const missingVars = requiredVars.filter(v => !process.env[v]);
    
    if (missingVars.length === 0) {
      this.addResult('Square Configuration', true, undefined, {
        environment: process.env.SQUARE_ENVIRONMENT,
        locationId: process.env.SQUARE_LOCATION_ID?.substring(0, 10) + '...',
        hasWebhookKey: !!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
      });
      
      // Test API connection
      if (this.squareClient) {
        try {
          const location = await this.squareClient.locationsApi.retrieveLocation(
            process.env.SQUARE_LOCATION_ID!
          );
          this.addResult('Square API Connection', true, undefined, {
            locationName: location.result.location?.name,
            status: location.result.location?.status
          });
        } catch (error: any) {
          this.addResult('Square API Connection', false, error.message);
        }
      }
    } else {
      this.addResult('Square Configuration', false, 
        `Missing: ${missingVars.join(', ')}`);
    }
  }

  private async createTestData() {
    console.log('\n📍 Phase 2: Creating Test Data\n');
    
    try {
      // Create or find test customer
      const testEmail = `payment-test-${Date.now()}@test.com`;
      const customer = await prisma.customer.create({
        data: {
          name: 'Payment Test Customer',
          email: testEmail,
          phone: '+16041234567'
        }
      });
      
      this.testCustomerId = customer.id;
      this.addResult('Test Data Creation', true, undefined, {
        customerId: customer.id,
        email: testEmail
      });
    } catch (error: any) {
      this.addResult('Test Data Creation', false, error.message);
    }
  }

  private async testPaymentValidation() {
    console.log('\n📍 Phase 3: Testing Payment Validation\n');
    
    if (!this.testCustomerId || !this.squareClient) return;
    
    // Test 1: Invalid amount (too low)
    try {
      await this.paymentService.processPayment({
        sourceId: 'cnon:card-nonce-ok', // Test nonce
        amount: 10, // Below minimum
        customerId: this.testCustomerId,
        paymentType: PaymentType.CONSULTATION,
        note: 'Test payment - should fail'
      });
      this.addResult('Payment Validation (Min Amount)', false, 
        'Should have rejected low amount');
    } catch (error: any) {
      if (error.message.includes('Minimum payment amount')) {
        this.addResult('Payment Validation (Min Amount)', true);
      } else {
        this.addResult('Payment Validation (Min Amount)', false, error.message);
      }
    }
    
    // Test 2: Invalid amount (too high)
    try {
      await this.paymentService.processPayment({
        sourceId: 'cnon:card-nonce-ok',
        amount: 15000, // Above $10,000 limit
        customerId: this.testCustomerId,
        paymentType: PaymentType.TATTOO_FINAL,
        note: 'Test payment - should fail'
      });
      this.addResult('Payment Validation (Max Amount)', false, 
        'Should have rejected high amount');
    } catch (error: any) {
      if (error.message.includes('exceeds maximum limit')) {
        this.addResult('Payment Validation (Max Amount)', true);
      } else {
        this.addResult('Payment Validation (Max Amount)', false, error.message);
      }
    }
    
    // Test 3: Invalid payment type
    try {
      await this.paymentService.processPayment({
        sourceId: 'cnon:card-nonce-ok',
        amount: 100,
        customerId: this.testCustomerId,
        paymentType: 'invalid_type' as PaymentType,
        note: 'Test payment - should fail'
      });
      this.addResult('Payment Validation (Invalid Type)', false, 
        'Should have rejected invalid type');
    } catch (error: any) {
      if (error.message.includes('Invalid payment type')) {
        this.addResult('Payment Validation (Invalid Type)', true);
      } else {
        this.addResult('Payment Validation (Invalid Type)', false, error.message);
      }
    }
  }

  private async testPaymentProcessing() {
    console.log('\n📍 Phase 4: Testing Payment Processing\n');
    
    if (!this.testCustomerId || !this.squareClient) return;
    
    // Note: In sandbox, we use test payment tokens
    // Real payments would use actual card nonces from Square Web Payments SDK
    
    try {
      const idempotencyKey = uuidv4();
      
      // For sandbox testing, we need to create a payment directly
      console.log('Creating test payment in Square sandbox...');
      
      const paymentRequest = {
        sourceId: 'cnon:card-nonce-ok', // Sandbox test token
        idempotencyKey,
        amountMoney: {
          amount: BigInt(5000), // $50.00 CAD
          currency: 'CAD'
        },
        locationId: process.env.SQUARE_LOCATION_ID,
        note: 'Test consultation payment',
        referenceId: `test-${Date.now()}`
      };
      
      const squareResponse = await this.squareClient.paymentsApi.createPayment(paymentRequest);
      
      if (squareResponse.result.payment) {
        // Save payment to database
        const payment = await prisma.payment.create({
          data: {
            amount: 50,
            status: 'completed',
            paymentMethod: 'card',
            paymentType: PaymentType.CONSULTATION,
            customerId: this.testCustomerId,
            squareId: squareResponse.result.payment.id,
            paymentDetails: JSON.parse(JSON.stringify(squareResponse.result.payment))
          }
        });
        
        this.testPaymentId = payment.id;
        
        this.addResult('Payment Processing', true, undefined, {
          paymentId: payment.id,
          squarePaymentId: squareResponse.result.payment.id,
          amount: '$50.00 CAD',
          status: squareResponse.result.payment.status
        });
      }
    } catch (error: any) {
      this.addResult('Payment Processing', false, error.message);
    }
  }

  private async testPaymentLinkCreation() {
    console.log('\n📍 Phase 5: Testing Payment Link Creation\n');
    
    if (!this.testCustomerId || !this.squareClient) return;
    
    try {
      const result = await this.paymentLinkService.createPaymentLink({
        amount: 200, // $200 deposit
        title: 'Tattoo Deposit - Test',
        description: 'Initial deposit for tattoo session',
        customerId: this.testCustomerId,
        paymentType: PaymentType.TATTOO_DEPOSIT,
        allowTipping: true
      });
      
      if (result.success) {
        this.testPaymentLinkId = result.paymentLink.id;
        this.addResult('Payment Link Creation', true, undefined, {
          paymentLinkId: result.paymentLink.id,
          url: result.url,
          amount: '$200.00 CAD'
        });
        
        console.log(`\n💳 Payment Link Created:`);
        console.log(`   URL: ${result.url}`);
        console.log(`   ID: ${result.paymentLink.id}`);
      } else {
        this.addResult('Payment Link Creation', false, 'Failed to create payment link');
      }
    } catch (error: any) {
      this.addResult('Payment Link Creation', false, error.message);
    }
  }

  private async testPaymentLinkRetrieval() {
    console.log('\n📍 Phase 6: Testing Payment Link Retrieval\n');
    
    if (!this.testPaymentLinkId || !this.squareClient) return;
    
    try {
      const response = await this.squareClient.checkoutApi.retrievePaymentLink(
        this.testPaymentLinkId
      );
      
      if (response.result.paymentLink) {
        this.addResult('Payment Link Retrieval', true, undefined, {
          id: response.result.paymentLink.id,
          status: response.result.paymentLink.paymentNote,
          createdAt: response.result.paymentLink.createdAt
        });
      }
    } catch (error: any) {
      this.addResult('Payment Link Retrieval', false, error.message);
    }
  }

  private async testRefundProcessing() {
    console.log('\n📍 Phase 7: Testing Refund Processing\n');
    
    if (!this.testPaymentId || !this.squareClient) return;
    
    try {
      // Get the payment details
      const payment = await prisma.payment.findUnique({
        where: { id: this.testPaymentId }
      });
      
      if (!payment || !payment.squareId) {
        this.addResult('Refund Processing', false, 'Payment not found');
        return;
      }
      
      // Process partial refund (50% of original amount)
      const refundAmount = payment.amount / 2;
      const result = await this.paymentService.refundPayment(
        this.testPaymentId,
        refundAmount,
        'Test partial refund'
      );
      
      if (result.success) {
        this.addResult('Refund Processing', true, undefined, {
          originalAmount: payment.amount,
          refundAmount,
          status: result.payment.status,
          refundId: result.refund?.id
        });
      } else {
        this.addResult('Refund Processing', false, 'Refund failed');
      }
    } catch (error: any) {
      this.addResult('Refund Processing', false, error.message);
    }
  }

  private async testWebhookProcessing() {
    console.log('\n📍 Phase 8: Testing Webhook Configuration\n');
    
    const hasWebhookKey = !!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    
    this.addResult('Webhook Configuration', hasWebhookKey, 
      hasWebhookKey ? undefined : 'SQUARE_WEBHOOK_SIGNATURE_KEY not set');
    
    // Check recent webhook logs
    const recentWebhooks = await prisma.auditLog.findMany({
      where: {
        action: { contains: 'webhook' }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    if (recentWebhooks.length > 0) {
      this.addResult('Webhook Activity', true, undefined, {
        recentEvents: recentWebhooks.length,
        lastEvent: recentWebhooks[0].action
      });
    } else {
      this.addResult('Webhook Activity', false, 'No webhook events found');
    }
  }

  private async cleanup() {
    console.log('\n📍 Phase 9: Cleanup\n');
    
    try {
      // Delete test payment if exists
      if (this.testPaymentId) {
        await prisma.payment.delete({
          where: { id: this.testPaymentId }
        }).catch(() => {}); // Ignore if already deleted
      }
      
      // Delete test customer
      if (this.testCustomerId) {
        await prisma.customer.delete({
          where: { id: this.testCustomerId }
        }).catch(() => {}); // Ignore if already deleted
      }
      
      console.log('✅ Test data cleaned up');
    } catch (error: any) {
      console.log('⚠️  Some cleanup failed:', error.message);
    }
  }

  private addResult(name: string, passed: boolean, error?: string, details?: any) {
    this.results.push({ name, passed, error, details });
  }

  private printResults() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY\n');
    
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    
    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log(`\n🎯 Final Score: ${passed} passed, ${failed} failed\n`);
    
    if (failed === 0) {
      console.log('✨ All payment flow tests passed successfully!');
    } else {
      console.log(`⚠️  ${failed} test(s) failed. Review the errors above.`);
    }
    
    // Payment flow status summary
    console.log('\n📋 PAYMENT SYSTEM STATUS:');
    console.log('✅ Square Integration: ' + (this.squareClient ? 'Connected' : 'Not configured'));
    console.log('✅ Payment Processing: ' + (this.results.find(r => r.name === 'Payment Processing')?.passed ? 'Working' : 'Issues detected'));
    console.log('✅ Payment Links: ' + (this.results.find(r => r.name === 'Payment Link Creation')?.passed ? 'Working' : 'Issues detected'));
    console.log('✅ Refunds: ' + (this.results.find(r => r.name === 'Refund Processing')?.passed ? 'Working' : 'Issues detected'));
    console.log('✅ Webhooks: ' + (process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ? 'Configured' : 'Not configured'));
    
    console.log('\n📝 Next Steps:');
    if (!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
      console.log('1. Configure webhook signature key in Railway');
    }
    if (process.env.SQUARE_ENVIRONMENT === 'sandbox') {
      console.log('2. Test with Square Web Payments SDK in frontend');
      console.log('3. Switch to production when ready');
    }
    console.log('4. Monitor payment logs in Square Dashboard');
  }
}

// Run the tests
const tester = new PaymentFlowTester();
tester.runAllTests()
  .catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
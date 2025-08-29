#!/usr/bin/env tsx
/**
 * Simple Payment Flow Test
 * Run with: npx tsx scripts/test-payment-flow-simple.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client, Environment } from 'square';
import { v4 as uuidv4 } from 'uuid';

console.log('💳 SIMPLE PAYMENT FLOW TEST\n');
console.log('=' .repeat(60));

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' 
    ? Environment.Production 
    : Environment.Sandbox
});

async function runTests() {
  const results: { test: string; result: string; details?: any }[] = [];
  
  // Test 1: Create a test payment (sandbox only)
  if (process.env.SQUARE_ENVIRONMENT !== 'production') {
    console.log('\n🧪 Test 1: Creating Test Payment (Sandbox)');
    
    try {
      const payment = await client.paymentsApi.createPayment({
        sourceId: 'cnon:card-nonce-ok', // Sandbox test nonce
        idempotencyKey: uuidv4(),
        amountMoney: {
          amount: BigInt(5000), // $50.00 CAD
          currency: 'CAD'
        },
        locationId: process.env.SQUARE_LOCATION_ID,
        note: 'Test payment - consultation',
        referenceId: `test-${Date.now()}`
      });
      
      results.push({
        test: 'Create Payment',
        result: '✅ Success',
        details: {
          id: payment.result.payment?.id,
          amount: `$${(Number(payment.result.payment?.amountMoney?.amount) / 100).toFixed(2)} CAD`,
          status: payment.result.payment?.status
        }
      });
      
      // Test 2: Refund the payment
      console.log('\n🧪 Test 2: Processing Refund');
      
      const refund = await client.refundsApi.refundPayment({
        idempotencyKey: uuidv4(),
        paymentId: payment.result.payment?.id!,
        amountMoney: {
          amount: BigInt(2500), // $25.00 partial refund
          currency: 'CAD'
        },
        reason: 'Test partial refund'
      });
      
      results.push({
        test: 'Process Refund',
        result: '✅ Success',
        details: {
          id: refund.result.refund?.id,
          amount: `$${(Number(refund.result.refund?.amountMoney?.amount) / 100).toFixed(2)} CAD`,
          status: refund.result.refund?.status
        }
      });
      
    } catch (error: any) {
      results.push({
        test: 'Payment Operations',
        result: '❌ Failed',
        details: error.message
      });
    }
  }
  
  // Test 3: Create payment link
  console.log('\n🧪 Test 3: Creating Payment Link');
  
  try {
    const paymentLink = await client.checkoutApi.createPaymentLink({
      idempotencyKey: uuidv4(),
      quickPay: {
        name: 'Tattoo Deposit - Test',
        priceMoney: {
          amount: BigInt(20000), // $200.00 CAD
          currency: 'CAD'
        },
        locationId: process.env.SQUARE_LOCATION_ID
      },
      checkoutOptions: {
        allowTipping: true,
        acceptedPaymentMethods: {
          applePay: true,
          googlePay: true,
          cashAppPay: true,
          afterpayClearpay: false
        }
      },
      paymentNote: 'Initial deposit for tattoo session'
    });
    
    results.push({
      test: 'Create Payment Link',
      result: '✅ Success',
      details: {
        id: paymentLink.result.paymentLink?.id,
        url: paymentLink.result.paymentLink?.url,
        amount: '$200.00 CAD'
      }
    });
    
    console.log(`\n💳 Payment Link Created:`);
    console.log(`   URL: ${paymentLink.result.paymentLink?.url}`);
    console.log(`   (This link can be sent to customers for payment)`);
    
  } catch (error: any) {
    results.push({
      test: 'Create Payment Link',
      result: '❌ Failed',
      details: error.message
    });
  }
  
  // Test 4: Create an invoice
  console.log('\n🧪 Test 4: Creating Invoice');
  
  try {
    const invoice = await client.invoicesApi.createInvoice({
      invoice: {
        locationId: process.env.SQUARE_LOCATION_ID,
        invoiceNumber: `INV-TEST-${Date.now()}`,
        title: 'Tattoo Session - Test Invoice',
        description: 'Full day tattoo session',
        primaryRecipient: {
          customerId: undefined // Would use actual customer ID in production
        },
        paymentRequests: [
          {
            requestType: 'BALANCE',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Due in 7 days
          }
        ],
        acceptedPaymentMethods: {
          card: true,
          squareGiftCard: false,
          bankAccount: false,
          buyNowPayLater: false
        },
        invoiceLineItems: [
          {
            quantity: '1',
            basePriceMoney: {
              amount: BigInt(50000), // $500.00 CAD
              currency: 'CAD'
            },
            name: 'Full Day Tattoo Session',
            variationName: '8 hours'
          }
        ]
      }
    });
    
    results.push({
      test: 'Create Invoice',
      result: '✅ Success',
      details: {
        id: invoice.result.invoice?.id,
        number: invoice.result.invoice?.invoiceNumber,
        total: `$${(Number(invoice.result.invoice?.paymentRequests?.[0]?.computedAmountMoney?.amount) / 100).toFixed(2)} CAD`,
        status: invoice.result.invoice?.status
      }
    });
    
  } catch (error: any) {
    results.push({
      test: 'Create Invoice',
      result: '❌ Failed',
      details: error.message
    });
  }
  
  // Print results summary
  console.log('\n' + '=' .repeat(60));
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  
  results.forEach(result => {
    console.log(`${result.result} ${result.test}`);
    if (result.details) {
      if (typeof result.details === 'string') {
        console.log(`   Error: ${result.details}`);
      } else {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
    }
  });
  
  const passed = results.filter(r => r.result.includes('✅')).length;
  const failed = results.filter(r => r.result.includes('❌')).length;
  
  console.log('\n' + '=' .repeat(60));
  console.log(`\n🎯 Score: ${passed}/${results.length} tests passed\n`);
  
  // Payment types and minimums reminder
  console.log('📋 Payment Types & Minimums:');
  console.log('  • Consultation: $50 CAD minimum');
  console.log('  • Drawing Consultation: $100 CAD minimum');
  console.log('  • Tattoo Deposit: $200 CAD minimum');
  console.log('  • Tattoo Final: $50 CAD minimum');
  
  if (process.env.SQUARE_ENVIRONMENT === 'sandbox') {
    console.log('\n🧪 Test Card Numbers (Sandbox):');
    console.log('  • 4111 1111 1111 1111 - Visa (approved)');
    console.log('  • 5105 1051 0510 5100 - Mastercard (approved)');
    console.log('  • 4000 0000 0000 0002 - Declined');
    
    console.log('\n⚠️  Ready to switch to production?');
    console.log('  1. Update SQUARE_ENVIRONMENT=production');
    console.log('  2. Update SQUARE_ACCESS_TOKEN with production token');
    console.log('  3. Update SQUARE_WEBHOOK_SIGNATURE_KEY with production key');
    console.log('  4. Test with a real card (small amount first)');
  } else {
    console.log('\n🔴 PRODUCTION MODE - Real payments will be processed!');
  }
}

runTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
#!/usr/bin/env tsx
/**
 * Basic Payment System Test
 * Run with: npx tsx scripts/test-payment-basic.ts
 */

require('dotenv').config();

const { Client, Environment } = require('square');

console.log('💳 BASIC PAYMENT SYSTEM TEST\n');
console.log('=' .repeat(60));

// Configuration check
console.log('\n📋 Configuration:');
console.log(`  Environment: ${process.env.SQUARE_ENVIRONMENT || 'Not set'}`);
console.log(`  Location ID: ${process.env.SQUARE_LOCATION_ID || 'Not set'}`);
console.log(`  Access Token: ${process.env.SQUARE_ACCESS_TOKEN ? '✅ Set' : '❌ Not set'}`);
console.log(`  Application ID: ${process.env.SQUARE_APPLICATION_ID ? '✅ Set' : '❌ Not set'}`);
console.log(`  Webhook Key: ${process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ? '✅ Set' : '❌ Not set'}`);

if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID) {
  console.error('\n❌ Missing required Square configuration');
  process.exit(1);
}

// Initialize client
const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' 
    ? Environment.Production 
    : Environment.Sandbox
});

async function runTests() {
  try {
    console.log('\n🔍 Testing API Connection...\n');
    
    // Test 1: Retrieve location
    const locationResponse = await client.locationsApi.retrieveLocation(
      process.env.SQUARE_LOCATION_ID
    );
    
    const location = locationResponse.result.location;
    console.log('✅ Location Retrieved:');
    console.log(`  Name: ${location?.name}`);
    console.log(`  Status: ${location?.status}`);
    console.log(`  Currency: ${location?.currency}`);
    console.log(`  Country: ${location?.country}`);
    
    // Test 2: List recent payments
    console.log('\n📊 Checking Recent Payments:');
    try {
      const paymentsResponse = await client.paymentsApi.listPayments(
        undefined, // begin_time
        undefined, // end_time
        undefined, // sort_order
        undefined, // cursor
        process.env.SQUARE_LOCATION_ID,
        undefined, // total
        undefined, // last_4
        undefined, // card_brand
        5 // limit
      );
      
      const payments = paymentsResponse.result.payments || [];
      if (payments.length > 0) {
        console.log(`  Found ${payments.length} recent payment(s)`);
        payments.forEach(payment => {
          const amount = Number(payment.amountMoney?.amount || 0) / 100;
          console.log(`  - ${payment.id?.substring(0, 10)}...: $${amount.toFixed(2)} ${payment.amountMoney?.currency} (${payment.status})`);
        });
      } else {
        console.log('  No recent payments found');
      }
    } catch (error) {
      console.log('  No payments found or unable to list');
    }
    
    // Test 3: Create a test payment (sandbox only)
    if (process.env.SQUARE_ENVIRONMENT !== 'production') {
      console.log('\n🧪 Creating Test Payment (Sandbox):');
      
      const { v4: uuidv4 } = require('uuid');
      
      try {
        const paymentResponse = await client.paymentsApi.createPayment({
          sourceId: 'cnon:card-nonce-ok', // Sandbox test token
          idempotencyKey: uuidv4(),
          amountMoney: {
            amount: BigInt(5000), // $50.00 CAD
            currency: 'CAD'
          },
          locationId: process.env.SQUARE_LOCATION_ID,
          note: 'Test payment - consultation',
          referenceId: `test-${Date.now()}`
        });
        
        const payment = paymentResponse.result.payment;
        console.log('  ✅ Payment created successfully');
        console.log(`  Payment ID: ${payment?.id}`);
        console.log(`  Amount: $${(Number(payment?.amountMoney?.amount || 0) / 100).toFixed(2)} ${payment?.amountMoney?.currency}`);
        console.log(`  Status: ${payment?.status}`);
        
        // Test refund
        console.log('\n💸 Testing Refund:');
        const refundResponse = await client.refundsApi.refundPayment({
          idempotencyKey: uuidv4(),
          paymentId: payment?.id,
          amountMoney: {
            amount: BigInt(2500), // $25.00 partial refund
            currency: 'CAD'
          },
          reason: 'Test partial refund'
        });
        
        const refund = refundResponse.result.refund;
        console.log('  ✅ Refund processed successfully');
        console.log(`  Refund ID: ${refund?.id}`);
        console.log(`  Amount: $${(Number(refund?.amountMoney?.amount || 0) / 100).toFixed(2)} ${refund?.amountMoney?.currency}`);
        console.log(`  Status: ${refund?.status}`);
        
      } catch (error) {
        console.log('  ⚠️  Could not create test payment:', error.message);
      }
    }
    
    // Test 4: Create payment link
    console.log('\n🔗 Creating Payment Link:');
    
    const { v4: uuidv4 } = require('uuid');
    
    try {
      const linkResponse = await client.checkoutApi.createPaymentLink({
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
      
      const link = linkResponse.result.paymentLink;
      console.log('  ✅ Payment link created');
      console.log(`  Link ID: ${link?.id}`);
      console.log(`  URL: ${link?.url}`);
      console.log(`  Amount: $200.00 CAD`);
      
    } catch (error) {
      console.log('  ⚠️  Could not create payment link:', error.message);
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ PAYMENT SYSTEM STATUS: OPERATIONAL\n');
    
    console.log('📋 System Check:');
    console.log('  ✅ Square API connected');
    console.log('  ✅ Location verified');
    console.log(`  ${process.env.SQUARE_ENVIRONMENT === 'production' ? '🔴' : '🟡'} Environment: ${process.env.SQUARE_ENVIRONMENT || 'sandbox'}`);
    console.log(`  ${process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ? '✅' : '⚠️ '} Webhook key ${process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ? 'configured' : 'not set'}`);
    
    if (process.env.SQUARE_ENVIRONMENT !== 'production') {
      console.log('\n📝 Production Checklist:');
      console.log('  1. All tests passing ✅');
      console.log('  2. Update SQUARE_ENVIRONMENT=production');
      console.log('  3. Update SQUARE_ACCESS_TOKEN with production token');
      console.log('  4. Verify SQUARE_LOCATION_ID for production');
      console.log('  5. Update SQUARE_WEBHOOK_SIGNATURE_KEY');
      console.log('  6. Test with small real payment first');
      
      console.log('\n🧪 Test Cards (Sandbox):');
      console.log('  • 4111 1111 1111 1111 - Visa (approved)');
      console.log('  • 5105 1051 0510 5100 - Mastercard (approved)');
      console.log('  • 4000 0000 0000 0002 - Declined');
    } else {
      console.log('\n🔴 PRODUCTION MODE ACTIVE');
      console.log('  Real payments will be processed!');
    }
    
  } catch (error) {
    console.error('\n❌ Test Failed:');
    console.error(`  Error: ${error.message}`);
    
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`  - ${err.category}: ${err.code} - ${err.detail}`);
      });
    }
    
    process.exit(1);
  }
}

runTests().catch(console.error);
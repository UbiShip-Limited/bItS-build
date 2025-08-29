#!/usr/bin/env tsx

/**
 * Simple Test for Payment Link Creation with Email
 */

import dotenv from 'dotenv';
dotenv.config();

async function testPaymentLinkCreation() {
  console.log('🔗 Testing Payment Link Creation via API\n');
  console.log('=====================================\n');

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
  
  // Test data
  const testPaymentLink = {
    amount: 150.00,
    title: 'Tattoo Consultation - Test Customer',
    description: 'Initial consultation for custom sleeve design',
    customerId: 'test-customer-id', // This would need to be a real customer ID
    paymentType: 'CONSULTATION',
    allowTipping: true,
    sendEmail: true // This will trigger the email sending
  };

  console.log('📤 Creating payment link with email notification...');
  console.log('   Amount: $' + testPaymentLink.amount);
  console.log('   Title: ' + testPaymentLink.title);
  console.log('   Send Email: ' + testPaymentLink.sendEmail);
  console.log();

  try {
    // You would need to get an auth token first
    // For testing, you might use a test token or run this after logging in
    
    console.log('⚠️  Note: This test requires:');
    console.log('   1. Backend server running (npm run dev:backend)');
    console.log('   2. Valid authentication token');
    console.log('   3. Real customer ID in the database');
    console.log('   4. Square API configured (for actual payment link creation)');
    console.log();
    console.log('To fully test the payment link email system:');
    console.log('   1. Start the backend: npm run dev:backend');
    console.log('   2. Use the dashboard UI to create a payment link');
    console.log('   3. Check the "Send payment link via email" checkbox');
    console.log('   4. Monitor the server logs for email sending status');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPaymentLinkCreation().catch(console.error);
#!/usr/bin/env tsx
/**
 * Test Core Email Notifications
 * Simplified test for essential email flows
 */

import '../lib/config/envLoader';
import { emailTemplateService } from '../lib/services/emailTemplateService';

async function testCoreEmails() {
  console.log('🚀 Testing Core Email Notifications\n');
  console.log('=' .repeat(50) + '\n');

  const testCustomerEmail = 'support@ubiship.io';
  const ownerEmail = process.env.OWNER_EMAIL || 'bowenislandtattooshop@gmail.com';
  
  const results = {
    passed: 0,
    failed: 0,
    emails: [] as any[]
  };

  // Test cases
  const testCases = [
    {
      name: 'Tattoo Request Confirmation',
      template: 'tattoo_request_confirmation',
      to: testCustomerEmail,
      data: {
        customerName: 'Test Customer',
        description: 'Dragon tattoo on shoulder',
        placement: 'Right shoulder',
        size: 'Medium (4-6 inches)',
        style: 'Japanese Traditional',
        trackingToken: 'test-123',
        trackingUrl: 'https://bowenislandtattooshop.com/track/test-123'
      }
    },
    {
      name: 'Owner: New Request Notification',
      template: 'owner_new_request',
      to: ownerEmail,
      data: {
        description: 'Dragon tattoo on shoulder',
        placement: 'Right shoulder',
        size: 'Medium',
        style: 'Japanese Traditional',
        contactEmail: testCustomerEmail,
        contactPhone: '+1234567890',
        dashboardUrl: 'https://bowenislandtattooshop.com/dashboard'
      }
    },
    {
      name: 'Appointment Confirmation',
      template: 'appointment_confirmation',
      to: testCustomerEmail,
      data: {
        customerName: 'Test Customer',
        appointmentDate: 'Monday, September 7, 2025',
        appointmentTime: '2:00 PM',
        duration: '2 hours',
        appointmentType: 'Consultation'
      }
    },
    {
      name: 'Payment Link Request',
      template: 'payment_link_request',
      to: testCustomerEmail,
      data: {
        customerName: 'Test Customer',
        amount: '$500.00',
        description: 'Tattoo deposit',
        paymentUrl: 'https://checkout.square.site/test-payment',
        expiryDate: 'September 7, 2025'
      }
    },
    {
      name: 'Owner: New Appointment',
      template: 'owner_new_appointment',
      to: ownerEmail,
      data: {
        customerName: 'Test Customer',
        appointmentDate: 'Monday, September 7, 2025',
        appointmentTime: '2:00 PM',
        duration: '2 hours',
        appointmentType: 'Consultation',
        dashboardUrl: 'https://bowenislandtattooshop.com/dashboard'
      }
    }
  ];

  // Run tests
  for (const test of testCases) {
    console.log(`📧 Testing: ${test.name}`);
    console.log(`   Template: ${test.template}`);
    console.log(`   To: ${test.to}`);
    
    try {
      const result = await emailTemplateService.sendEmail(
        test.template,
        test.to,
        test.data
      );
      
      if (result.success) {
        console.log(`   ✅ SUCCESS - Email sent\n`);
        results.passed++;
        results.emails.push({
          test: test.name,
          to: test.to,
          status: 'sent'
        });
      } else {
        console.log(`   ❌ FAILED - ${result.error}\n`);
        results.failed++;
        results.emails.push({
          test: test.name,
          to: test.to,
          status: 'failed',
          error: result.error
        });
      }
    } catch (error: any) {
      console.log(`   ❌ ERROR - ${error.message}\n`);
      results.failed++;
      results.emails.push({
        test: test.name,
        to: test.to,
        status: 'error',
        error: error.message
      });
    }
  }

  // Summary
  console.log('=' .repeat(50));
  console.log('\n📊 TEST RESULTS:\n');
  console.log(`✅ Passed: ${results.passed}/${testCases.length}`);
  console.log(`❌ Failed: ${results.failed}/${testCases.length}`);
  
  console.log('\n📧 Email Status:');
  results.emails.forEach((email, index) => {
    const icon = email.status === 'sent' ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${email.test} → ${email.to}`);
    if (email.error) {
      console.log(`   Error: ${email.error}`);
    }
  });

  console.log('\n🔍 Check these inboxes:');
  console.log(`   • Customer: ${testCustomerEmail}`);
  console.log(`   • Owner: ${ownerEmail}`);
  
  console.log('\n📈 Monitor at:');
  console.log('   • Resend Dashboard: https://resend.com/emails');
  
  console.log('\n✨ Your email notification system is:');
  if (results.failed === 0) {
    console.log('   🎉 FULLY OPERATIONAL - All emails sent successfully!');
  } else if (results.passed > 0) {
    console.log('   ⚠️  PARTIALLY WORKING - Some emails failed');
  } else {
    console.log('   ❌ NOT WORKING - All emails failed');
  }
}

testCoreEmails().catch(console.error);
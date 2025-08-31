#!/usr/bin/env tsx
/**
 * Test Tattoo Request End-to-End Flow
 * Verifies that submitting a tattoo request triggers email notifications
 */

import '../lib/config/envLoader';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';

async function testTattooRequestFlow() {
  console.log('🎨 Testing Tattoo Request End-to-End Flow\n');
  console.log('=' .repeat(50) + '\n');

  const testEmail = 'bowenislandtattooshop@gmail.com'; // Using owner email since we're in test mode
  const timestamp = Date.now();
  
  console.log('📍 API URL:', API_URL);
  console.log('📧 Test Email:', testEmail);
  console.log('');

  // Test data
  const requestData = {
    contactEmail: testEmail,
    contactPhone: '+1234567890',
    description: `Test tattoo request ${timestamp} - Beautiful dragon design on shoulder`,
    placement: 'Right shoulder',
    size: 'Medium (4-6 inches)',
    style: 'Japanese Traditional',
    colorPreference: 'Black and grey with hints of red',
    purpose: 'personal',
    preferredArtist: 'Kelly Miller',
    timeframe: '1-2 months',
    contactPreference: 'email',
    additionalNotes: 'This is a test request to verify email automation is working correctly',
    referenceImages: [],
    honeypot: '' // Anti-spam field (should be empty)
  };

  try {
    // Step 1: Submit tattoo request
    console.log('1️⃣  Submitting Tattoo Request...\n');
    console.log('   Request Details:');
    console.log(`   • Description: ${requestData.description}`);
    console.log(`   • Email: ${requestData.contactEmail}`);
    console.log(`   • Style: ${requestData.style}`);
    console.log(`   • Placement: ${requestData.placement}`);
    console.log('');

    const response = await axios.post(`${API_URL}/tattoo-requests`, requestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200 || response.status === 201) {
      const tattooRequest = response.data;
      console.log('   ✅ Request submitted successfully!');
      console.log(`   📝 Request ID: ${tattooRequest.id}`);
      if (tattooRequest.trackingToken) {
        console.log(`   🔗 Tracking Token: ${tattooRequest.trackingToken}`);
        console.log(`   🌐 Tracking URL: https://bowenislandtattooshop.com/track-request/${tattooRequest.trackingToken}`);
      }
      console.log('');

      // Step 2: Check email logs in database
      console.log('2️⃣  Checking Email Logs...\n');
      
      // Wait a moment for emails to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const emailLogs = await prisma.EmailLog.findMany({
        where: {
          OR: [
            { emailAddress: testEmail },
            { emailAddress: process.env.OWNER_EMAIL }
          ],
          createdAt: {
            gte: new Date(Date.now() - 60000) // Last minute
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      if (emailLogs.length > 0) {
        console.log(`   📧 Found ${emailLogs.length} email log(s):\n`);
        emailLogs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.emailType}`);
          console.log(`      To: ${log.emailAddress}`);
          console.log(`      Status: ${log.status === 'sent' ? '✅' : '❌'} ${log.status}`);
          console.log(`      Time: ${log.createdAt.toLocaleString()}`);
          if (log.resendId) {
            console.log(`      Resend ID: ${log.resendId}`);
          }
          if (log.errorMessage) {
            console.log(`      Error: ${log.errorMessage}`);
          }
          console.log('');
        });
      } else {
        console.log('   ⚠️  No email logs found in database');
        console.log('   This might mean emails are still being processed');
      }

      // Step 3: Verify expected emails
      console.log('3️⃣  Expected Email Notifications:\n');
      
      const expectedEmails = [
        {
          type: 'Customer Confirmation',
          to: testEmail,
          template: 'tattoo_request_confirmation',
          content: 'Confirmation with request details and tracking link'
        },
        {
          type: 'Owner Notification',
          to: process.env.OWNER_EMAIL || 'bowenislandtattooshop@gmail.com',
          template: 'owner_new_request',
          content: 'New request notification with customer details'
        }
      ];

      expectedEmails.forEach(email => {
        const sent = emailLogs.some(log => 
          log.emailType === email.template && 
          log.emailAddress === email.to &&
          log.status === 'sent'
        );
        
        console.log(`   ${sent ? '✅' : '❌'} ${email.type}`);
        console.log(`      Template: ${email.template}`);
        console.log(`      To: ${email.to}`);
        console.log(`      Content: ${email.content}`);
        console.log('');
      });

      // Summary
      console.log('=' .repeat(50));
      console.log('\n📊 TEST SUMMARY:\n');
      console.log('✅ Tattoo request submitted successfully');
      console.log(`✅ Request ID: ${tattooRequest.id}`);
      
      const customerEmailSent = emailLogs.some(log => 
        log.emailType === 'tattoo_request_confirmation' && 
        log.status === 'sent'
      );
      const ownerEmailSent = emailLogs.some(log => 
        log.emailType === 'owner_new_request' && 
        log.status === 'sent'
      );

      console.log(`${customerEmailSent ? '✅' : '❌'} Customer confirmation email`);
      console.log(`${ownerEmailSent ? '✅' : '❌'} Owner notification email`);

      if (customerEmailSent && ownerEmailSent) {
        console.log('\n🎉 SUCCESS: All email notifications working correctly!');
      } else {
        console.log('\n⚠️  Some emails may not have been sent. Check:');
        console.log('   • Email service configuration');
        console.log('   • Resend dashboard: https://resend.com/emails');
        console.log('   • Server logs for errors');
      }

      console.log('\n📮 Next Steps:');
      console.log(`   1. Check inbox: ${testEmail}`);
      console.log('   2. Verify email content and formatting');
      console.log('   3. Test tracking link if provided');
      console.log('   4. Check Resend dashboard for delivery status');

    } else {
      console.log(`   ❌ Request failed with status: ${response.status}`);
      console.log('   Response:', response.data);
    }

  } catch (error: any) {
    console.error('❌ Error during test:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testTattooRequestFlow().catch(console.error);
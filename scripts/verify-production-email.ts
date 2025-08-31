#!/usr/bin/env tsx
/**
 * Verify Production Email Setup
 * This script tests if your Resend account can send to any email address
 */

import '../lib/config/envLoader';
import { Resend } from 'resend';

async function verifyProductionEmail() {
  console.log('🚀 Verifying Production Email Setup\n');
  console.log('=====================================\n');

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'bowenislandtattooshop@gmail.com';
  const ownerEmail = process.env.OWNER_EMAIL || 'bowenislandtattooshop@gmail.com';

  if (!apiKey) {
    console.log('❌ RESEND_API_KEY not found in environment variables');
    return;
  }

  const resend = new Resend(apiKey);
  console.log('📧 Configuration:');
  console.log(`   FROM: ${fromEmail}`);
  console.log(`   OWNER: ${ownerEmail}`);
  console.log(`   API Key: ${apiKey.substring(0, 15)}...`);
  console.log('');

  // Test emails to send
  const testEmails = [
    { email: ownerEmail, description: 'Owner email (always works)' },
    { email: 'support@ubiship.io', description: 'External email (requires production)' },
    { email: 'test@example.com', description: 'Test email (requires production)' }
  ];

  console.log('🧪 Testing email delivery:\n');

  for (const test of testEmails) {
    console.log(`📨 Sending to ${test.email} (${test.description})...`);
    
    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to: test.email,
        subject: 'Bowen Island Tattoo Shop - Production Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>🎨 Production Email Test</h2>
            <p>This is a test email from your Bowen Island Tattoo Shop system.</p>
            <hr>
            <p><strong>Test Details:</strong></p>
            <ul>
              <li>Sent to: ${test.email}</li>
              <li>From: ${fromEmail}</li>
              <li>Time: ${new Date().toLocaleString()}</li>
            </ul>
            <hr>
            <p style="color: #666; font-size: 12px;">
              If you received this email, your production setup is working correctly!
            </p>
          </div>
        `
      });

      if (result.data?.id) {
        console.log(`   ✅ SUCCESS! Email ID: ${result.data.id}`);
      } else if (result.error) {
        console.log(`   ❌ FAILED: ${result.error.message || JSON.stringify(result.error)}`);
      }
    } catch (error: any) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    console.log('');
  }

  console.log('📊 Results Summary:\n');
  console.log('🔍 Check your email inboxes:');
  console.log(`   • Owner: ${ownerEmail}`);
  console.log('   • Test: support@ubiship.io');
  console.log('');
  console.log('📈 Monitor in Resend Dashboard:');
  console.log('   • View sent emails: https://resend.com/emails');
  console.log('   • Check domain status: https://resend.com/domains');
  console.log('   • Billing/Plan: https://resend.com/settings/billing');
  console.log('');
  
  console.log('⚡ Production Status:');
  console.log('   If emails to external addresses (support@ubiship.io) succeed:');
  console.log('   ✅ Your account is in PRODUCTION mode!');
  console.log('');
  console.log('   If only bowenislandtattooshop@gmail.com works:');
  console.log('   ⚠️  Your account is still in TEST mode');
  console.log('   👉 Go to: https://resend.com/settings/billing to upgrade');
  console.log('   👉 Or verify domain at: https://resend.com/domains');
}

verifyProductionEmail().catch(console.error);
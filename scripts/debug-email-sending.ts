#!/usr/bin/env tsx
/**
 * Debug email sending configuration
 * Run with: npx tsx scripts/debug-email-sending.ts
 */

// Load environment variables first
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { Resend } from 'resend';

async function debugEmailSending() {
  console.log('🔍 Email Configuration Debug\n');
  console.log('=' .repeat(50));
  
  // Check environment
  console.log('📋 Environment Variables:');
  console.log('-------------------------');
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'Using default: noreply@bowenislandtattoo.com');
  console.log('EMAIL_ENABLED:', process.env.EMAIL_ENABLED !== 'false' ? '✅ Enabled' : '❌ Disabled');
  
  if (!process.env.RESEND_API_KEY) {
    console.log('\n❌ Cannot send emails without RESEND_API_KEY');
    return;
  }
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.EMAIL_FROM || 'noreply@bowenislandtattoo.com';
  
  console.log('\n📧 Testing Direct Email Send:');
  console.log('-----------------------------');
  console.log('From:', fromEmail);
  console.log('To: max.md.bosch@gmail.com');
  
  try {
    // Try sending a simple test email
    const result = await resend.emails.send({
      from: fromEmail,
      to: 'max.md.bosch@gmail.com',
      subject: 'Test Email from Bowen Island Tattoo Shop',
      text: `This is a test email to verify your email configuration.

If you receive this email, your Resend configuration is working correctly!

Sent at: ${new Date().toISOString()}
From address: ${fromEmail}

Note: If this email doesn't arrive, check:
1. Is the domain verified in Resend?
2. Check Resend dashboard for failed emails
3. Try using 'onboarding@resend.dev' as the from address`,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C9A449;">Test Email from Bowen Island Tattoo Shop</h2>
        <p>This is a test email to verify your email configuration.</p>
        <p style="background: #f0f0f0; padding: 10px; border-radius: 5px;">
          <strong>If you receive this email, your Resend configuration is working correctly!</strong>
        </p>
        <hr style="border: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          Sent at: ${new Date().toISOString()}<br>
          From address: ${fromEmail}
        </p>
        <p style="font-size: 12px; color: #666;">
          <strong>Note:</strong> If this email doesn't arrive, check:<br>
          1. Is the domain verified in Resend?<br>
          2. Check Resend dashboard for failed emails<br>
          3. Try using 'onboarding@resend.dev' as the from address
        </p>
      </div>`
    });
    
    console.log('\n✅ Email API call succeeded!');
    console.log('Full response:', JSON.stringify(result, null, 2));
    console.log('Email ID:', result.data?.id || result.id || 'No ID returned');
    console.log('\n📬 Next steps:');
    console.log('1. Check your inbox at: max.md.bosch@gmail.com');
    console.log('2. Check spam/junk folder');
    console.log('3. Check Resend dashboard at https://resend.com/emails');
    console.log('   Look for the email status there');
    
    if (!result.data?.id && !result.id) {
      console.log('\n⚠️  Warning: No email ID returned.');
      console.log('This might indicate the email was queued but not sent.');
    }
    
  } catch (error) {
    console.log('\n❌ Failed to send email!');
    console.log('Error:', error.message);
    
    if (error.message.includes('domain')) {
      console.log('\n🔧 SOLUTION:');
      console.log('1. The domain in your FROM address is not verified in Resend');
      console.log('2. Quick fix: Set EMAIL_FROM to use Resend\'s test domain:');
      console.log('   EMAIL_FROM="Bowen Island Tattoo <onboarding@resend.dev>"');
      console.log('3. Or verify bowenislandtattoo.com in your Resend dashboard');
    }
  }
  
  // Test with Resend's domain
  if (fromEmail.includes('bowenislandtattoo.com')) {
    console.log('\n🔄 Retrying with Resend test domain...');
    console.log('-------------------------------------');
    
    try {
      const testResult = await resend.emails.send({
        from: 'Bowen Island Tattoo <onboarding@resend.dev>',
        to: 'max.md.bosch@gmail.com',
        subject: 'Test Email (Using Resend Domain)',
        text: 'This test email uses Resend\'s verified domain. If you receive this but not the previous one, you need to verify your domain or change EMAIL_FROM.',
      });
      
      console.log('✅ Test email sent with Resend domain!');
      console.log('Email ID:', testResult.data?.id);
      console.log('\nIf you receive this email but not the first one,');
      console.log('set EMAIL_FROM="Bowen Island Tattoo <onboarding@resend.dev>"');
      
    } catch (error) {
      console.log('❌ Failed even with Resend domain:', error.message);
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 RECOMMENDATIONS:');
  console.log('-------------------');
  console.log('For testing/development:');
  console.log('  EMAIL_FROM="Bowen Island Tattoo <onboarding@resend.dev>"');
  console.log('\nFor production:');
  console.log('  1. Verify bowenislandtattoo.com in Resend dashboard');
  console.log('  2. Add DNS records as instructed by Resend');
  console.log('  3. Use EMAIL_FROM="noreply@bowenislandtattoo.com"');
}

// Run debug
debugEmailSending()
  .catch(error => {
    console.error('Debug script failed:', error);
    process.exit(1);
  });
#!/usr/bin/env tsx
/**
 * Test tattoo request email sending directly
 */

import '../lib/config/envLoader';
import { emailService } from '../lib/services/emailService';
import { emailTemplateService } from '../lib/services/emailTemplateService';
import { CommunicationService } from '../lib/services/communicationService';
import { RealtimeService } from '../lib/services/realtimeService';

async function testTattooRequestEmail() {
  console.log('🧪 Testing Tattoo Request Email Flow\n');
  console.log('=' .repeat(50));
  
  // 1. Test EmailService directly
  console.log('1️⃣  Testing EmailService:');
  console.log(`   Enabled: ${emailService.isEnabled()}`);
  console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM}`);
  console.log(`   OWNER_EMAIL: ${process.env.OWNER_EMAIL}`);
  
  if (!emailService.isEnabled()) {
    console.log('   ❌ EmailService is DISABLED - this is the problem!');
    console.log('   Check these environment variables:');
    console.log('   - RESEND_API_KEY: ' + (process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set'));
    console.log('   - EMAIL_ENABLED: ' + (process.env.EMAIL_ENABLED || 'Not set (should default to true)'));
    return;
  }
  
  // 2. Test direct email sending
  console.log('\n2️⃣  Testing Direct Email Send:');
  try {
    const result = await emailService.send({
      to: 'bowenislandtattooshop@gmail.com',
      subject: 'Test Email - Tattoo Request System',
      text: 'This is a test email to verify the tattoo request email system is working.',
      html: '<p>This is a test email to verify the tattoo request email system is working.</p>'
    });
    
    if (result.success) {
      console.log('   ✅ Direct email send successful!');
      console.log('   📧 Email ID:', result.id);
    } else {
      console.log('   ❌ Direct email send failed:', result.error);
      return;
    }
  } catch (error) {
    console.log('   ❌ Direct email send error:', error.message);
    return;
  }
  
  // 3. Test email template service
  console.log('\n3️⃣  Testing Email Template Service:');
  try {
    const result = await emailTemplateService.sendEmail(
      'tattoo_request_confirmation',
      'bowenislandtattooshop@gmail.com',
      {
        customerName: 'Test Customer',
        description: 'Test tattoo description',
        placement: 'Arm',
        size: 'Medium',
        style: 'Traditional',
        preferredArtist: 'Any artist',
        trackingToken: 'test-token-123',
        trackingUrl: 'https://example.com/track/test-token-123'
      }
    );
    
    if (result.success) {
      console.log('   ✅ Template email send successful!');
    } else {
      console.log('   ❌ Template email send failed:', result.error);
    }
  } catch (error) {
    console.log('   ❌ Template email error:', error.message);
  }
  
  // 4. Test CommunicationService
  console.log('\n4️⃣  Testing CommunicationService:');
  try {
    const realtimeService = new RealtimeService();
    const communicationService = new CommunicationService(realtimeService, emailService);
    
    // Mock tattoo request object
    const mockTattooRequest = {
      id: 'test-request-123',
      customerId: null,
      contactEmail: 'bowenislandtattooshop@gmail.com',
      firstName: 'Test',
      description: 'Test tattoo description',
      placement: 'Arm',
      size: 'Medium',
      style: 'Traditional',
      preferredArtist: 'Any artist',
      trackingToken: 'test-token-123',
      customer: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'new',
      colorPreference: null,
      referenceImages: [],
      additionalNotes: null,
      contactPhone: null,
      contactPreference: null,
      purpose: null,
      timeframe: null,
      depositAmount: null,
      depositPaid: false,
      finalAmount: null,
      paymentId: null
    };
    
    // Test customer confirmation email
    console.log('   📧 Testing customer confirmation email...');
    const customerResult = await communicationService.sendTattooRequestConfirmation(mockTattooRequest);
    if (customerResult.success) {
      console.log('   ✅ Customer confirmation email sent!');
    } else {
      console.log('   ❌ Customer confirmation failed:', customerResult.error);
    }
    
    // Test owner notification email
    console.log('   📧 Testing owner notification email...');
    const ownerResult = await communicationService.sendOwnerNewRequestNotification(mockTattooRequest);
    if (ownerResult.success) {
      console.log('   ✅ Owner notification email sent!');
    } else {
      console.log('   ❌ Owner notification failed:', ownerResult.error);
    }
    
  } catch (error) {
    console.log('   ❌ CommunicationService error:', error.message);
  }
  
  console.log('\n🎉 Test complete! Check your inbox for test emails.');
}

// Run test
testTattooRequestEmail()
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
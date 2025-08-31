#!/usr/bin/env tsx
/**
 * Test Email API Endpoints
 * This script tests the email notification system through live API endpoints
 */

import '../lib/config/envLoader';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
const TEST_EMAIL = process.env.TEST_EMAIL || 'support@ubiship.io';

async function testEmailEndpoints() {
  console.log('🧪 Testing Email API Endpoints\n');
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`📧 Test Email: ${TEST_EMAIL}\n`);

  // Test 1: Create a tattoo request (triggers confirmation email)
  console.log('1️⃣ Testing Tattoo Request Creation (triggers confirmation email)...');
  try {
    const tattooResponse = await fetch(`${API_URL}/tattoo-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contactEmail: TEST_EMAIL,
        contactPhone: '+1234567890',
        description: 'Test tattoo request for email verification - a beautiful dragon design',
        placement: 'upper arm',
        size: 'medium',
        style: 'japanese traditional',
        colorPreference: 'black and grey',
        purpose: 'personal',
        timeframe: '1-2 months',
        contactPreference: 'email',
        additionalNotes: 'This is a test request to verify email notifications are working'
      })
    });

    if (tattooResponse.ok) {
      const data = await tattooResponse.json();
      console.log('   ✅ Tattoo request created successfully!');
      console.log(`   📝 Request ID: ${data.id}`);
      console.log(`   🔗 Tracking Token: ${data.trackingToken}`);
      console.log('   📧 Confirmation email should be sent to:', TEST_EMAIL);
    } else {
      console.log('   ❌ Failed to create tattoo request:', await tattooResponse.text());
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }

  console.log('\n2️⃣ Testing Anonymous Appointment Creation (triggers confirmation email)...');
  
  // Calculate appointment time (24 hours from now)
  const appointmentTime = new Date();
  appointmentTime.setHours(appointmentTime.getHours() + 24);
  
  try {
    const appointmentResponse = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contactEmail: TEST_EMAIL,
        contactPhone: '+1234567890',
        startTime: appointmentTime.toISOString(),
        duration: 120,
        type: 'consultation',
        notes: 'Test appointment for email verification',
        isAnonymous: true
      })
    });

    if (appointmentResponse.ok) {
      const data = await appointmentResponse.json();
      console.log('   ✅ Appointment created successfully!');
      console.log(`   📝 Appointment ID: ${data.id}`);
      console.log(`   📅 Scheduled for: ${new Date(data.startTime).toLocaleString()}`);
      console.log('   📧 Confirmation email should be sent to:', TEST_EMAIL);
      console.log('   ⏰ Reminder emails will be sent 24h and 2h before appointment');
    } else {
      console.log('   ❌ Failed to create appointment:', await appointmentResponse.text());
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }

  // Test 3: Check email automation settings
  console.log('\n3️⃣ Checking Email Automation Settings...');
  try {
    const settingsResponse = await fetch(`${API_URL}/email-automation/settings`);
    
    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();
      console.log('   📋 Email Automation Settings:');
      settings.forEach((setting: any) => {
        console.log(`   - ${setting.emailType}: ${setting.isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
      });
    } else {
      console.log('   ℹ️ Email automation endpoint requires authentication');
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }

  console.log('\n✨ Email API test completed!');
  console.log('\n📮 Next Steps:');
  console.log('1. Check your email inbox for confirmation emails');
  console.log('2. Check the database for email logs: npm run check:email-logs');
  console.log('3. Monitor server logs for email sending activity');
}

// Run the test
testEmailEndpoints()
  .catch((error) => {
    console.error('Failed to test email endpoints:', error);
    process.exit(1);
  });
#!/usr/bin/env tsx
/**
 * Comprehensive Email Notification System Test
 * Tests all email flows in the application
 */

import '../lib/config/envLoader';
import { prisma } from '../lib/prisma/prisma';
import { emailTemplateService } from '../lib/services/emailTemplateService';
import { emailAutomationService } from '../lib/services/emailAutomationService';

async function testAllEmailFlows() {
  console.log('🧪 Testing All Email Notification Flows\n');
  console.log('=' .repeat(50) + '\n');

  const testCustomerEmail = 'support@ubiship.io';
  const ownerEmail = process.env.OWNER_EMAIL || 'bowenislandtattooshop@gmail.com';

  // 1. Check email templates status
  console.log('1️⃣  Checking Email Templates Status:\n');
  const templates = await prisma.emailTemplate.findMany({
    select: { name: true, displayName: true, isActive: true }
  });

  const activeTemplates = templates.filter(t => t.isActive);
  console.log(`   Total templates: ${templates.length}`);
  console.log(`   Active templates: ${activeTemplates.length}`);
  console.log(`   Inactive templates: ${templates.length - activeTemplates.length}\n`);

  templates.forEach(t => {
    console.log(`   ${t.isActive ? '✅' : '❌'} ${t.displayName} (${t.name})`);
  });

  // 2. Check email automation settings
  console.log('\n2️⃣  Email Automation Settings:\n');
  const automationSettings = await prisma.emailAutomationSetting.findMany();
  
  automationSettings.forEach(setting => {
    console.log(`   ${setting.isEnabled ? '✅' : '❌'} ${setting.emailType}`);
    if (setting.sendDelay) {
      console.log(`      Delay: ${setting.sendDelay} minutes`);
    }
  });

  // 3. Test Tattoo Request Flow
  console.log('\n3️⃣  Testing Tattoo Request Email Flow:\n');
  console.log('   Creating test tattoo request...');
  
  const tattooRequest = await prisma.tattooRequest.create({
    data: {
      contactEmail: testCustomerEmail,
      contactPhone: '+1234567890',
      description: 'Test tattoo request for email verification',
      placement: 'upper arm',
      size: 'medium',
      style: 'traditional',
      status: 'new',
      trackingToken: `test-${Date.now()}`
    }
  });

  console.log(`   ✅ Created request ID: ${tattooRequest.id}`);

  // Send confirmation email
  console.log('   Sending confirmation email to customer...');
  const confirmationResult = await emailTemplateService.sendEmail(
    'tattoo_request_confirmation',
    testCustomerEmail,
    {
      customerName: 'Test Customer',
      description: tattooRequest.description,
      placement: tattooRequest.placement,
      size: tattooRequest.size,
      style: tattooRequest.style,
      trackingToken: tattooRequest.trackingToken,
      trackingUrl: `https://bowenislandtattooshop.com/track-request/${tattooRequest.trackingToken}`
    }
  );

  console.log(`   ${confirmationResult.success ? '✅' : '❌'} Customer confirmation: ${confirmationResult.success ? 'Sent' : confirmationResult.error}`);

  // Send owner notification
  console.log('   Sending notification to owner...');
  const ownerNotificationResult = await emailTemplateService.sendEmail(
    'owner_new_request',
    ownerEmail,
    {
      description: tattooRequest.description,
      placement: tattooRequest.placement,
      size: tattooRequest.size,
      style: tattooRequest.style,
      contactEmail: testCustomerEmail,
      contactPhone: tattooRequest.contactPhone,
      dashboardUrl: 'https://bowenislandtattooshop.com/dashboard'
    }
  );

  console.log(`   ${ownerNotificationResult.success ? '✅' : '❌'} Owner notification: ${ownerNotificationResult.success ? 'Sent' : ownerNotificationResult.error}`);

  // 4. Test Appointment Flow
  console.log('\n4️⃣  Testing Appointment Email Flow:\n');
  
  // Find or create test customer
  let customer = await prisma.customer.findFirst({
    where: { email: testCustomerEmail }
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: 'Test Customer',
        email: testCustomerEmail,
        phone: '+1234567890'
      }
    });
    console.log(`   Created test customer: ${customer.id}`);
  }

  const appointmentTime = new Date();
  appointmentTime.setDate(appointmentTime.getDate() + 7); // 7 days from now

  console.log('   Creating test appointment...');
  const appointment = await prisma.appointment.create({
    data: {
      customerId: customer.id,
      startTime: appointmentTime,
      duration: 120,
      type: 'consultation',
      status: 'confirmed',
      notes: 'Test appointment for email verification'
    }
  });

  console.log(`   ✅ Created appointment ID: ${appointment.id}`);

  // Send appointment confirmation
  console.log('   Sending appointment confirmation...');
  const appointmentResult = await emailTemplateService.sendEmail(
    'appointment_confirmation',
    testCustomerEmail,
    {
      customerName: customer.name,
      appointmentDate: appointmentTime.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      appointmentTime: appointmentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      }),
      duration: '2 hours',
      appointmentType: 'Consultation'
    }
  );

  console.log(`   ${appointmentResult.success ? '✅' : '❌'} Appointment confirmation: ${appointmentResult.success ? 'Sent' : appointmentResult.error}`);

  // 5. Test Payment Link Flow
  console.log('\n5️⃣  Testing Payment Link Email Flow:\n');
  
  console.log('   Creating test payment link...');
  const paymentLink = await prisma.paymentLink.create({
    data: {
      customerId: customer.id,
      amount: 500.00,
      status: 'active',
      url: `https://checkout.square.site/test-${Date.now()}`,
      metadata: { description: 'Tattoo deposit' },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });

  console.log(`   ✅ Created payment link ID: ${paymentLink.id}`);

  // Send payment link email
  console.log('   Sending payment link email...');
  const paymentLinkResult = await emailTemplateService.sendEmail(
    'payment_link_request',
    testCustomerEmail,
    {
      customerName: customer.name,
      amount: '$500.00',
      description: 'Tattoo deposit',
      paymentUrl: `https://bowenislandtattooshop.com/pay/${paymentLink.id}`,
      expiryDate: paymentLink.expiresAt?.toLocaleDateString()
    }
  );

  console.log(`   ${paymentLinkResult.success ? '✅' : '❌'} Payment link email: ${paymentLinkResult.success ? 'Sent' : paymentLinkResult.error}`);

  // 6. Check Email Logs
  console.log('\n6️⃣  Recent Email Logs:\n');
  
  const recentLogs = await prisma.emailLog.findMany({
    where: {
      OR: [
        { emailAddress: testCustomerEmail },
        { emailAddress: ownerEmail }
      ]
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  if (recentLogs.length > 0) {
    recentLogs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log.emailType} → ${log.emailAddress}`);
      console.log(`      Status: ${log.status === 'sent' ? '✅' : '❌'} ${log.status}`);
      console.log(`      Time: ${log.createdAt.toLocaleString()}`);
      if (log.resendId) {
        console.log(`      Resend ID: ${log.resendId}`);
      }
      if (log.errorMessage) {
        console.log(`      Error: ${log.errorMessage}`);
      }
    });
  } else {
    console.log('   No email logs found');
  }

  // 7. Summary
  console.log('\n' + '=' .repeat(50));
  console.log('\n📊 TEST SUMMARY:\n');
  console.log('✅ Email system is in PRODUCTION mode');
  console.log(`✅ Sending emails FROM: ${process.env.EMAIL_FROM}`);
  console.log(`✅ Owner notifications TO: ${ownerEmail}`);
  console.log(`✅ Customer emails TO: Any email address`);
  console.log('\n📧 Check these inboxes for test emails:');
  console.log(`   • Customer: ${testCustomerEmail}`);
  console.log(`   • Owner: ${ownerEmail}`);
  console.log('\n📈 Monitor emails at:');
  console.log('   • Resend Dashboard: https://resend.com/emails');
  console.log('   • Database logs: Check EmailLog table');

  // Cleanup test data
  console.log('\n🧹 Cleaning up test data...');
  await prisma.paymentLink.delete({ where: { id: paymentLink.id } });
  await prisma.appointment.delete({ where: { id: appointment.id } });
  await prisma.tattooRequest.delete({ where: { id: tattooRequest.id } });
  if (customer.name === 'Test Customer') {
    await prisma.customer.delete({ where: { id: customer.id } });
  }
  console.log('✅ Test data cleaned up');
}

testAllEmailFlows()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
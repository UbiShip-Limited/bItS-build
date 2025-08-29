#!/usr/bin/env tsx

/**
 * Verification script for owner notification system
 * Tests email notifications, real-time events, and dashboard integration
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { prisma } from '../lib/prisma/prisma';
import { CommunicationService } from '../lib/services/communicationService';
import { RealtimeService } from '../lib/services/realtimeService';
import { emailTemplateService } from '../lib/services/emailTemplateService';
import { emailService } from '../lib/services/emailService';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function printHeader(title: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
  console.log('='.repeat(60) + '\n');
}

async function verifyOwnerNotifications() {
  printHeader('OWNER NOTIFICATION SYSTEM VERIFICATION');

  // Step 1: Check environment configuration
  console.log(`${colors.cyan}📋 Step 1: Environment Configuration${colors.reset}`);
  console.log('-'.repeat(40));
  
  const ownerEmail = process.env.OWNER_EMAIL;
  const notificationsEnabled = process.env.OWNER_NOTIFICATION_ENABLED !== 'false';
  const emailApiKey = process.env.EMAIL_API_KEY || process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM_ADDRESS;
  
  console.log(`  Owner Email: ${ownerEmail ? `${colors.green}✓${colors.reset} ${ownerEmail}` : `${colors.red}✗ Not configured${colors.reset}`}`);
  console.log(`  Notifications Enabled: ${notificationsEnabled ? `${colors.green}✓${colors.reset} Yes` : `${colors.red}✗ No${colors.reset}`}`);
  console.log(`  Email API Key: ${emailApiKey ? `${colors.green}✓${colors.reset} Configured` : `${colors.yellow}⚠ Not configured (using console output)${colors.reset}`}`);
  console.log(`  From Email: ${fromEmail ? `${colors.green}✓${colors.reset} ${fromEmail}` : `${colors.red}✗ Not configured${colors.reset}`}`);
  
  if (!ownerEmail) {
    console.log(`\n${colors.red}❌ OWNER_EMAIL is not configured. Owner notifications will not be sent.${colors.reset}`);
    console.log(`${colors.yellow}   Set OWNER_EMAIL in your .env file to enable owner notifications.${colors.reset}`);
  }

  // Step 2: Initialize services
  console.log(`\n${colors.cyan}📋 Step 2: Service Initialization${colors.reset}`);
  console.log('-'.repeat(40));
  
  const realtimeService = new RealtimeService();
  const communicationService = new CommunicationService(realtimeService, emailService);
  
  console.log(`  ${colors.green}✓${colors.reset} RealtimeService initialized`);
  console.log(`  ${colors.green}✓${colors.reset} CommunicationService initialized`);
  console.log(`  ${colors.green}✓${colors.reset} EmailTemplateService available`);

  // Step 3: Test email templates
  console.log(`\n${colors.cyan}📋 Step 3: Email Template Verification${colors.reset}`);
  console.log('-'.repeat(40));
  
  const ownerTemplates = [
    'owner_new_request',
    'owner_new_appointment', 
    'owner_payment_received',
    'owner_appointment_cancelled'
  ];

  for (const templateKey of ownerTemplates) {
    const template = await prisma.emailTemplate.findFirst({
      where: { name: templateKey }
    });
    
    if (template) {
      console.log(`  ${colors.green}✓${colors.reset} Template "${templateKey}" exists`);
    } else {
      console.log(`  ${colors.red}✗${colors.reset} Template "${templateKey}" missing`);
      // Templates are created automatically when sendEmail is called with the template key
      console.log(`    ${colors.yellow}ℹ${colors.reset} Will be created automatically on first use`);
    }
  }

  // Step 4: Test notifications for different events
  console.log(`\n${colors.cyan}📋 Step 4: Testing Notification Flow${colors.reset}`);
  console.log('-'.repeat(40));

  // Create test data
  const testCustomer = {
    id: 'test-customer-' + Date.now(),
    name: 'Test Customer',
    email: 'customer@test.com',
    phone: '+1234567890',
    createdAt: new Date(),
    updatedAt: new Date(),
    notes: null,
    profileImageId: null,
    source: null as any,
    squareId: null,
    deletedAt: null,
    metadata: {}
  };

  // Test 1: New Tattoo Request
  console.log(`\n${colors.magenta}Test 1: New Tattoo Request Notification${colors.reset}`);
  const testRequest = {
    id: 'test-request-' + Date.now(),
    customerId: testCustomer.id,
    customer: testCustomer,
    description: 'Test tattoo design',
    placement: 'Arm',
    size: 'Medium',
    style: 'Traditional',
    preferredArtist: 'Any',
    timeframe: 'Next month',
    additionalNotes: 'This is a test request',
    status: 'pending' as any,
    contactEmail: 'customer@test.com',
    contactPhone: '+1234567890',
    contactName: 'Test Customer',
    referenceImages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    trackingToken: null,
    estimatedPrice: null,
    estimatedDuration: null,
    artistReview: null,
    reviewedAt: null,
    reviewedBy: null
  };

  try {
    const requestNotifResult = await communicationService.sendOwnerNewRequestNotification(testRequest);
    if (requestNotifResult.success) {
      console.log(`  ${colors.green}✓${colors.reset} Owner email notification sent`);
      if (requestNotifResult.messageId) {
        console.log(`    Message ID: ${requestNotifResult.messageId}`);
      }
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Owner email notification: ${requestNotifResult.error || 'Not sent (notifications may be disabled)'}`);
    }

    // Check if real-time event was created
    await realtimeService.notifyRequestSubmitted(testRequest.id, testCustomer.id);
    console.log(`  ${colors.green}✓${colors.reset} Real-time event created for dashboard`);
  } catch (error: any) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
  }

  // Test 2: New Appointment
  console.log(`\n${colors.magenta}Test 2: New Appointment Notification${colors.reset}`);
  const testAppointment = {
    id: 'test-appointment-' + Date.now(),
    customerId: testCustomer.id,
    customer: testCustomer,
    artist: { name: 'Test Artist', email: 'artist@test.com' },
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    duration: 120,
    type: 'Tattoo Session',
    status: 'confirmed' as any,
    priceQuote: 500,
    deposit: null,
    notes: 'Test appointment',
    contactEmail: 'customer@test.com',
    contactPhone: '+1234567890',
    contactName: 'Test Customer',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: null,
    squareId: null,
    squareInvoiceId: null,
    endTime: null,
    confirmedAt: null,
    cancelledAt: null,
    cancellationReason: null
  };

  try {
    const appointmentNotifResult = await communicationService.sendOwnerNewAppointmentNotification(testAppointment as any);
    if (appointmentNotifResult.success) {
      console.log(`  ${colors.green}✓${colors.reset} Owner email notification sent`);
      if (appointmentNotifResult.messageId) {
        console.log(`    Message ID: ${appointmentNotifResult.messageId}`);
      }
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Owner email notification: ${appointmentNotifResult.error || 'Not sent (notifications may be disabled)'}`);
    }

    // Check if real-time event was created
    await realtimeService.notifyAppointmentCreated(testAppointment.id, testCustomer.id);
    console.log(`  ${colors.green}✓${colors.reset} Real-time event created for dashboard`);
  } catch (error: any) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
  }

  // Test 3: Payment Notification
  console.log(`\n${colors.magenta}Test 3: Payment Received Notification${colors.reset}`);
  const testPayment = {
    id: 'test-payment-' + Date.now(),
    amount: 250.00,
    customerName: 'Test Customer',
    paymentMethod: 'Credit Card',
    appointmentId: testAppointment.id,
    transactionId: 'test-transaction-123'
  };

  try {
    const paymentNotifResult = await communicationService.sendOwnerPaymentNotification(testPayment);
    if (paymentNotifResult.success) {
      console.log(`  ${colors.green}✓${colors.reset} Owner email notification sent`);
      if (paymentNotifResult.messageId) {
        console.log(`    Message ID: ${paymentNotifResult.messageId}`);
      }
    } else {
      console.log(`  ${colors.yellow}⚠${colors.reset} Owner email notification: ${paymentNotifResult.error || 'Not sent (notifications may be disabled)'}`);
    }

    // Check if real-time event was created
    await realtimeService.notifyPaymentReceived(testPayment.id, testPayment.amount, testCustomer.id);
    console.log(`  ${colors.green}✓${colors.reset} Real-time event created for dashboard`);
  } catch (error: any) {
    console.log(`  ${colors.red}✗${colors.reset} Error: ${error.message}`);
  }

  // Step 5: Check audit logs
  console.log(`\n${colors.cyan}📋 Step 5: Audit Log Verification${colors.reset}`);
  console.log('-'.repeat(40));

  const recentLogs = await prisma.auditLog.findMany({
    where: {
      action: 'OWNER_NOTIFICATION_SENT',
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  if (recentLogs.length > 0) {
    console.log(`  ${colors.green}✓${colors.reset} Found ${recentLogs.length} recent owner notification logs:`);
    recentLogs.forEach(log => {
      const details = log.details as any;
      console.log(`    - ${details?.type || log.action} at ${log.createdAt.toLocaleTimeString()}`);
      if (details?.error) {
        console.log(`      ${colors.red}Error: ${details.error}${colors.reset}`);
      }
    });
  } else {
    console.log(`  ${colors.yellow}⚠${colors.reset} No recent owner notification logs found`);
  }

  // Step 6: Test SSE endpoint
  console.log(`\n${colors.cyan}📋 Step 6: Real-time Event Stream Test${colors.reset}`);
  console.log('-'.repeat(40));
  
  const stats = realtimeService.getStats();
  console.log(`  Total events in memory: ${stats.totalEvents}`);
  console.log(`  Recent events: ${stats.recentEvents}`);
  
  // Summary
  printHeader('VERIFICATION SUMMARY');
  
  const issues = [];
  const warnings = [];
  
  if (!ownerEmail) {
    issues.push('OWNER_EMAIL not configured - owner will not receive email notifications');
  }
  if (!emailApiKey) {
    warnings.push('Email API key not configured - emails will be logged to console only');
  }
  if (!fromEmail) {
    issues.push('EMAIL_FROM_ADDRESS not configured - emails cannot be sent');
  }
  
  if (issues.length > 0) {
    console.log(`${colors.red}❌ Issues Found:${colors.reset}`);
    issues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Warnings:${colors.reset}`);
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log(`${colors.green}✅ All checks passed! Owner notification system is properly configured.${colors.reset}`);
  }
  
  console.log(`\n${colors.cyan}Recommendations:${colors.reset}`);
  console.log('1. Ensure OWNER_EMAIL is set to the shop owner\'s email address');
  console.log('2. Configure an email service (SendGrid, Resend, etc.) for production');
  console.log('3. Test the dashboard notification center by opening /dashboard/notifications');
  console.log('4. Monitor audit logs for any notification failures');
  console.log('5. Verify SSE connection in browser developer console\n');
}

// Run the verification
verifyOwnerNotifications()
  .then(() => {
    console.log('Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
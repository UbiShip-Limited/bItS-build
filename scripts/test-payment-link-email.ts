#!/usr/bin/env tsx

/**
 * Test Payment Link Email Sending
 * Tests the complete flow of creating a payment link and sending it via email
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import PaymentLinkService from '../lib/services/paymentLinkService';
import { CommunicationService } from '../lib/services/communicationService';
import { RealtimeService } from '../lib/services/realtimeService';
import { PaymentType } from '../lib/services/paymentService';
import SquareClient from '../lib/square';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function testPaymentLinkEmail() {
  console.log('🔗 Testing Payment Link Email System\n');
  console.log('=====================================\n');

  try {
    // 1. Check email templates exist
    console.log('1️⃣  Checking email templates...');
    const paymentLinkTemplate = await prisma.emailTemplate.findUnique({
      where: { name: 'payment_link_request' }
    });

    if (!paymentLinkTemplate) {
      console.log('❌ Payment link email template not found');
      console.log('   Run: npm run seed:email-templates');
      return;
    }
    console.log('✅ Payment link email template found\n');

    // 2. Find or create test customer
    console.log('2️⃣  Setting up test customer...');
    let testCustomer = await prisma.customer.findFirst({
      where: { email: 'test@example.com' }
    });

    if (!testCustomer) {
      testCustomer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '604-555-0123'
        }
      });
      console.log('   Created test customer');
    }
    console.log(`✅ Using customer: ${testCustomer.name} (${testCustomer.email})\n`);

    // 3. Initialize services
    console.log('3️⃣  Initializing services...');
    const realtimeService = new RealtimeService();
    const communicationService = new CommunicationService(realtimeService);
    
    let squareClient = null;
    try {
      squareClient = SquareClient.fromEnv();
      console.log('✅ Square client initialized\n');
    } catch (error) {
      console.log('⚠️  Square not configured - will test email only\n');
    }

    const paymentLinkService = new PaymentLinkService(
      prisma,
      squareClient,
      communicationService
    );

    // 4. Test email sending directly
    console.log('4️⃣  Testing direct email send...');
    const emailResult = await communicationService.sendPaymentLinkEmail({
      customerId: testCustomer.id,
      customerEmail: testCustomer.email!,
      customerName: testCustomer.name!,
      amount: 150.00,
      title: 'Tattoo Consultation Fee',
      description: 'Initial consultation for custom sleeve design',
      paymentType: 'consultation',
      paymentLink: 'https://checkout.square.site/test-payment-link',
      allowTipping: true,
      appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      appointmentTime: '2:00 PM'
    });

    if (emailResult.success) {
      console.log('✅ Test email sent successfully');
      console.log(`   Message ID: ${emailResult.messageId}\n`);
    } else {
      console.log(`❌ Failed to send test email: ${emailResult.error}\n`);
    }

    // 5. Test payment link creation with email (if Square is configured)
    if (squareClient) {
      console.log('5️⃣  Testing payment link creation with email...');
      try {
        const paymentLinkResult = await paymentLinkService.createPaymentLink({
          amount: 250.00,
          title: 'Tattoo Deposit - Custom Dragon Design',
          description: 'Non-refundable deposit for your custom dragon tattoo',
          customerId: testCustomer.id,
          paymentType: PaymentType.TATTOO_DEPOSIT,
          allowTipping: true,
          sendEmail: true // This triggers the email
        });

        console.log('✅ Payment link created successfully');
        console.log(`   Link URL: ${paymentLinkResult.url}`);
        console.log(`   Link ID: ${paymentLinkResult.paymentLink.id}`);
        console.log('   Email should be sent to customer\n');
      } catch (error: any) {
        console.log(`❌ Failed to create payment link: ${error.message}\n`);
      }
    }

    // 6. Check audit logs
    console.log('6️⃣  Checking audit logs...');
    const recentAudits = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['payment_link_email_sent', 'payment_link_created']
        },
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (recentAudits.length > 0) {
      console.log(`✅ Found ${recentAudits.length} recent audit entries:`);
      recentAudits.forEach(audit => {
        console.log(`   - ${audit.action} at ${audit.createdAt.toLocaleTimeString()}`);
      });
    } else {
      console.log('⚠️  No recent audit logs found');
    }

    console.log('\n=====================================');
    console.log('✨ Payment Link Email Test Complete!\n');

    // Summary
    console.log('📊 Summary:');
    console.log('   - Email template: ✅ Configured');
    console.log(`   - Square integration: ${squareClient ? '✅ Connected' : '⚠️  Not configured'}`);
    console.log(`   - Email sending: ${emailResult.success ? '✅ Working' : '❌ Failed'}`);
    console.log('\n💡 Next Steps:');
    console.log('   1. Check email inbox for test@example.com');
    console.log('   2. Verify email formatting and content');
    console.log('   3. Test the payment link if Square is configured');
    console.log('   4. Check owner notifications if enabled');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPaymentLinkEmail().catch(console.error);
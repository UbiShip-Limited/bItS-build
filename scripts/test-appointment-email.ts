#!/usr/bin/env tsx
/**
 * Script to test appointment confirmation emails
 * Run with: npm run tsx scripts/test-appointment-email.ts
 */

// Load environment variables first
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { prisma } from '../lib/prisma/prisma';
import { CommunicationService } from '../lib/services/communicationService';
import { EmailTemplateService } from '../lib/services/emailTemplateService';
import { EmailService } from '../lib/services/emailService';
import { RealtimeService } from '../lib/services/realtimeService';
import { emailTemplateService } from '../lib/services/emailTemplateService';
import { BookingStatus, BookingType } from '../lib/types/booking';

const TEST_EMAIL = 'max.md.bosch@gmail.com';

async function sendTestAppointmentEmail() {
  console.log('📧 Testing Appointment Confirmation Email\n');
  console.log('=' .repeat(50));
  
  try {
    // First, ensure the template exists
    console.log('1️⃣ Checking email template...');
    const template = await prisma.emailTemplate.findUnique({
      where: { name: 'appointment_confirmation' }
    });
    
    if (!template) {
      console.log('❌ Template not found. Seeding templates...');
      // Seed the templates
      const defaultTemplates = EmailTemplateService.getDefaultTemplates();
      for (const tmpl of defaultTemplates) {
        const existing = await prisma.emailTemplate.findUnique({
          where: { name: tmpl.name }
        });
        
        if (!existing) {
          await prisma.emailTemplate.create({
            data: {
              ...tmpl,
              isActive: true
            }
          });
          console.log(`   ✅ Created template: ${tmpl.displayName}`);
        }
      }
    } else if (!template.isActive) {
      console.log('⚠️  Template exists but is inactive. Activating...');
      await prisma.emailTemplate.update({
        where: { id: template.id },
        data: { isActive: true }
      });
    } else {
      console.log('✅ Template exists and is active');
    }
    
    // Create a test appointment object
    console.log('\n2️⃣ Creating test appointment data...');
    const testAppointment = {
      id: 'test-appointment-' + Date.now(),
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      duration: 120,
      type: BookingType.TATTOO_SESSION,
      status: BookingStatus.CONFIRMED,
      contactEmail: TEST_EMAIL,
      customer: {
        name: 'Max Bosch',
        email: TEST_EMAIL,
        phone: '+1 (604) 555-0123'
      },
      artist: {
        email: 'artist@bowenislandtattoo.com',
        name: 'Jane Artist'
      },
      notes: 'This is a test appointment for email verification',
      customerId: null,
      artistId: null,
      contactPhone: null,
      squareId: null,
      priceQuote: 250,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('✅ Test appointment created');
    console.log(`   Date: ${testAppointment.startTime.toLocaleDateString()}`);
    console.log(`   Time: ${testAppointment.startTime.toLocaleTimeString()}`);
    console.log(`   Customer: ${testAppointment.customer.name}`);
    console.log(`   Email: ${TEST_EMAIL}`);
    
    // Initialize services
    console.log('\n3️⃣ Initializing email services...');
    const realtimeService = new RealtimeService();
    const communicationService = new CommunicationService(realtimeService);
    console.log('✅ Services initialized');
    
    // Send the confirmation email
    console.log('\n4️⃣ Sending appointment confirmation email...');
    console.log(`   To: ${TEST_EMAIL}`);
    
    const result = await communicationService.sendAppointmentConfirmation(testAppointment as any);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('   Check your inbox at:', TEST_EMAIL);
    } else {
      console.log('❌ Failed to send email:', result.error);
      
      // Additional debugging
      if (!process.env.RESEND_API_KEY) {
        console.log('\n⚠️  RESEND_API_KEY is not set');
        console.log('   Email sending is disabled without this key');
      }
    }
    
    // Also test owner notification if configured
    if (process.env.OWNER_EMAIL) {
      console.log('\n5️⃣ Testing owner notification...');
      const ownerResult = await communicationService.sendOwnerNewAppointmentNotification(testAppointment as any);
      
      if (ownerResult.success) {
        console.log('✅ Owner notification sent to:', process.env.OWNER_EMAIL);
      } else {
        console.log('❌ Failed to send owner notification:', ownerResult.error);
      }
    } else {
      console.log('\n⚠️  OWNER_EMAIL not configured - skipping owner notification');
    }
    
    // Send test email directly via template service for debugging
    if (process.env.RESEND_API_KEY) {
      console.log('\n6️⃣ Sending direct test email via template service...');
      try {
        await emailTemplateService.sendTest(
          (await prisma.emailTemplate.findUnique({ where: { name: 'appointment_confirmation' } }))!.id,
          TEST_EMAIL,
          {
            customerName: 'Max Bosch',
            appointmentDate: 'Thursday, January 19, 2025',
            appointmentTime: '2:00 PM',
            duration: '2 hours',
            artistName: 'Jane Artist',
            appointmentType: 'Tattoo Session'
          }
        );
        console.log('✅ Test email sent directly via template service');
      } catch (error) {
        console.log('❌ Direct template test failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Complete!');
  console.log('\nNext steps:');
  console.log('1. Check your email at:', TEST_EMAIL);
  console.log('2. Verify the email template looks correct');
  console.log('3. Check spam folder if email not received');
  console.log('4. Ensure RESEND_API_KEY is set if emails not sending');
}

// Run the test
sendTestAppointmentEmail()
  .catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
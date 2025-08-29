#!/usr/bin/env tsx
/**
 * Script to verify email system configuration
 * Run with: npm run tsx scripts/verify-email-system.ts
 */

import { prisma } from '../lib/prisma/prisma';
import { CommunicationService } from '../lib/services/communicationService';
import { EmailTemplateService } from '../lib/services/emailTemplateService';
import { EmailService } from '../lib/services/emailService';
import { RealtimeService } from '../lib/services/realtimeService';

async function verifyEmailSystem() {
  console.log('🔍 Email System Verification\n');
  console.log('=' .repeat(50));
  
  // Check environment variables
  console.log('\n📋 Environment Configuration:');
  console.log('----------------------------');
  
  const emailConfig = {
    'RESEND_API_KEY': process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing',
    'EMAIL_FROM': process.env.EMAIL_FROM || 'Using default',
    'OWNER_EMAIL': process.env.OWNER_EMAIL || '⚠️ Not configured',
    'OWNER_NOTIFICATION_ENABLED': process.env.OWNER_NOTIFICATION_ENABLED !== 'false' ? '✅ Enabled' : '❌ Disabled'
  };
  
  Object.entries(emailConfig).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });
  
  // Check email templates in database
  console.log('\n📧 Email Templates in Database:');
  console.log('-------------------------------');
  
  try {
    const templates = await prisma.emailTemplate.findMany({
      select: {
        name: true,
        displayName: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });
    
    if (templates.length === 0) {
      console.log('❌ No email templates found in database');
      console.log('   Run: npm run tsx scripts/seedEmailTemplates.ts');
    } else {
      const criticalTemplates = [
        'appointment_confirmation',
        'tattoo_request_confirmation',
        'owner_new_appointment',
        'owner_new_tattoo_request'
      ];
      
      templates.forEach(template => {
        const status = template.isActive ? '✅' : '❌';
        const critical = criticalTemplates.includes(template.name) ? '⭐' : '  ';
        console.log(`${critical} ${status} ${template.name} - ${template.displayName}`);
      });
      
      // Check for missing critical templates
      const existingNames = templates.map(t => t.name);
      const missingCritical = criticalTemplates.filter(name => !existingNames.includes(name));
      
      if (missingCritical.length > 0) {
        console.log('\n⚠️  Missing critical templates:');
        missingCritical.forEach(name => console.log(`   - ${name}`));
      }
    }
  } catch (error) {
    console.error('❌ Failed to check templates:', error.message);
  }
  
  // Test email service initialization
  console.log('\n🔧 Service Initialization Test:');
  console.log('-------------------------------');
  
  try {
    const realtimeService = new RealtimeService();
    const communicationService = new CommunicationService(realtimeService);
    const emailTemplateService = new EmailTemplateService();
    const emailService = new EmailService();
    
    console.log('✅ CommunicationService initialized');
    console.log('✅ EmailTemplateService initialized');
    console.log('✅ EmailService initialized');
    
    // Check if email sending is available
    if (process.env.RESEND_API_KEY) {
      console.log('✅ Email sending capability: Available');
    } else {
      console.log('⚠️  Email sending capability: Not available (RESEND_API_KEY missing)');
    }
  } catch (error) {
    console.error('❌ Service initialization failed:', error.message);
  }
  
  // Test appointment confirmation flow (dry run)
  console.log('\n🧪 Appointment Email Flow Test:');
  console.log('-------------------------------');
  
  try {
    // Check if appointment_confirmation template exists
    const template = await prisma.emailTemplate.findUnique({
      where: { name: 'appointment_confirmation' }
    });
    
    if (template && template.isActive) {
      console.log('✅ appointment_confirmation template exists and is active');
      
      // Show template variables
      console.log('   Required variables:', Object.keys(template.variables as any).join(', '));
    } else if (template) {
      console.log('⚠️  appointment_confirmation template exists but is INACTIVE');
    } else {
      console.log('❌ appointment_confirmation template NOT FOUND');
    }
  } catch (error) {
    console.error('❌ Failed to test appointment flow:', error.message);
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 SUMMARY:');
  console.log('-----------');
  
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const hasTemplates = await prisma.emailTemplate.count() > 0;
  const hasOwnerEmail = !!process.env.OWNER_EMAIL;
  
  if (hasResendKey && hasTemplates) {
    console.log('✅ Email system is READY for production');
    if (!hasOwnerEmail) {
      console.log('⚠️  Owner notifications disabled (set OWNER_EMAIL to enable)');
    }
  } else {
    console.log('❌ Email system is NOT ready');
    if (!hasResendKey) {
      console.log('   - Set RESEND_API_KEY environment variable');
    }
    if (!hasTemplates) {
      console.log('   - Run: npm run tsx scripts/seedEmailTemplates.ts');
    }
  }
  
  console.log('\n' + '=' .repeat(50));
}

// Run verification
verifyEmailSystem()
  .catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
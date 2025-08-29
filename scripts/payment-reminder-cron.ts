#!/usr/bin/env tsx
/**
 * Payment Reminder Cron Job
 * 
 * This script should be run daily (preferably at 10 AM) to send payment reminders
 * Can be scheduled using:
 * - Node-cron (for Node.js apps)
 * - System cron (for Linux/Unix)
 * - Task Scheduler (for Windows)
 * - Railway cron jobs (for Railway deployments)
 * 
 * Example cron schedule: 0 10 * * * (runs at 10:00 AM every day)
 */

import { PrismaClient } from '@prisma/client';
import { PaymentReminderService } from '../lib/services/paymentReminderService';
import { CommunicationService } from '../lib/services/communicationService';
import { EmailTemplateService } from '../lib/services/emailTemplateService';
import { RealtimeService } from '../lib/services/realtimeService';
import dotenv from 'dotenv';
import { format } from 'date-fns';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function runPaymentReminders() {
  console.log('🚀 Starting payment reminder job at', format(new Date(), 'yyyy-MM-dd HH:mm:ss'));
  
  try {
    // Initialize services
    const realtimeService = new RealtimeService();
    const communicationService = new CommunicationService(realtimeService);
    const emailTemplateService = new EmailTemplateService(prisma);
    const reminderService = new PaymentReminderService(
      prisma,
      communicationService,
      emailTemplateService
    );
    
    // Process reminders
    const stats = await reminderService.processPaymentReminders();
    
    console.log('✅ Payment reminder job completed:', {
      processed: stats.processed,
      sent: stats.sent,
      errors: stats.errors,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    });
    
    // Send summary to owner
    if (stats.sent > 0) {
      await communicationService.sendOwnerNotification({
        type: 'reminder_summary',
        subject: 'Daily Payment Reminder Summary',
        data: {
          date: format(new Date(), 'MMMM d, yyyy'),
          remindersSent: stats.sent,
          totalProcessed: stats.processed,
          errors: stats.errors
        }
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Payment reminder job failed:', error);
    
    // Try to send error notification to owner
    try {
      const realtimeService = new RealtimeService();
      const communicationService = new CommunicationService(realtimeService);
      await communicationService.sendOwnerNotification({
        type: 'system_error',
        subject: 'Payment Reminder Job Failed',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
        }
      });
    } catch (notifyError) {
      console.error('Failed to send error notification:', notifyError);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⚠️  Payment reminder job interrupted');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Payment reminder job terminated');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the job
runPaymentReminders();
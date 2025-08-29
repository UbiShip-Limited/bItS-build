#!/usr/bin/env tsx
/**
 * Check Email Logs in Database
 * This script queries the database to show recent email activity
 */

import '../lib/config/envLoader';
import { prisma } from '../lib/prisma/prisma';
import { formatDistanceToNow } from 'date-fns';

async function checkEmailLogs() {
  console.log('📧 Checking Email Logs in Database\n');

  try {
    // Check recent email automation logs
    console.log('1️⃣ Recent Email Automation Logs:');
    console.log('━'.repeat(80));
    
    const emailLogs = await prisma.emailAutomationLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 10,
      include: {
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        appointment: {
          select: {
            startTime: true,
            type: true
          }
        },
        tattooRequest: {
          select: {
            description: true,
            status: true
          }
        }
      }
    });

    if (emailLogs.length === 0) {
      console.log('   No email automation logs found.');
    } else {
      emailLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. ${log.emailType}`);
        console.log(`   Status: ${log.status === 'sent' ? '✅' : '❌'} ${log.status}`);
        console.log(`   To: ${log.emailAddress}`);
        console.log(`   Customer: ${log.customer?.name || 'Anonymous'}`);
        console.log(`   Sent: ${formatDistanceToNow(log.sentAt, { addSuffix: true })}`);
        
        if (log.appointment) {
          console.log(`   Appointment: ${log.appointment.type} on ${new Date(log.appointment.startTime).toLocaleString()}`);
        }
        
        if (log.tattooRequest) {
          console.log(`   Request: ${log.tattooRequest.description.substring(0, 50)}...`);
        }
        
        if (log.error) {
          console.log(`   ⚠️ Error: ${log.error}`);
        }
      });
    }

    // Check recent audit logs for email activity
    console.log('\n\n2️⃣ Recent Email Audit Logs:');
    console.log('━'.repeat(80));
    
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { contains: 'EMAIL' } },
          { action: { contains: 'email' } },
          { resource: 'Email' }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    if (auditLogs.length === 0) {
      console.log('   No email audit logs found.');
    } else {
      auditLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. ${log.action}`);
        console.log(`   Resource: ${log.resource}`);
        const logTime = log.created_at || log.createdAt;
        if (logTime) {
          console.log(`   Time: ${formatDistanceToNow(new Date(logTime), { addSuffix: true })}`);
        }
        
        if (log.details && typeof log.details === 'object') {
          const details = log.details as any;
          if (details.to) {
            console.log(`   To: ${Array.isArray(details.to) ? details.to.join(', ') : details.to}`);
          }
          if (details.subject) {
            console.log(`   Subject: ${details.subject}`);
          }
          if (details.error) {
            console.log(`   ⚠️ Error: ${details.error}`);
          }
        }
      });
    }

    // Summary statistics
    console.log('\n\n3️⃣ Email Statistics:');
    console.log('━'.repeat(80));
    
    const totalEmails = await prisma.emailAutomationLog.count();
    const sentEmails = await prisma.emailAutomationLog.count({
      where: { status: 'sent' }
    });
    const failedEmails = await prisma.emailAutomationLog.count({
      where: { status: 'failed' }
    });

    console.log(`   Total Emails: ${totalEmails}`);
    console.log(`   Sent: ${sentEmails} (${totalEmails > 0 ? Math.round(sentEmails / totalEmails * 100) : 0}%)`);
    console.log(`   Failed: ${failedEmails} (${totalEmails > 0 ? Math.round(failedEmails / totalEmails * 100) : 0}%)`);

    // Check email templates
    console.log('\n\n4️⃣ Active Email Templates:');
    console.log('━'.repeat(80));
    
    const templates = await prisma.emailTemplate.findMany({
      where: { isActive: true },
      select: {
        name: true,
        displayName: true,
        subject: true
      }
    });

    templates.forEach((template) => {
      console.log(`   • ${template.displayName} (${template.name})`);
      console.log(`     Subject: ${template.subject}`);
    });

    console.log('\n✨ Email log check completed!');

  } catch (error) {
    console.error('Error checking email logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkEmailLogs()
  .catch((error) => {
    console.error('Failed to check email logs:', error);
    process.exit(1);
  });
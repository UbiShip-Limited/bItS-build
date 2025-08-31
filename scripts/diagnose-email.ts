import '../lib/config/envLoader';
import { Resend } from 'resend';
import { prisma } from '../lib/prisma/prisma';

async function diagnoseEmail() {
  console.log('🔍 Email Service Diagnostics\n');
  console.log('=================================\n');

  // 1. Check environment variables
  console.log('1️⃣  Environment Variables:');
  console.log(`   RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set (starts with ' + process.env.RESEND_API_KEY.substring(0, 15) + '...)' : '❌ Not set'}`);
  console.log(`   EMAIL_FROM: ${process.env.EMAIL_FROM || '❌ Not set'}`);
  console.log(`   OWNER_EMAIL: ${process.env.OWNER_EMAIL || '❌ Not set'}`);
  console.log(`   EMAIL_ENABLED: ${process.env.EMAIL_ENABLED || 'Not set (defaults to true)'}\n`);

  // 2. Test Resend API connection
  console.log('2️⃣  Testing Resend API Connection:');
  
  if (!process.env.RESEND_API_KEY) {
    console.log('   ❌ Cannot test - RESEND_API_KEY not set\n');
  } else {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    try {
      // Send a test email
      console.log('   Sending test email to support@ubiship.io...');
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: 'support@ubiship.io',
        subject: 'Bowen Island Tattoo Shop - Email Test',
        html: `
          <h2>Email Service Test</h2>
          <p>This is a test email from your Bowen Island Tattoo Shop system.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
          <hr>
          <p>If you received this email, your email service is working correctly!</p>
        `,
        text: `Email Service Test\n\nThis is a test email from your Bowen Island Tattoo Shop system.\nTimestamp: ${new Date().toISOString()}\n\nIf you received this email, your email service is working correctly!`
      });

      console.log('   ✅ Email sent successfully!');
      console.log(`   📧 Email ID: ${result.data?.id}`);
      console.log('   📬 Check support@ubiship.io inbox\n');
    } catch (error: any) {
      console.log('   ❌ Failed to send email:');
      console.log(`   Error: ${error.message}`);
      if (error.response) {
        console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      console.log('\n');
    }
  }

  // 3. Check email logs in database
  console.log('3️⃣  Recent Email Logs (last 5):');
  
  try {
    const recentLogs = await prisma.emailLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        emailAddress: true,
        emailType: true,
        status: true,
        errorMessage: true,
        createdAt: true,
        resendId: true
      }
    });

    if (recentLogs.length === 0) {
      console.log('   No email logs found in database\n');
    } else {
      recentLogs.forEach((log, index) => {
        console.log(`\n   ${index + 1}. ${log.emailType} to ${log.emailAddress}`);
        console.log(`      Status: ${log.status === 'sent' ? '✅' : '❌'} ${log.status}`);
        console.log(`      Time: ${log.createdAt.toLocaleString()}`);
        if (log.resendId) {
          console.log(`      Resend ID: ${log.resendId}`);
        }
        if (log.errorMessage) {
          console.log(`      Error: ${log.errorMessage}`);
        }
      });
      console.log('');
    }
  } catch (error) {
    console.log('   ❌ Error fetching email logs:', error);
  }

  // 4. Check Resend dashboard URL
  console.log('4️⃣  Resend Dashboard:');
  console.log('   📊 Check your emails at: https://resend.com/emails');
  console.log('   🔑 API Keys: https://resend.com/api-keys');
  console.log('   📧 Domains: https://resend.com/domains\n');

  // 5. Common issues
  console.log('5️⃣  Common Issues to Check:');
  console.log('   • Verify domain is configured in Resend dashboard');
  console.log('   • Check if emails are going to spam folder');
  console.log('   • Ensure FROM address matches a verified domain');
  console.log('   • Check Resend dashboard for delivery status');
  console.log('   • Verify API key has correct permissions\n');

  console.log('✨ Diagnostics complete!');
}

diagnoseEmail()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
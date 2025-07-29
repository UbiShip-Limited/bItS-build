import '../lib/config/envLoader';
import { emailService } from '../lib/services/emailService';
import { emailTemplateService } from '../lib/services/emailTemplateService';
import { prisma } from '../lib/prisma/prisma';

async function testEmailFlow() {
  console.log('🧪 Testing Email Flow...\n');

  // 1. Test email service configuration
  console.log('1️⃣ Testing email service configuration...');
  const isEnabled = emailService.isEnabled();
  console.log(`   Email service enabled: ${isEnabled ? '✅ Yes' : '❌ No'}`);
  
  if (!isEnabled) {
    console.log('\n⚠️  Email service is disabled. Set RESEND_API_KEY to enable.');
    console.log('   Emails will be logged to console instead of being sent.\n');
  }

  // 2. Check email templates
  console.log('2️⃣ Checking email templates...');
  const templates = await emailTemplateService.list();
  console.log(`   Found ${templates.length} email templates:`);
  templates.forEach(t => {
    console.log(`   - ${t.displayName} (${t.name}) ${t.isActive ? '✅' : '❌'}`);
  });

  // 3. Test sending a tattoo request confirmation
  console.log('\n3️⃣ Testing tattoo request confirmation email...');
  
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  console.log(`   Sending to: ${testEmail}`);

  try {
    const result = await emailTemplateService.sendEmail(
      'tattoo_request_confirmation',
      testEmail,
      {
        customerName: 'Test Customer',
        description: 'A beautiful dragon tattoo on my shoulder',
        placement: 'Right shoulder',
        size: 'Medium (4-6 inches)',
        style: 'Japanese Traditional',
        preferredArtist: 'Kelly Miller',
        trackingToken: 'test-token-123',
        trackingUrl: 'http://localhost:3000/track-request/test-token-123'
      }
    );

    if (result.success) {
      console.log('   ✅ Email sent successfully!');
    } else {
      console.log(`   ❌ Failed to send email: ${result.error}`);
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }

  // 4. Preview an email template
  console.log('\n4️⃣ Previewing appointment confirmation template...');
  const template = await emailTemplateService.findByName('appointment_confirmation');
  
  if (template) {
    const preview = await emailTemplateService.preview(template.id, {
      customerName: 'John Doe',
      appointmentDate: 'Friday, January 26, 2025',
      appointmentTime: '2:00 PM',
      duration: '2 hours',
      artistName: 'Kelly Miller',
      appointmentType: 'Tattoo Session'
    });

    console.log('\n   📧 Subject:', preview.subject);
    console.log('\n   📝 Body Preview (first 200 chars):');
    console.log('   ' + preview.text.substring(0, 200) + '...\n');
  }

  // 5. Test connection (if enabled)
  if (isEnabled) {
    console.log('5️⃣ Testing email service connection...');
    const connected = await emailService.testConnection();
    console.log(`   Connection test: ${connected ? '✅ Success' : '❌ Failed'}`);
  }

  console.log('\n✨ Email flow test completed!');
}

// Run the test
testEmailFlow()
  .catch((error) => {
    console.error('Failed to test email flow:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
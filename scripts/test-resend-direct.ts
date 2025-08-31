import { Resend } from 'resend';

async function testResend() {
  console.log('🔍 Testing Resend API directly\n');
  
  const apiKey = 're_MojNRjdr_Dx9jPC3S3xBGKuN3TZinUFiB';
  const resend = new Resend(apiKey);
  
  console.log('Using API Key:', apiKey.substring(0, 15) + '...');
  
  try {
    // Test 1: Send to verified email (test mode restriction)
    console.log('\n1️⃣  Test sending to verified email (bowenislandtattooshop@gmail.com):');
    const result1 = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'bowenislandtattooshop@gmail.com',
      subject: 'Test from Bowen Island Tattoo Shop - Test Mode',
      html: '<p>This is a test email. Your Resend account is in test mode and can only send to bowenislandtattooshop@gmail.com</p>'
    });
    console.log('✅ Success! Response:', JSON.stringify(result1, null, 2));
    
    // Test 2: Send with configured domain
    console.log('\n2️⃣  Test with bowenislandtattooshop@gmail.com:');
    const result2 = await resend.emails.send({
      from: 'bowenislandtattooshop@gmail.com',
      to: 'support@ubiship.io',
      subject: 'Test from Bowen Island Tattoo Shop - Custom Domain',
      html: '<p>This email uses your configured domain. If you receive this, your domain is properly set up!</p>'
    });
    console.log('✅ Success! Email ID:', result2.data?.id);
    
  } catch (error: any) {
    console.log('❌ Error:', error.message);
    if (error.response?.data) {
      console.log('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
  
  console.log('\n📊 Check your emails at:');
  console.log('   • Inbox: support@ubiship.io');
  console.log('   • Resend Dashboard: https://resend.com/emails');
  console.log('\n⚠️  Important: Emails might take 1-2 minutes to arrive');
}

testResend().catch(console.error);
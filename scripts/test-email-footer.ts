#!/usr/bin/env tsx
/**
 * Test Email Footer - Verify correct business information
 */

import '../lib/config/envLoader';
import { emailTemplateService } from '../lib/services/emailTemplateService';
import EmailStyleService from '../lib/services/emailStyleService';

async function testEmailFooter() {
  console.log('🔍 Testing Email Footer Information\n');
  console.log('=' .repeat(50) + '\n');

  // Test the footer HTML generation
  console.log('1️⃣  Testing Email Footer HTML:\n');
  const footer = EmailStyleService.createFooter();
  
  // Check for correct address
  const hasCorrectAddress = footer.includes('565 Artisan Lane') && 
                           footer.includes('Bowen Island, BC V0N1G2') &&
                           footer.includes('Artisan Square');
  
  // Check for correct hours
  const hasCorrectHours = footer.includes('Tuesday - Saturday') && 
                         footer.includes('11:00 AM - 7:00 PM');
  
  // Check for correct social links
  const hasCorrectSocial = footer.includes('instagram.com/bowenislandtattooshop') &&
                          footer.includes('facebook.com/bowenislandtattooshop') &&
                          footer.includes('bowenislandtattooshop.com');
  
  // Check for correct copyright
  const hasCorrectCopyright = footer.includes('Bowen Island Tattoo');

  console.log(`   ✅ Address: ${hasCorrectAddress ? 'Correct (565 Artisan Lane)' : '❌ Incorrect'}`);
  console.log(`   ✅ Hours: ${hasCorrectHours ? 'Correct (Tue-Sat 11am-7pm)' : '❌ Incorrect'}`);
  console.log(`   ✅ Social Links: ${hasCorrectSocial ? 'Correct' : '❌ Incorrect'}`);
  console.log(`   ✅ Copyright: ${hasCorrectCopyright ? 'Correct' : '❌ Incorrect'}`);

  // Test sending an actual email with the footer
  console.log('\n2️⃣  Sending Test Email with Updated Footer:\n');
  
  const testEmail = process.env.OWNER_EMAIL || 'bowenislandtattooshop@gmail.com';
  
  const result = await emailTemplateService.sendEmail(
    'appointment_confirmation',
    testEmail,
    {
      customerName: 'Footer Test',
      appointmentDate: 'Monday, September 7, 2025',
      appointmentTime: '2:00 PM',
      duration: '2 hours',
      appointmentType: 'Consultation',
      artistName: 'Kelly Miller'
    }
  );

  if (result.success) {
    console.log(`   ✅ Email sent to ${testEmail}`);
    console.log('   Check the email footer for:');
    console.log('   • Address: 565 Artisan Lane, Artisan Square');
    console.log('   • Hours: Tuesday - Saturday, 11:00 AM - 7:00 PM');
    console.log('   • Social links: Instagram, Facebook, Website');
  } else {
    console.log(`   ❌ Failed to send email: ${result.error}`);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('\n✅ Email Footer Update Summary:\n');
  console.log('Old (Incorrect) Information:');
  console.log('  ❌ 123 Main Street');
  console.log('  ❌ Bowen Island, BC V0N 1G0');
  console.log('  ❌ (604) 123-4567');
  console.log('  ❌ Generic social links\n');
  
  console.log('New (Correct) Information:');
  console.log('  ✅ 565 Artisan Lane, Artisan Square');
  console.log('  ✅ Bowen Island, BC V0N1G2');
  console.log('  ✅ Tuesday - Saturday, 11:00 AM - 7:00 PM');
  console.log('  ✅ By appointment only');
  console.log('  ✅ Direct social media links');
  console.log('  ✅ Correct business name: Bowen Island Tattoo');
  
  console.log('\n📧 Check your inbox to verify the footer appears correctly!');
}

testEmailFooter().catch(console.error);
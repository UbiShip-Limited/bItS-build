#!/usr/bin/env tsx
/**
 * Setup and verify email configuration
 * Run with: npx tsx scripts/setup-email-config.ts
 */

// Load environment variables first
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function setupEmailConfig() {
  console.log('📧 Email Configuration Setup\n');
  console.log('=' .repeat(50));
  
  // Current configuration
  console.log('📋 Current Configuration:');
  console.log('-------------------------');
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'Not set (will use default)');
  console.log('EMAIL_ENABLED:', process.env.EMAIL_ENABLED || 'Not set (defaults to true)');
  console.log('OWNER_EMAIL:', process.env.OWNER_EMAIL || 'Not set');
  console.log('OWNER_NOTIFICATION_ENABLED:', process.env.OWNER_NOTIFICATION_ENABLED || 'Not set (defaults to true)');
  
  console.log('\n📝 Recommended Configuration:');
  console.log('-----------------------------');
  console.log('Based on your setup, here are the recommended settings:\n');
  
  const recommendations = {
    'RESEND_API_KEY': 're_MojNRjdr_Dx9jPC3S3xBGKuN3TZinUFiB',
    'EMAIL_FROM': 'bowenislandtattooshop@gmail.com',
    'EMAIL_ENABLED': 'true',
    'OWNER_EMAIL': 'bowenislandtattooshop@gmail.com',
    'OWNER_NOTIFICATION_ENABLED': 'true'
  };
  
  Object.entries(recommendations).forEach(([key, value]) => {
    const current = process.env[key];
    const status = current === value ? '✅' : current ? '⚠️' : '❌';
    console.log(`${status} ${key}=${value}`);
    if (current && current !== value) {
      console.log(`   Current: ${current}`);
    }
  });
  
  // Check if .env file needs updating
  console.log('\n🔧 Checking .env file:');
  console.log('----------------------');
  
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found!');
    console.log('Creating .env file with recommended settings...');
    
    const envContent = Object.entries(recommendations)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(envPath, envContent + '\n');
    console.log('✅ .env file created!');
  } else {
    console.log('✅ .env file exists');
    
    // Check for missing variables
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const missingVars = [];
    
    Object.entries(recommendations).forEach(([key, value]) => {
      if (!envContent.includes(`${key}=`)) {
        missingVars.push(`${key}=${value}`);
      }
    });
    
    if (missingVars.length > 0) {
      console.log('\n⚠️  Missing environment variables detected!');
      console.log('Add these to your .env file:');
      console.log('```');
      missingVars.forEach(v => console.log(v));
      console.log('```');
    }
  }
  
  console.log('\n📧 Email Flow Explanation:');
  console.log('-------------------------');
  console.log('1. Customer Emails:');
  console.log('   FROM: bowenislandtattooshop@gmail.com');
  console.log('   TO: Customer\'s email address');
  console.log('   WHEN: Appointment confirmations, tattoo request confirmations');
  console.log('');
  console.log('2. Owner Notifications:');
  console.log('   FROM: bowenislandtattooshop@gmail.com');
  console.log('   TO: bowenislandtattooshop@gmail.com (owner)');
  console.log('   WHEN: New appointments, new tattoo requests, cancellations');
  
  console.log('\n🚀 Quick Test Commands:');
  console.log('-----------------------');
  console.log('1. Test email sending:');
  console.log('   npx tsx scripts/debug-email-sending.ts');
  console.log('');
  console.log('2. Test appointment confirmation:');
  console.log('   npm run test:appointment-email');
  console.log('');
  console.log('3. Seed email templates:');
  console.log('   npm run seed:emails');
  console.log('   npx tsx scripts/seed-owner-templates.ts');
  
  console.log('\n⚠️  Important Notes:');
  console.log('-------------------');
  console.log('• Gmail addresses usually work with Resend without domain verification');
  console.log('• Check spam/junk folder if emails don\'t appear in inbox');
  console.log('• Owner will receive notifications at: bowenislandtattooshop@gmail.com');
  console.log('• Customers will see emails from: bowenislandtattooshop@gmail.com');
  console.log('• Check Resend dashboard for delivery status: https://resend.com/emails');
  
  console.log('\n' + '=' .repeat(50));
}

// Run setup
setupEmailConfig()
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
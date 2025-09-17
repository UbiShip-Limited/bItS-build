#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

async function testPasswordResetConfiguration() {
  console.log('======================================');
  console.log('Password Reset Configuration Test');
  console.log('======================================\n');

  // Check environment variables
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  console.log('🔍 Environment Configuration:');
  console.log('-----------------------------------');
  console.log(`Site URL: ${siteUrl || 'NOT SET ❌'}`);
  console.log(`Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ NOT SET'}`);
  console.log(`Supabase Anon Key: ${supabaseAnonKey ? '✅ Set' : '❌ NOT SET'}`);
  console.log('');

  // Check domain consistency
  if (siteUrl) {
    const hasWww = siteUrl.includes('www.');
    console.log('📌 Domain Configuration:');
    console.log('-----------------------------------');
    console.log(`Domain uses www: ${hasWww ? 'Yes' : 'No'}`);
    console.log(`Canonical URL: ${siteUrl}`);

    if (!hasWww && siteUrl.includes('bowenislandtattooshop.com')) {
      console.log('⚠️  WARNING: Site URL does not include www subdomain');
      console.log('   This may cause issues with password reset if Supabase expects www');
    }
    console.log('');
  }

  // Test redirect URL formation
  console.log('🔗 Redirect URLs:');
  console.log('-----------------------------------');
  const redirectUrls = [
    `${siteUrl}/auth/callback`,
    `https://www.bowenislandtattooshop.com/auth/callback`,
    `https://bowenislandtattooshop.com/auth/callback`
  ];

  redirectUrls.forEach(url => {
    console.log(`• ${url}`);
  });
  console.log('');

  // Test Supabase connection
  if (supabaseUrl && supabaseAnonKey) {
    console.log('🔄 Testing Supabase Connection:');
    console.log('-----------------------------------');

    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // Try to get auth settings (this should work with anon key)
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.log('❌ Failed to connect to Supabase:', error.message);
      } else {
        console.log('✅ Successfully connected to Supabase');
        console.log('   Session check passed (no active session expected)');
      }
    } catch (err) {
      console.log('❌ Error testing Supabase connection:', err);
    }
  } else {
    console.log('⚠️  Skipping Supabase connection test (missing credentials)');
  }

  console.log('\n======================================');
  console.log('📋 Recommendations:');
  console.log('======================================');
  console.log('1. Ensure NEXT_PUBLIC_SITE_URL matches exactly what is');
  console.log('   configured as an allowed redirect URL in Supabase Dashboard');
  console.log('');
  console.log('2. In Supabase Dashboard (Authentication > URL Configuration):');
  console.log('   - Add both www and non-www versions as redirect URLs');
  console.log(`   - https://www.bowenislandtattooshop.com/auth/callback`);
  console.log(`   - https://bowenislandtattooshop.com/auth/callback`);
  console.log('');
  console.log('3. Consider using www as the canonical domain for consistency');
  console.log('');
  console.log('4. Test password reset from both domain variants to ensure');
  console.log('   tokens are validated correctly');
  console.log('');

  // Show current configuration for production deployment
  console.log('📦 For Production Deployment:');
  console.log('-----------------------------------');
  console.log('Set these environment variables:');
  console.log('');
  console.log(`NEXT_PUBLIC_SITE_URL=https://www.bowenislandtattooshop.com`);
  console.log(`FRONTEND_URL=https://www.bowenislandtattooshop.com`);
  console.log('');
}

// Run the test
testPasswordResetConfiguration().catch(console.error);
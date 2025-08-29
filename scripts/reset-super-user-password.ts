#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPER_USER_EMAIL = 'bowenislandtattooshop@gmail.com';

async function resetSuperUserPassword() {
  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase environment variables are not configured');
      console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
      process.exit(1);
    }

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('🔑 Generating password reset link for super user...');
    console.log(`📧 Email: ${SUPER_USER_EMAIL}`);

    // Generate a password reset link
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: SUPER_USER_EMAIL,
      options: {
        redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password`
      }
    });

    if (error) {
      console.error('❌ Error generating reset link:', error.message);
      process.exit(1);
    }

    if (!data?.properties?.action_link) {
      console.error('❌ Failed to generate reset link');
      process.exit(1);
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Password reset link generated!');
    console.log('='.repeat(60));
    console.log('\n📧 Send this link to the user or open it in a browser:');
    console.log('\n' + data.properties.action_link);
    console.log('\n⏰ This link will expire in 1 hour');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
resetSuperUserPassword().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
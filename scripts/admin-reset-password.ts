#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';
import * as readline from 'readline';

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
};

function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const bytes = randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }

  // Ensure password meets requirements
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  if (!hasLower) password = password.substring(0, length - 1) + 'a';
  if (!hasUpper) password = password.substring(0, length - 2) + 'A';
  if (!hasNumber) password = password.substring(0, length - 3) + '1';
  if (!hasSpecial) password = password.substring(0, length - 4) + '!';

  return password;
}

async function adminResetPassword() {
  console.log(`\n${colors.cyan}${colors.bright}🔐 Admin Password Reset Tool${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(`${colors.red}❌ Supabase environment variables are not configured${colors.reset}`);
      console.error(`   Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file`);
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

    // Get email from command line or prompt
    let email = process.argv[2];
    if (!email) {
      email = await question(`${colors.yellow}Enter the user's email address: ${colors.reset}`);
    }

    if (!email || !email.includes('@')) {
      console.error(`${colors.red}❌ Please provide a valid email address${colors.reset}`);
      process.exit(1);
    }

    // Check if user exists
    console.log(`\n${colors.blue}🔍 Looking up user...${colors.reset}`);
    const { data: users, error: lookupError } = await supabaseAdmin.auth.admin.listUsers();

    if (lookupError) {
      console.error(`${colors.red}❌ Error looking up users: ${lookupError.message}${colors.reset}`);
      process.exit(1);
    }

    const user = users?.users?.find(u => u.email === email);
    if (!user) {
      console.error(`${colors.red}❌ No user found with email: ${email}${colors.reset}`);
      process.exit(1);
    }

    console.log(`${colors.green}✓ User found: ${user.email}${colors.reset}`);
    console.log(`  ID: ${colors.cyan}${user.id}${colors.reset}`);
    console.log(`  Role: ${colors.cyan}${user.user_metadata?.role || 'User'}${colors.reset}`);
    console.log(`  Created: ${colors.cyan}${new Date(user.created_at).toLocaleDateString()}${colors.reset}`);

    // Ask for reset method
    console.log(`\n${colors.yellow}Choose reset method:${colors.reset}`);
    console.log(`  1. Generate temporary password (user must change on login)`);
    console.log(`  2. Generate reset link (email to user)`);
    console.log(`  3. Set specific password (for testing only)`);

    const method = await question(`\n${colors.yellow}Enter choice (1-3): ${colors.reset}`);

    switch (method) {
      case '1': {
        // Generate temporary password
        const tempPassword = generateSecurePassword();

        console.log(`\n${colors.blue}🔄 Setting temporary password...${colors.reset}`);
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            password: tempPassword,
            user_metadata: {
              ...user.user_metadata,
              password_reset_required: true,
              password_reset_at: new Date().toISOString()
            }
          }
        );

        if (updateError) {
          console.error(`${colors.red}❌ Error updating password: ${updateError.message}${colors.reset}`);
          process.exit(1);
        }

        console.log(`\n${colors.green}${'='.repeat(60)}${colors.reset}`);
        console.log(`${colors.green}${colors.bright}✅ Password reset successful!${colors.reset}`);
        console.log(`${colors.green}${'='.repeat(60)}${colors.reset}\n`);

        console.log(`${colors.bright}Temporary Password:${colors.reset} ${colors.yellow}${tempPassword}${colors.reset}`);
        console.log(`\n${colors.cyan}Instructions for user:${colors.reset}`);
        console.log(`1. Log in with the temporary password above`);
        console.log(`2. You'll be prompted to change your password`);
        console.log(`3. Choose a secure password you'll remember`);
        console.log(`\n${colors.yellow}⚠️  This password is temporary and should be changed immediately${colors.reset}`);
        break;
      }

      case '2': {
        // Generate reset link
        console.log(`\n${colors.blue}🔄 Generating password reset link...${colors.reset}`);

        const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: email,
          options: {
            redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback`
          }
        });

        if (linkError) {
          console.error(`${colors.red}❌ Error generating reset link: ${linkError.message}${colors.reset}`);
          process.exit(1);
        }

        if (!data?.properties?.action_link) {
          console.error(`${colors.red}❌ Failed to generate reset link${colors.reset}`);
          process.exit(1);
        }

        console.log(`\n${colors.green}${'='.repeat(60)}${colors.reset}`);
        console.log(`${colors.green}${colors.bright}✅ Password reset link generated!${colors.reset}`);
        console.log(`${colors.green}${'='.repeat(60)}${colors.reset}\n`);

        console.log(`${colors.cyan}Send this link to the user:${colors.reset}`);
        console.log(`\n${colors.yellow}${data.properties.action_link}${colors.reset}\n`);
        console.log(`${colors.yellow}⏰ This link will expire in 1 hour${colors.reset}`);
        break;
      }

      case '3': {
        // Set specific password
        console.log(`\n${colors.yellow}⚠️  Warning: Setting a specific password is for testing only!${colors.reset}`);
        const newPassword = await question(`${colors.yellow}Enter the new password (min 8 chars): ${colors.reset}`);

        if (newPassword.length < 8) {
          console.error(`${colors.red}❌ Password must be at least 8 characters${colors.reset}`);
          process.exit(1);
        }

        console.log(`\n${colors.blue}🔄 Setting password...${colors.reset}`);
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { password: newPassword }
        );

        if (updateError) {
          console.error(`${colors.red}❌ Error updating password: ${updateError.message}${colors.reset}`);
          process.exit(1);
        }

        console.log(`\n${colors.green}${'='.repeat(60)}${colors.reset}`);
        console.log(`${colors.green}${colors.bright}✅ Password updated successfully!${colors.reset}`);
        console.log(`${colors.green}${'='.repeat(60)}${colors.reset}`);
        break;
      }

      default:
        console.error(`${colors.red}❌ Invalid choice. Please run the script again.${colors.reset}`);
        process.exit(1);
    }

    // Log the action for audit purposes
    console.log(`\n${colors.cyan}📝 Audit Log:${colors.reset}`);
    console.log(`  Action: Password reset`);
    console.log(`  User: ${email}`);
    console.log(`  Admin: ${process.env.USER || 'System Admin'}`);
    console.log(`  Time: ${new Date().toISOString()}`);

  } catch (error) {
    console.error(`\n${colors.red}❌ Error:${colors.reset}`, error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
adminResetPassword().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
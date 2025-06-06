#!/usr/bin/env tsx

/**
 * Setup script to create the initial admin user
 * 
 * Prerequisites:
 * 1. Make sure your .env file has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * 2. Make sure your database is running and accessible
 * 
 * Run with: 
 *   npm run setup:admin
 *   OR
 *   npx tsx scripts/setup-admin.ts
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../.env');

const envResult = config({ path: envPath });
if (envResult.error) {
  console.warn('⚠️  Could not load .env file from:', envPath);
  console.warn('Trying default location...');
  config(); // Try default
}
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { createInterface } from 'readline';
import { promisify } from 'util';

const prisma = new PrismaClient();

// Validate environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease add these to your .env file and try again.');
  console.error('\nEnvironment file locations checked:');
  console.error(`   - ${envPath}`);
  console.error(`   - ${process.cwd()}/.env`);
  process.exit(1);
}

// Debug: Show which environment variables are set
console.log('🔍 Environment Check:');
console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET'}`);
console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'}`);
console.log(`📁 Working directory: ${process.cwd()}`);
console.log('');

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create readline interface for user input
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = promisify(rl.question).bind(rl);

interface AdminUserData {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Get user input with validation
 */
async function getUserInput(): Promise<AdminUserData> {
  console.log('\n🔐 Setting up initial admin user\n');
  
  // Get email
  let email: string;
  do {
    email = await question('Enter admin email address: ');
    if (!isValidEmail(email)) {
      console.log('❌ Please enter a valid email address');
    }
  } while (!isValidEmail(email));
  
  // Get password
  let password: string;
  let passwordValid = false;
  
  do {
    password = await question('Enter admin password (min 8 chars, mixed case, numbers, symbols): ');
    const validation = isValidPassword(password);
    
    if (!validation.valid) {
      console.log('❌ Password requirements not met:');
      validation.errors.forEach(error => console.log(`   - ${error}`));
      console.log('');
    } else {
      passwordValid = true;
    }
  } while (!passwordValid);
  
  // Confirm password
  const confirmPassword = await question('Confirm admin password: ');
  
  if (password !== confirmPassword) {
    console.log('❌ Passwords do not match. Please try again.\n');
    return getUserInput(); // Recursive call to start over
  }
  
  return { email, password, confirmPassword };
}

/**
 * Test database connection
 */
async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('Please check your DATABASE_URL environment variable');
    return false;
  }
}

/**
 * Test Supabase connection
 */
async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

/**
 * Check if admin user already exists
 */
async function checkExistingAdmin(): Promise<boolean> {
  try {
    const existingAdmins = await prisma.user.findMany({
      where: { role: 'admin' }
    });
    
    return existingAdmins.length > 0;
  } catch (error) {
    console.error('❌ Error checking for existing admin users:', error);
    return false;
  }
}

/**
 * Create the admin user
 */
async function createAdminUser(userData: AdminUserData): Promise<void> {
  try {
    console.log('\n⏳ Creating admin user...');
    
    // Create user in Supabase Auth
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: { role: 'admin' },
      email_confirm: true // Skip email confirmation for admin setup
    });
    
    if (authError) {
      throw new Error(`Failed to create user in Supabase Auth: ${authError.message}`);
    }
    
    if (!data.user) {
      throw new Error('No user data returned from Supabase');
    }
    
    console.log('✅ User created in Supabase Auth');
    
    // Create user record in our database
    await prisma.user.create({
      data: {
        id: data.user.id,
        email: userData.email,
        role: 'admin'
      }
    });
    
    console.log('✅ User record created in database');
    console.log('\n🎉 Admin user setup complete!');
    console.log(`📧 Email: ${userData.email}`);
    console.log(`🔑 Role: admin`);
    console.log('\nYou can now log in to the admin portal using these credentials.');
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    console.error('\nPlease check your configuration and try again.');
    throw error;
  }
}

/**
 * Main setup function
 */
async function main() {
  try {
    console.log('🚀 Bowen Island Tattoo Shop - Admin Setup');
    console.log('==========================================');
    
    // Test connections first
    console.log('\n🔗 Testing connections...');
    const dbConnected = await testDatabaseConnection();
    const supabaseConnected = await testSupabaseConnection();
    
    if (!dbConnected || !supabaseConnected) {
      console.error('\n❌ Connection tests failed. Please fix the issues above and try again.');
      process.exit(1);
    }
    
    console.log('\n✅ All connections successful!');
    
    // Check if admin already exists
    const adminExists = await checkExistingAdmin();
    
    if (adminExists) {
      console.log('\n⚠️  Admin users already exist in the system.');
      const proceed = await question('Do you want to create another admin user? (y/N): ');
      
      if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
        console.log('Setup cancelled.');
        return;
      }
    }
    
    // Get user input
    const userData = await getUserInput();
    
    // Confirm creation
    console.log('\n📋 Review admin user details:');
    console.log(`Email: ${userData.email}`);
    console.log(`Role: admin`);
    
    const confirm = await question('\nCreate this admin user? (y/N): ');
    
    if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
      console.log('Setup cancelled.');
      return;
    }
    
    // Create the user
    await createAdminUser(userData);
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

/**
 * Handle process termination
 */
process.on('SIGINT', async () => {
  console.log('\n\n👋 Setup interrupted by user');
  rl.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n👋 Setup terminated');
  rl.close();
  await prisma.$disconnect();
  process.exit(0);
});

// Run the setup (ES module check)
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error('💥 Unexpected error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
} 
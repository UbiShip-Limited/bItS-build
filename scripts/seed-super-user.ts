#!/usr/bin/env node
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Configuration
const SUPER_USER_EMAIL = 'bowenislandtattooshop@gmail.com';
const SUPER_USER_NAME = 'Bowen Island Tattoo Shop Owner';

// Generate a strong password
function generateStrongPassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  // Ensure password meets requirements (at least one uppercase, lowercase, number, and special char)
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password);
  
  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return generateStrongPassword(length); // Regenerate if requirements not met
  }
  
  return password;
}

async function seedSuperUser() {
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

    console.log('🔑 Creating super user for Bowen Island Tattoo Shop...');
    console.log(`📧 Email: ${SUPER_USER_EMAIL}`);

    // Check if user already exists in Supabase by email
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = users?.find(u => u.email === SUPER_USER_EMAIL);
    
    let userId: string;
    let password: string | null = null;
    let userCreated = false;

    if (existingAuthUser) {
      console.log('⚠️  User already exists in Supabase Auth');
      userId = existingAuthUser.id;
      
      // Ask if they want to reset the password
      console.log('   Would you like to reset the password? (This will send a reset email)');
      
      // For automated script, we'll just update the user's metadata
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          user_metadata: { 
            name: SUPER_USER_NAME,
            role: 'owner'
          }
        }
      );

      if (updateError) {
        console.error('❌ Error updating user metadata:', updateError.message);
      } else {
        console.log('✅ User metadata updated');
      }
    } else {
      // Create new user in Supabase Auth
      password = generateStrongPassword();
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: SUPER_USER_EMAIL,
        password: password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: SUPER_USER_NAME,
          role: 'owner'
        }
      });

      if (createError) {
        console.error('❌ Error creating user in Supabase:', createError.message);
        process.exit(1);
      }

      if (!newUser.user) {
        console.error('❌ Failed to create user');
        process.exit(1);
      }

      userId = newUser.user.id;
      userCreated = true;
      console.log('✅ User created in Supabase Auth');
    }

    // Check if user exists in database
    const existingDbUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (existingDbUser) {
      // Update existing user to ensure they have owner role
      await prisma.user.update({
        where: { id: userId },
        data: {
          role: 'owner',
          updatedAt: new Date()
        }
      });
      console.log('✅ User role updated to owner in database');
    } else {
      // Create user in database
      await prisma.user.create({
        data: {
          id: userId,
          email: SUPER_USER_EMAIL,
          role: 'owner',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ User created in database with owner role');
    }

    // Note: Artist profiles are not needed for owners/admins
    // They can manage the shop without having an artist profile

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Super user setup complete!');
    console.log('='.repeat(60));
    console.log(`📧 Email: ${SUPER_USER_EMAIL}`);
    
    if (userCreated && password) {
      console.log(`🔑 Password: ${password}`);
      console.log('\n⚠️  IMPORTANT: Save this password securely!');
      console.log('   This is the only time it will be displayed.');
      console.log('   The user can change their password after logging in.');
    } else {
      console.log('\n📝 User already existed. Use the forgot password feature to reset if needed.');
      console.log('   Visit: http://localhost:3000/auth/forgot-password');
    }
    
    console.log('\n🔗 Login URL: http://localhost:3000/auth/login');
    console.log('   (or use the Staff Portal link in the footer)');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error seeding super user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
seedSuperUser().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
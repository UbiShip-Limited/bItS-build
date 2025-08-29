#!/usr/bin/env node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

async function listAllUsers() {
  try {
    console.log('📋 Listing all users in the system...\n');

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get all users from database
    const dbUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log('='.repeat(80));
    console.log('USERS IN DATABASE:');
    console.log('='.repeat(80));
    
    for (const user of dbUsers) {
      console.log(`\n📧 Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log(`   Updated: ${user.updatedAt.toLocaleString()}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('SUPER USERS (with owner/admin role):');
    console.log('='.repeat(80));
    
    const superUsers = dbUsers.filter(u => u.role === 'owner' || u.role === 'admin');
    
    if (superUsers.length === 0) {
      console.log('\n⚠️  No super users found!');
    } else {
      for (const user of superUsers) {
        console.log(`\n✅ ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Can access: Dashboard, Settings, All admin features`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('TO LOG IN:');
    console.log('='.repeat(80));
    console.log('\n1. Go to: http://localhost:3000/auth/login');
    console.log('   Or click "Staff Portal" in the footer');
    console.log('\n2. Use one of these super user accounts:');
    
    for (const user of superUsers) {
      console.log(`   - ${user.email}`);
    }
    
    console.log('\n3. If you forgot the password, use:');
    console.log('   http://localhost:3000/auth/forgot-password');
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
listAllUsers().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
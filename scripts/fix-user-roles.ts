#!/usr/bin/env node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const ADMIN_EMAILS = [
  'bowenislandtattooshop@gmail.com',
  'support@ubiship.io'
];

async function fixUserRoles() {
  try {
    console.log('🔧 Fixing user roles in database...\n');

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

    // Get all users from Supabase
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      process.exit(1);
    }

    // Check each admin email
    for (const email of ADMIN_EMAILS) {
      console.log(`\n📧 Checking user: ${email}`);
      
      const supabaseUser = users?.find(u => u.email === email);
      
      if (!supabaseUser) {
        console.log(`  ⚠️  User not found in Supabase Auth`);
        continue;
      }

      console.log(`  ✅ Found in Supabase: ${supabaseUser.id}`);

      // Check database
      const dbUser = await prisma.user.findUnique({
        where: { id: supabaseUser.id }
      });

      if (!dbUser) {
        console.log(`  ❌ User not found in database, creating...`);
        await prisma.user.create({
          data: {
            id: supabaseUser.id,
            email: email,
            role: 'owner',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`  ✅ User created with owner role`);
      } else {
        console.log(`  📊 Current role in database: ${dbUser.role}`);
        
        if (dbUser.role !== 'owner') {
          await prisma.user.update({
            where: { id: supabaseUser.id },
            data: {
              role: 'owner',
              updatedAt: new Date()
            }
          });
          console.log(`  ✅ Updated role to: owner`);
        } else {
          console.log(`  ✅ Role is already correct`);
        }
      }
    }

    // Also check for the specific user ID from the error log
    const problematicUserId = '13b8d70f-732b-4460-bc0a-2bbee70003e0';
    console.log(`\n🔍 Checking problematic user ID: ${problematicUserId}`);
    
    const problematicUser = await prisma.user.findUnique({
      where: { id: problematicUserId }
    });

    if (problematicUser) {
      console.log(`  📧 Email: ${problematicUser.email}`);
      console.log(`  📊 Current role: ${problematicUser.role}`);
      
      // Check if this user should be an admin
      if (ADMIN_EMAILS.includes(problematicUser.email)) {
        if (problematicUser.role !== 'owner') {
          await prisma.user.update({
            where: { id: problematicUserId },
            data: {
              role: 'owner',
              updatedAt: new Date()
            }
          });
          console.log(`  ✅ Fixed role to: owner`);
        }
      } else {
        console.log(`  ℹ️  User is not in admin list, keeping current role`);
      }
    } else {
      console.log(`  ⚠️  User not found in database`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Role fixing complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixUserRoles().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
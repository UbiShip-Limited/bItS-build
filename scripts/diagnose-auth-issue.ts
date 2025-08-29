#!/usr/bin/env node
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

async function diagnoseAuthIssue() {
  try {
    console.log('🔍 Diagnosing authentication issues...\n');

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

    const targetEmail = 'support@ubiship.io';
    console.log(`📧 Checking user: ${targetEmail}\n`);

    // Get user from Supabase
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      process.exit(1);
    }

    const supabaseUser = users?.find(u => u.email === targetEmail);
    
    if (!supabaseUser) {
      console.log('❌ User not found in Supabase Auth');
      console.log('   Need to create user first');
      process.exit(1);
    }

    console.log('✅ Found in Supabase Auth:');
    console.log(`   ID: ${supabaseUser.id}`);
    console.log(`   Email: ${supabaseUser.email}`);
    console.log(`   Created: ${new Date(supabaseUser.created_at).toLocaleString()}`);
    console.log(`   Confirmed: ${supabaseUser.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`   Metadata:`, supabaseUser.user_metadata);

    // Check database with both possible lookups
    console.log('\n📊 Checking database...');
    
    // Check by ID
    const dbUserById = await prisma.user.findUnique({
      where: { id: supabaseUser.id }
    });

    // Check by email
    const dbUserByEmail = await prisma.user.findUnique({
      where: { email: targetEmail }
    });

    if (!dbUserById && !dbUserByEmail) {
      console.log('❌ User not found in database!');
      console.log('   Creating user with owner role...');
      
      await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: targetEmail,
          role: 'owner',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ User created with owner role');
    } else if (dbUserById && dbUserByEmail && dbUserById.id !== dbUserByEmail.id) {
      console.log('⚠️  CONFLICT: Found different users by ID and email!');
      console.log(`   By ID: ${dbUserById.id} (${dbUserById.email})`);
      console.log(`   By Email: ${dbUserByEmail.id} (${dbUserByEmail.email})`);
      console.log('   Fixing by deleting incorrect entry and updating the correct one...');
      
      // Delete the wrong entry
      if (dbUserByEmail.id !== supabaseUser.id) {
        await prisma.user.delete({
          where: { id: dbUserByEmail.id }
        });
        console.log(`   Deleted incorrect entry: ${dbUserByEmail.id}`);
      }
      
      // Update the correct entry
      await prisma.user.update({
        where: { id: supabaseUser.id },
        data: {
          email: targetEmail,
          role: 'owner',
          updatedAt: new Date()
        }
      });
      console.log('✅ Fixed user entry');
    } else {
      const dbUser = dbUserById || dbUserByEmail;
      console.log('✅ Found in database:');
      console.log(`   ID: ${dbUser!.id}`);
      console.log(`   Email: ${dbUser!.email}`);
      console.log(`   Role: ${dbUser!.role}`);
      
      // Check if ID matches Supabase
      if (dbUser!.id !== supabaseUser.id) {
        console.log(`\n⚠️  ID MISMATCH!`);
        console.log(`   Supabase ID: ${supabaseUser.id}`);
        console.log(`   Database ID: ${dbUser!.id}`);
        console.log('   Fixing by updating database ID...');
        
        // Delete old record and create new one with correct ID
        await prisma.user.delete({
          where: { id: dbUser!.id }
        });
        
        await prisma.user.create({
          data: {
            id: supabaseUser.id,
            email: targetEmail,
            role: 'owner',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log('✅ Fixed ID mismatch');
      } else if (dbUser!.role !== 'owner' && dbUser!.role !== 'admin') {
        console.log(`\n⚠️  Role is not admin/owner!`);
        console.log('   Updating role to owner...');
        
        await prisma.user.update({
          where: { id: supabaseUser.id },
          data: {
            role: 'owner',
            updatedAt: new Date()
          }
        });
        
        console.log('✅ Updated role to owner');
      } else {
        console.log('\n✅ User is properly configured');
      }
    }

    // Final verification
    console.log('\n📋 Final verification...');
    const finalUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id }
    });

    if (finalUser && finalUser.role === 'owner') {
      console.log('✅ User is correctly set up:');
      console.log(`   ID: ${finalUser.id}`);
      console.log(`   Email: ${finalUser.email}`);
      console.log(`   Role: ${finalUser.role}`);
      console.log('\n🎉 Authentication should now work correctly!');
      console.log('   Try logging in again at: http://localhost:3000/auth/login');
    } else {
      console.log('❌ Something went wrong. Please check the database manually.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
diagnoseAuthIssue().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
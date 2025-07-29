import '../lib/config/envLoader';
import { prisma } from '../lib/prisma/prisma';

async function updateUserRole(email: string, role: string) {
  const validRoles = ['artist', 'assistant', 'admin'];
  
  if (!email || !role) {
    console.error('❌ Usage: npm run update:user-role <email> <role>');
    console.error(`   Valid roles: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  if (!validRoles.includes(role)) {
    console.error(`❌ Invalid role: ${role}`);
    console.error(`   Valid roles: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  console.log(`🔄 Updating user role...`);
  console.log(`   Email: ${email}`);
  console.log(`   New role: ${role}`);

  try {
    // Find and update user
    const user = await prisma.user.update({
      where: { email },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    console.log('\n✅ User role updated successfully!');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role} ${user.role === 'admin' ? '👑' : ''}`);

    if (role === 'admin') {
      console.log('\n🎉 User now has admin access to:');
      console.log('   - Email Templates management');
      console.log('   - Full dashboard access');
      console.log('   - All system settings');
    }

  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`\n❌ User with email '${email}' not found`);
      console.error('   Please check the email address and try again.');
    } else {
      console.error('\n❌ Error updating user role:', error.message);
    }
    process.exit(1);
  }
}

// Get command line arguments
const [,, email, role] = process.argv;

// Run the update
updateUserRole(email, role)
  .catch((error) => {
    console.error('Failed to update user role:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
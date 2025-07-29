import '../lib/config/envLoader';
import { prisma } from '../lib/prisma/prisma';

async function checkUserRole() {
  console.log('🔍 Checking user roles...\n');

  try {
    // List all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (users.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    console.log(`Found ${users.length} user(s):\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role} ${user.role === 'admin' ? '👑' : ''}`);
      console.log(`   Created: ${user.createdAt.toLocaleString()}`);
      console.log('');
    });

    // Check if any admin exists
    const adminCount = users.filter(u => u.role === 'admin').length;
    
    if (adminCount === 0) {
      console.log('⚠️  No admin users found!');
      console.log('   To make a user an admin, run:');
      console.log('   npm run update:user-role <user-email> admin');
    } else {
      console.log(`✅ Found ${adminCount} admin user(s)`);
    }

  } catch (error) {
    console.error('Error checking users:', error);
  }
}

// Run the check
checkUserRole()
  .catch((error) => {
    console.error('Failed to check user roles:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
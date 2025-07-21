import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')); // Hide password
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Test the connection
    await prisma.$connect();
    console.log('✅ Successfully connected to the database!');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in the database`);
    
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check if your Supabase project is active (not paused)');
    console.log('2. Verify the database password is correct');
    console.log('3. Ensure your IP is not blocked by Supabase');
    console.log('4. Try visiting your Supabase dashboard: https://app.supabase.com/project/jjozvqtgdutoidsylnoe');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
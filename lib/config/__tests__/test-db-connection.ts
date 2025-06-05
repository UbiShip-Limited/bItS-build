import { prisma } from '../../prisma/prisma.js';

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  try {
    // Test basic connection
    const count = await prisma.tattooRequest.count();
    console.log('✅ Database connected successfully!');
    console.log(`Current tattoo requests in database: ${count}`);
    
    // Test if we can query tattoo requests
    const recentRequests = await prisma.tattooRequest.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        description: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('\nRecent tattoo requests:');
    recentRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.description.substring(0, 50)}... (${req.status})`);
    });
    
  } catch (error: any) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. Your database is running');
    console.error('2. DATABASE_URL is correctly set in .env or .env.local');
    console.error('3. Migrations have been run: npm run db:migrate');
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
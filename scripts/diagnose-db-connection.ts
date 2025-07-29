#!/usr/bin/env tsx

/**
 * Database Connection Diagnostic Script
 * 
 * This script helps diagnose database connection issues in production environments.
 * Run this on Railway or any production environment to check database connectivity.
 */

import { PrismaClient } from '@prisma/client';

async function diagnosticTest() {
  console.log('🔍 Database Connection Diagnostic');
  console.log('================================\n');

  // 1. Environment Check
  console.log('1️⃣ Environment Variables:');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('   DATABASE_URL present:', !!process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set!');
    console.log('\n🔧 Fix: Set DATABASE_URL in your Railway environment variables');
    process.exit(1);
  }

  // 2. URL Parsing
  console.log('\n2️⃣ Database URL Analysis:');
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    console.log('   Protocol:', dbUrl.protocol);
    console.log('   Host:', dbUrl.hostname);
    console.log('   Port:', dbUrl.port || '5432');
    console.log('   Database:', dbUrl.pathname.slice(1));
    console.log('   Username:', dbUrl.username || 'not specified');
    console.log('   SSL Mode:', dbUrl.searchParams.get('sslmode') || 'not specified');
    
    // Check for Supabase
    if (dbUrl.hostname.includes('supabase.com')) {
      console.log('   🔧 Supabase database detected');
      
      if (dbUrl.hostname.includes('pooler.supabase.com')) {
        console.log('   ✅ Using Supabase connection pooler');
      } else {
        console.log('   ⚠️  Direct connection (consider using pooler for production)');
      }
    }
  } catch (error) {
    console.error('❌ Invalid DATABASE_URL format:', error.message);
    process.exit(1);
  }

  // 3. Network Connectivity Test
  console.log('\n3️⃣ Network Connectivity:');
  const dbUrl = new URL(process.env.DATABASE_URL);
  
  try {
    // Simple TCP connection test
    const net = await import('net');
    const socket = new net.Socket();
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.destroy();
        reject(new Error('Connection timeout (10s)'));
      }, 10000);
      
      socket.connect(parseInt(dbUrl.port || '5432'), dbUrl.hostname, () => {
        clearTimeout(timeout);
        console.log('   ✅ TCP connection successful');
        socket.destroy();
        resolve(true);
      });
      
      socket.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  } catch (error) {
    console.error('   ❌ Network connection failed:', error.message);
    console.log('   🔧 This could indicate:');
    console.log('      - Database server is down');
    console.log('      - Network firewall blocking connection');
    console.log('      - Incorrect hostname/port');
    // Don't exit here, continue with Prisma test
  }

  // 4. Prisma Connection Test
  console.log('\n4️⃣ Prisma Connection Test:');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });

  try {
    // Test basic connectivity
    console.log('   Testing basic connectivity...');
    await prisma.$executeRaw`SELECT 1 as test`;
    console.log('   ✅ Basic query successful');

    // Test user table access (the failing query from logs)
    console.log('   Testing user table access...');
    const userCount = await prisma.user.count();
    console.log(`   ✅ User table accessible (${userCount} users)`);

    // Test transaction capability
    console.log('   Testing transaction capability...');
    await prisma.$transaction([
      prisma.$executeRaw`SELECT 1 as transaction_test`
    ]);
    console.log('   ✅ Transactions working');

  } catch (error) {
    console.error('   ❌ Prisma connection failed:', error.message);
    console.log('   🔧 Error details:');
    console.log('      Name:', error.name);
    console.log('      Code:', error.code || 'not specified');
    
    if (error.message.includes('P1001')) {
      console.log('   💡 P1001: Can\'t reach database server');
      console.log('      - Check if Supabase project is paused');
      console.log('      - Verify DATABASE_URL is correct');
      console.log('      - Check network connectivity');
    } else if (error.message.includes('P1002')) {
      console.log('   💡 P1002: Database server timeout');
      console.log('      - Database server might be overloaded');
      console.log('      - Try increasing connection timeout');
    } else if (error.message.includes('P1003')) {
      console.log('   💡 P1003: Database does not exist');
      console.log('      - Verify database name in URL');
      console.log('      - Check if database was created');
    } else if (error.message.includes('authentication failed')) {
      console.log('   💡 Authentication failed');
      console.log('      - Check username/password in DATABASE_URL');
      console.log('      - Verify Supabase service role key');
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n✅ Diagnostic complete');
}

// Run diagnostic
diagnosticTest().catch((error) => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
}); 
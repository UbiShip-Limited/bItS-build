#!/usr/bin/env tsx

/**
 * Simple test to check Square revenue fetching
 * Run with: npx tsx scripts/test-square-revenue.ts
 */

import { PaymentsService } from '../lib/square/payments';
import { startOfDay, endOfDay, startOfWeek, startOfMonth } from 'date-fns';

async function testSquareRevenue() {
  console.log('🔍 Testing Square Revenue API\n');
  console.log('================================\n');

  try {
    // Check if Square is configured
    if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID) {
      console.error('❌ Square API credentials not configured');
      console.log('\nPlease set in your .env file:');
      console.log('  SQUARE_ACCESS_TOKEN=your_token_here');
      console.log('  SQUARE_LOCATION_ID=your_location_id');
      process.exit(1);
    }

    console.log('✅ Square credentials found\n');

    const paymentsService = new PaymentsService({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      locationId: process.env.SQUARE_LOCATION_ID,
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
      applicationId: process.env.SQUARE_APPLICATION_ID || ''
    });
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const weekStart = startOfWeek(today);
    const monthStart = startOfMonth(today);

    console.log('📅 Date ranges:');
    console.log(`  Today: ${todayStart.toLocaleString()} - ${todayEnd.toLocaleString()}`);
    console.log(`  Week: ${weekStart.toLocaleString()} - ${todayEnd.toLocaleString()}`);
    console.log(`  Month: ${monthStart.toLocaleString()} - ${todayEnd.toLocaleString()}\n`);

    // Fetch today's payments
    console.log('📊 Fetching today\'s payments...');
    const todayResponse = await paymentsService.getPayments(
      todayStart.toISOString(),
      todayEnd.toISOString(),
      undefined,
      100
    );

    const todayPayments = todayResponse.result?.payments || [];
    const todayCompleted = todayPayments.filter(p => p.status === 'COMPLETED');
    const todayRevenue = todayCompleted.reduce((sum, p) => 
      sum + (Number(p.amountMoney?.amount || 0) / 100), 0
    );

    console.log(`  Found ${todayPayments.length} payments (${todayCompleted.length} completed)`);
    console.log(`  💰 Today's revenue: $${todayRevenue.toFixed(2)}\n`);

    // Fetch this week's payments
    console.log('📊 Fetching this week\'s payments...');
    const weekResponse = await paymentsService.getPayments(
      weekStart.toISOString(),
      todayEnd.toISOString(),
      undefined,
      100
    );

    const weekPayments = weekResponse.result?.payments || [];
    const weekCompleted = weekPayments.filter(p => p.status === 'COMPLETED');
    const weekRevenue = weekCompleted.reduce((sum, p) => 
      sum + (Number(p.amountMoney?.amount || 0) / 100), 0
    );

    console.log(`  Found ${weekPayments.length} payments (${weekCompleted.length} completed)`);
    console.log(`  💰 This week's revenue: $${weekRevenue.toFixed(2)}\n`);

    // Fetch this month's payments
    console.log('📊 Fetching this month\'s payments...');
    const monthResponse = await paymentsService.getPayments(
      monthStart.toISOString(),
      todayEnd.toISOString(),
      undefined,
      100
    );

    const monthPayments = monthResponse.result?.payments || [];
    const monthCompleted = monthPayments.filter(p => p.status === 'COMPLETED');
    const monthRevenue = monthCompleted.reduce((sum, p) => 
      sum + (Number(p.amountMoney?.amount || 0) / 100), 0
    );

    console.log(`  Found ${monthPayments.length} payments (${monthCompleted.length} completed)`);
    console.log(`  💰 This month's revenue: $${monthRevenue.toFixed(2)}\n`);

    // Show sample payment details if any exist
    if (monthCompleted.length > 0) {
      console.log('📝 Sample payment details:');
      const sample = monthCompleted[0];
      console.log(`  ID: ${sample.id}`);
      console.log(`  Amount: $${Number(sample.amountMoney?.amount || 0) / 100}`);
      console.log(`  Status: ${sample.status}`);
      console.log(`  Created: ${sample.createdAt}`);
      console.log(`  Customer ID: ${sample.customerId || 'N/A'}`);
      console.log(`  Reference ID: ${sample.referenceId || 'N/A'}\n`);
    }

    console.log('================================');
    console.log('✅ Square API test completed!');
    console.log('\n💡 Dashboard should now show:');
    console.log(`  Today: $${todayRevenue.toFixed(2)}`);
    console.log(`  This Week: $${weekRevenue.toFixed(2)}`);
    console.log(`  This Month: $${monthRevenue.toFixed(2)}`);

    if (monthRevenue === 0) {
      console.log('\n⚠️  No revenue found. This could mean:');
      console.log('  1. No payments have been processed yet');
      console.log('  2. Payments exist but aren\'t marked as COMPLETED');
      console.log('  3. Wrong location ID is configured');
      console.log('\nTry creating a test payment in Square Dashboard');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('\nError details:', error.message);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.error('\n⚠️  Authentication error. Check your SQUARE_ACCESS_TOKEN');
      }
    }
    process.exit(1);
  }
}

// Run the test
testSquareRevenue().catch(console.error);
#!/usr/bin/env tsx

/**
 * Script to sync Square payments to local database
 * Run with: npx tsx scripts/sync-square-payments.ts
 */

import { PrismaClient } from '@prisma/client';
import { PaymentsService } from '../lib/square/payments';
import { startOfDay, endOfDay, subDays } from 'date-fns';

const prisma = new PrismaClient();

async function syncSquarePayments() {
  console.log('🔄 Starting Square Payments Sync\n');
  console.log('================================\n');

  try {
    // Check if Square is configured
    if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID) {
      console.error('❌ Square API credentials not configured');
      console.log('Please set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID in your .env file');
      process.exit(1);
    }

    const paymentsService = new PaymentsService({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      locationId: process.env.SQUARE_LOCATION_ID,
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
      applicationId: process.env.SQUARE_APPLICATION_ID || ''
    });
    
    // Fetch payments from the last 30 days
    const thirtyDaysAgo = subDays(new Date(), 30);
    const today = new Date();
    
    console.log(`📅 Fetching payments from ${thirtyDaysAgo.toLocaleDateString()} to ${today.toLocaleDateString()}`);
    
    const response = await paymentsService.getPayments(
      thirtyDaysAgo.toISOString(),
      today.toISOString(),
      undefined,
      200 // Get up to 200 payments
    );

    if (!response.result?.payments || response.result.payments.length === 0) {
      console.log('ℹ️ No payments found in Square');
      return;
    }

    console.log(`\n✅ Found ${response.result.payments.length} payments in Square\n`);

    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const squarePayment of response.result.payments) {
      try {
        // Check if payment already exists in database
        const existingPayment = await prisma.payment.findFirst({
          where: {
            OR: [
              { squareId: squarePayment.id },
              { referenceId: squarePayment.referenceId }
            ]
          }
        });

        if (existingPayment) {
          // Update existing payment
          await prisma.payment.update({
            where: { id: existingPayment.id },
            data: {
              status: squarePayment.status?.toLowerCase() || 'unknown',
              amount: Number(squarePayment.amountMoney?.amount || 0) / 100,
              paymentDetails: JSON.parse(JSON.stringify(squarePayment)),
              updatedAt: new Date()
            }
          });
          console.log(`📝 Updated payment: ${squarePayment.id} - $${Number(squarePayment.amountMoney?.amount || 0) / 100}`);
          syncedCount++;
        } else {
          // Create new payment record
          const payment = await prisma.payment.create({
            data: {
              squareId: squarePayment.id || '',
              amount: Number(squarePayment.amountMoney?.amount || 0) / 100,
              status: squarePayment.status?.toLowerCase() || 'unknown',
              paymentMethod: squarePayment.sourceType || 'square',
              referenceId: squarePayment.referenceId,
              customerId: squarePayment.customerId,
              paymentDetails: JSON.parse(JSON.stringify(squarePayment)),
              createdAt: squarePayment.createdAt ? new Date(squarePayment.createdAt) : new Date()
            }
          });
          console.log(`✨ Created payment: ${squarePayment.id} - $${Number(squarePayment.amountMoney?.amount || 0) / 100}`);
          syncedCount++;
        }
      } catch (error) {
        console.error(`❌ Error syncing payment ${squarePayment.id}:`, error);
        errorCount++;
      }
    }

    // Calculate total revenue
    const completedPayments = response.result.payments.filter(p => p.status === 'COMPLETED');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + (Number(p.amountMoney?.amount || 0) / 100), 0);

    console.log('\n================================');
    console.log('📊 Sync Summary:');
    console.log(`   Synced: ${syncedCount} payments`);
    console.log(`   Skipped: ${skippedCount} payments`);
    console.log(`   Errors: ${errorCount} payments`);
    console.log(`   Total Revenue (30 days): $${totalRevenue.toFixed(2)}`);
    console.log('\n✅ Square payments sync completed!');

    // Show revenue breakdown
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const todayPayments = completedPayments.filter(p => {
      const paymentDate = new Date(p.createdAt || '');
      return paymentDate >= todayStart && paymentDate <= todayEnd;
    });
    const todayRevenue = todayPayments.reduce((sum, p) => sum + (Number(p.amountMoney?.amount || 0) / 100), 0);

    console.log('\n💰 Revenue Breakdown:');
    console.log(`   Today: $${todayRevenue.toFixed(2)} (${todayPayments.length} payments)`);
    console.log(`   Last 30 days: $${totalRevenue.toFixed(2)} (${completedPayments.length} payments)`);

  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the sync
syncSquarePayments().catch(console.error);
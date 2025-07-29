#!/usr/bin/env tsx
/**
 * Script to sync Square bookings with local appointments
 * 
 * Usage:
 *   npm run sync:square-bookings
 *   npm run sync:square-bookings -- --days=30
 *   npm run sync:square-bookings -- --start=2024-01-01 --end=2024-12-31
 */

import { SquareBookingSyncJob } from '../lib/jobs/squareBookingSync';
import { parseArgs } from 'util';

async function main() {
  console.log('🔄 Square Booking Sync Script');
  console.log('============================');

  // Parse command line arguments
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      days: {
        type: 'string',
        short: 'd',
        default: '37' // 7 days past + 30 days future
      },
      start: {
        type: 'string',
        short: 's'
      },
      end: {
        type: 'string',
        short: 'e'
      },
      help: {
        type: 'boolean',
        short: 'h'
      }
    }
  });

  if (values.help) {
    console.log(`
Usage: npm run sync:square-bookings [options]

Options:
  -d, --days <number>     Number of days to sync (default: 37)
                          Syncs from 7 days ago to 30 days in future
  -s, --start <date>      Start date (YYYY-MM-DD)
  -e, --end <date>        End date (YYYY-MM-DD)
  -h, --help              Show this help message

Examples:
  npm run sync:square-bookings
  npm run sync:square-bookings -- --days=60
  npm run sync:square-bookings -- --start=2024-01-01 --end=2024-12-31
`);
    process.exit(0);
  }

  // Create sync job instance
  const syncJob = new SquareBookingSyncJob();

  // Check last sync status
  const lastStatus = await syncJob.getLastSyncStatus();
  if (lastStatus.lastRun) {
    console.log(`\n📊 Last sync: ${lastStatus.lastRun.toISOString()}`);
    console.log(`   Status: ${lastStatus.success ? '✅ Success' : '❌ Failed'}`);
    if (lastStatus.results) {
      console.log(`   Results: ${JSON.stringify(lastStatus.results, null, 2)}`);
    }
  }

  // Determine date range
  let startDate: Date;
  let endDate: Date;

  if (values.start && values.end) {
    startDate = new Date(values.start);
    endDate = new Date(values.end);
  } else {
    const days = parseInt(values.days || '37', 10);
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // 7 days in the past
    endDate = new Date();
    endDate.setDate(endDate.getDate() + (days - 7)); // Remaining days in the future
  }

  console.log(`\n📅 Syncing bookings from ${startDate.toDateString()} to ${endDate.toDateString()}`);

  // Run the sync
  console.log('\n🚀 Starting sync...\n');
  const result = await syncJob.run({ startDate, endDate });

  // Display results
  console.log('\n📈 Sync Results:');
  console.log('================');
  console.log(`✅ Success: ${result.success}`);
  console.log(`📊 Total synced: ${result.synced}`);
  console.log(`➕ Created: ${result.created}`);
  console.log(`🔄 Updated: ${result.updated}`);
  console.log(`❌ Errors: ${result.errors.length}`);
  console.log(`⏱️  Duration: ${result.duration}ms`);

  if (result.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    result.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. Booking ${error.bookingId}: ${error.error}`);
    });
  }

  console.log('\n✨ Square booking sync completed!\n');
  process.exit(result.success ? 0 : 1);
}

// Run the script
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
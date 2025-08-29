#!/usr/bin/env tsx
/**
 * Test Square API Connection
 * Run with: npx tsx scripts/test-square-connection.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client, Environment } from 'square';

console.log('🔌 Testing Square API Connection\n');
console.log('=' .repeat(60));

// Check environment variables
console.log('\n📋 Configuration:');
console.log(`  Environment: ${process.env.SQUARE_ENVIRONMENT || 'Not set'}`);
console.log(`  Location ID: ${process.env.SQUARE_LOCATION_ID || 'Not set'}`);
console.log(`  Access Token: ${process.env.SQUARE_ACCESS_TOKEN ? '✅ Set' : '❌ Not set'}`);
console.log(`  Application ID: ${process.env.SQUARE_APPLICATION_ID ? '✅ Set' : '❌ Not set'}`);

if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID) {
  console.error('\n❌ Missing required Square configuration');
  process.exit(1);
}

// Initialize the Square client
const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' 
    ? Environment.Production 
    : Environment.Sandbox
});

async function testConnection() {
  try {
    console.log('\n🔍 Testing API Connection...\n');
    
    // Test 1: Retrieve location
    const locationResponse = await client.locationsApi.retrieveLocation(
      process.env.SQUARE_LOCATION_ID!
    );
    
    if (locationResponse.result.location) {
      console.log('✅ Location Retrieved:');
      console.log(`  Name: ${locationResponse.result.location.name}`);
      console.log(`  Status: ${locationResponse.result.location.status}`);
      console.log(`  Currency: ${locationResponse.result.location.currency}`);
      console.log(`  Country: ${locationResponse.result.location.country}`);
      console.log(`  Business Hours: ${locationResponse.result.location.businessHours ? 'Set' : 'Not set'}`);
    }
    
    // Test 2: List recent payments
    console.log('\n📊 Recent Payments:');
    const paymentsResponse = await client.paymentsApi.listPayments(
      undefined, // begin_time
      undefined, // end_time
      undefined, // sort_order
      undefined, // cursor
      process.env.SQUARE_LOCATION_ID,
      undefined, // total
      undefined, // last_4
      undefined, // card_brand
      5 // limit
    );
    
    if (paymentsResponse.result.payments && paymentsResponse.result.payments.length > 0) {
      paymentsResponse.result.payments.forEach(payment => {
        console.log(`  - ${payment.id}: $${(Number(payment.amountMoney?.amount) / 100).toFixed(2)} ${payment.amountMoney?.currency} (${payment.status})`);
      });
    } else {
      console.log('  No recent payments found');
    }
    
    // Test 3: Check catalog items
    console.log('\n📦 Catalog Check:');
    const catalogResponse = await client.catalogApi.listCatalog(
      undefined, // cursor
      'ITEM', // types
      undefined // catalog_version
    );
    
    const itemCount = catalogResponse.result.objects?.length || 0;
    console.log(`  Total items: ${itemCount}`);
    
    // Test 4: Check team members (staff)
    console.log('\n👥 Team Members:');
    const teamResponse = await client.teamApi.searchTeamMembers({
      query: {
        filter: {
          locationIds: [process.env.SQUARE_LOCATION_ID!],
          status: 'ACTIVE'
        }
      }
    });
    
    const teamCount = teamResponse.result.teamMembers?.length || 0;
    console.log(`  Active team members: ${teamCount}`);
    
    // Test 5: Check webhook subscriptions
    console.log('\n🔔 Webhook Subscriptions:');
    try {
      const webhookResponse = await client.webhookSubscriptionsApi.listWebhookSubscriptions(
        undefined, // cursor
        false, // include_disabled
        undefined, // sort_order
        10 // limit
      );
      
      if (webhookResponse.result.subscriptions && webhookResponse.result.subscriptions.length > 0) {
        webhookResponse.result.subscriptions.forEach(sub => {
          console.log(`  - ${sub.name}: ${sub.enabled ? 'Enabled' : 'Disabled'}`);
          console.log(`    URL: ${sub.notificationUrl}`);
          console.log(`    Events: ${sub.eventTypes?.slice(0, 3).join(', ')}${(sub.eventTypes?.length || 0) > 3 ? '...' : ''}`);
        });
      } else {
        console.log('  No webhook subscriptions found');
      }
    } catch (error) {
      console.log('  Unable to check webhook subscriptions (requires app-level token)');
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n✅ Square API Connection Successful!\n');
    
    // Production readiness check
    console.log('📋 Production Readiness Checklist:');
    const checks = [
      { name: 'API Connection', status: true },
      { name: 'Location Active', status: locationResponse.result.location?.status === 'ACTIVE' },
      { name: 'Currency Set', status: !!locationResponse.result.location?.currency },
      { name: 'Environment', status: process.env.SQUARE_ENVIRONMENT || 'sandbox' },
      { name: 'Webhook Key', status: !!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY }
    ];
    
    checks.forEach(check => {
      if (check.name === 'Environment') {
        const icon = check.status === 'production' ? '✅' : '🟡';
        console.log(`  ${icon} ${check.name}: ${check.status}`);
      } else {
        console.log(`  ${check.status ? '✅' : '❌'} ${check.name}`);
      }
    });
    
    if (process.env.SQUARE_ENVIRONMENT !== 'production') {
      console.log('\n⚠️  Currently in SANDBOX mode');
      console.log('   To switch to production:');
      console.log('   1. Update SQUARE_ENVIRONMENT=production');
      console.log('   2. Update SQUARE_ACCESS_TOKEN with production token');
      console.log('   3. Verify SQUARE_LOCATION_ID matches production location');
    }
    
  } catch (error: any) {
    console.error('\n❌ Connection Test Failed:');
    console.error(`  Error: ${error.message}`);
    
    if (error.errors) {
      error.errors.forEach((err: any) => {
        console.error(`  - ${err.category}: ${err.code} - ${err.detail}`);
      });
    }
    
    process.exit(1);
  }
}

testConnection().catch(console.error);
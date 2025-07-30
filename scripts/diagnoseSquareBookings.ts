#!/usr/bin/env tsx
/**
 * Comprehensive Square Bookings API Diagnostic Script
 * 
 * This script tests Square API connectivity, permissions, and specifically
 * the Bookings List API that's causing 401 errors in production.
 * 
 * Usage: npm run diagnose:square
 */

import 'dotenv/config';
import { SquareClient, SquareEnvironment } from 'square';
import chalk from 'chalk';

const divider = '─'.repeat(60);

async function diagnoseSquareBookings() {
  console.log(chalk.bold.cyan('\n🔍 Square Bookings API Diagnostic Tool\n'));
  console.log(divider);
  
  // 1. Check Environment Variables
  console.log(chalk.bold('\n📋 Environment Configuration:\n'));
  
  const envVars = {
    'SQUARE_ACCESS_TOKEN': process.env.SQUARE_ACCESS_TOKEN,
    'SQUARE_LOCATION_ID': process.env.SQUARE_LOCATION_ID,
    'SQUARE_ENVIRONMENT': process.env.SQUARE_ENVIRONMENT,
    'SQUARE_WEBHOOK_SIGNATURE_KEY': process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
  };
  
  let hasRequiredVars = true;
  
  for (const [key, value] of Object.entries(envVars)) {
    if (key === 'SQUARE_WEBHOOK_SIGNATURE_KEY') {
      // Webhook key is optional
      console.log(`${key}: ${value ? chalk.green('✅ Set') : chalk.yellow('⚠️  Not set (webhooks won\'t work)')}`);
    } else {
      const isSet = !!value;
      console.log(`${key}: ${isSet ? chalk.green('✅ Set') : chalk.red('❌ Missing')}`);
      if (!isSet && key !== 'SQUARE_WEBHOOK_SIGNATURE_KEY') {
        hasRequiredVars = false;
      }
    }
  }
  
  if (!hasRequiredVars) {
    console.log(chalk.red('\n❌ Missing required environment variables. Please check your .env file.'));
    process.exit(1);
  }
  
  // Display environment mode
  const isSandbox = process.env.SQUARE_ENVIRONMENT !== 'production';
  console.log(`\nMode: ${isSandbox ? chalk.yellow('🧪 SANDBOX') : chalk.green('🚀 PRODUCTION')}`);
  console.log(divider);
  
  // 2. Initialize Square Client
  let client: SquareClient;
  try {
    client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN!,
      environment: isSandbox ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
    });
    console.log(chalk.green('\n✅ Square client initialized successfully'));
  } catch (error) {
    console.log(chalk.red('\n❌ Failed to initialize Square client:'), error);
    process.exit(1);
  }
  
  // 3. Test OAuth Token Info (Check Permissions)
  console.log(chalk.bold('\n🔐 Testing OAuth Token Permissions:\n'));
  
  try {
    const oauthResponse = await client.oAuthApi.retrieveTokenStatus(process.env.SQUARE_ACCESS_TOKEN!);
    
    if (oauthResponse.result) {
      const { scopes, expiresAt, merchantId } = oauthResponse.result;
      
      console.log(`Merchant ID: ${chalk.cyan(merchantId || 'Not specified')}`);
      console.log(`Token Expires: ${expiresAt ? chalk.yellow(expiresAt) : chalk.green('Never')}`);
      console.log(`\nGranted Permissions (${scopes?.length || 0} total):`);
      
      // Check for required permissions
      const requiredScopes = [
        'APPOINTMENTS_READ',
        'APPOINTMENTS_WRITE',
        'CUSTOMERS_READ',
        'CUSTOMERS_WRITE',
        'MERCHANT_PROFILE_READ'
      ];
      
      const grantedScopes = scopes || [];
      
      requiredScopes.forEach(scope => {
        const hasScope = grantedScopes.includes(scope);
        console.log(`  ${scope}: ${hasScope ? chalk.green('✅') : chalk.red('❌ Missing')}`);
      });
      
      // Show other permissions
      const otherScopes = grantedScopes.filter(s => !requiredScopes.includes(s));
      if (otherScopes.length > 0) {
        console.log('\nOther Permissions:');
        otherScopes.forEach(scope => {
          console.log(`  ${scope}: ${chalk.green('✅')}`);
        });
      }
      
      // Check if we have bookings permissions
      const hasBookingsRead = grantedScopes.includes('APPOINTMENTS_READ');
      const hasBookingsWrite = grantedScopes.includes('APPOINTMENTS_WRITE');
      
      if (!hasBookingsRead || !hasBookingsWrite) {
        console.log(chalk.red('\n⚠️  WARNING: Missing required Bookings API permissions!'));
        console.log(chalk.yellow('This is likely causing the 401 errors.'));
        console.log(chalk.yellow('Please regenerate your access token with APPOINTMENTS_READ and APPOINTMENTS_WRITE scopes.'));
      }
    }
  } catch (error: any) {
    console.log(chalk.red('❌ Failed to retrieve token info:'), error.message);
    if (error.statusCode === 401) {
      console.log(chalk.red('\n🚨 401 UNAUTHORIZED - Your access token is invalid or expired!'));
    }
  }
  
  console.log('\n' + divider);
  
  // 4. Test Basic API Access (Locations)
  console.log(chalk.bold('\n📍 Testing Basic API Access (Locations):\n'));
  
  try {
    const locationsResponse = await client.locationsApi.listLocations();
    
    if (locationsResponse.result?.locations) {
      console.log(chalk.green(`✅ Successfully retrieved ${locationsResponse.result.locations.length} location(s):`));
      locationsResponse.result.locations.forEach(location => {
        console.log(`   - ${location.name} (${location.id})`);
        if (location.id === process.env.SQUARE_LOCATION_ID) {
          console.log(chalk.green('     ^ This matches your SQUARE_LOCATION_ID'));
        }
      });
    }
  } catch (error: any) {
    console.log(chalk.red('❌ Failed to list locations:'), error.message);
  }
  
  console.log('\n' + divider);
  
  // 5. Test Bookings API - The Critical Test
  console.log(chalk.bold('\n📅 Testing Bookings API (This is where the 401 error occurs):\n'));
  
  try {
    // First, test listing team members (required for bookings)
    console.log('Testing Team Members API...');
    const teamMembersResponse = await client.bookingsApi.listTeamMemberBookingProfiles();
    
    if (teamMembersResponse.result?.teamMemberBookingProfiles) {
      console.log(chalk.green(`✅ Found ${teamMembersResponse.result.teamMemberBookingProfiles.length} team member(s)`));
    } else {
      console.log(chalk.yellow('⚠️  No team members configured for bookings'));
    }
    
    // Now test the actual listBookings call that's failing
    console.log('\nTesting List Bookings API (the failing endpoint)...');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // 7 days ago
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 days from now
    
    try {
      const bookingsResponse = await client.bookingsApi.listBookings({
        locationId: process.env.SQUARE_LOCATION_ID,
        startAtMin: startDate.toISOString(),
        startAtMax: endDate.toISOString(),
        limit: 10
      });
      
      if (bookingsResponse.result) {
        const bookingCount = bookingsResponse.result.bookings?.length || 0;
        console.log(chalk.green(`✅ Successfully called List Bookings API!`));
        console.log(`   Found ${bookingCount} booking(s) in the date range`);
        
        if (bookingCount > 0 && bookingsResponse.result.bookings) {
          console.log('\n   Recent bookings:');
          bookingsResponse.result.bookings.slice(0, 3).forEach(booking => {
            console.log(`   - ${booking.id} (${booking.status}) - ${booking.startAt}`);
          });
        }
      }
    } catch (bookingError: any) {
      console.log(chalk.red('❌ Failed to list bookings:'), bookingError.message);
      
      if (bookingError.statusCode === 401) {
        console.log(chalk.red('\n🚨 401 UNAUTHORIZED on Bookings API!'));
        console.log(chalk.red('This is the exact error happening in your production logs.'));
        
        console.log(chalk.yellow('\nPossible causes:'));
        console.log(chalk.yellow('1. Access token missing APPOINTMENTS_READ permission'));
        console.log(chalk.yellow('2. Using wrong environment (sandbox token with production setting)'));
        console.log(chalk.yellow('3. Access token is expired or invalid'));
        console.log(chalk.yellow('4. Location ID mismatch between token and configured location'));
      } else if (bookingError.statusCode === 404) {
        console.log(chalk.yellow('⚠️  404 Not Found - Bookings API endpoint not available'));
        console.log(chalk.yellow('This might happen if Bookings are not enabled for your Square account'));
      }
      
      // Log detailed error info
      if (bookingError.errors && bookingError.errors.length > 0) {
        console.log('\nDetailed error info:');
        bookingError.errors.forEach((err: any) => {
          console.log(`  - ${err.category}: ${err.code} - ${err.detail}`);
        });
      }
    }
  } catch (error: any) {
    console.log(chalk.red('❌ Bookings API test failed:'), error.message);
  }
  
  console.log('\n' + divider);
  
  // 6. Summary and Recommendations
  console.log(chalk.bold('\n📊 Diagnostic Summary:\n'));
  
  if (isSandbox) {
    console.log(chalk.yellow('🧪 You are using SANDBOX credentials'));
    console.log(chalk.yellow('   - This is appropriate for soft launch/testing'));
    console.log(chalk.yellow('   - Switch to production credentials when going live'));
  }
  
  console.log(chalk.bold('\n💡 Recommendations:\n'));
  
  console.log('1. ' + chalk.cyan('For the 401 Error:'));
  console.log('   - Regenerate your Square access token with APPOINTMENTS_READ/WRITE permissions');
  console.log('   - In Square Dashboard: Apps → Your App → OAuth → Permissions');
  console.log('   - Make sure to select all Appointments/Bookings related permissions');
  
  console.log('\n2. ' + chalk.cyan('For Soft Launch:'));
  console.log('   - Add DISABLE_SQUARE_SYNC=true to your .env to stop automatic sync');
  console.log('   - This will prevent the 401 errors in your logs');
  console.log('   - Webhooks will still work for real-time updates');
  
  console.log('\n3. ' + chalk.cyan('Before Production:'));
  console.log('   - Switch to production Square credentials');
  console.log('   - Update SQUARE_ENVIRONMENT=production');
  console.log('   - Ensure webhook URL points to production domain');
  console.log('   - Test thoroughly with production credentials');
  
  console.log('\n' + divider);
  console.log(chalk.green('\n✅ Diagnostic complete!\n'));
}

// Run the diagnostic
diagnoseSquareBookings().catch(error => {
  console.error(chalk.red('\n❌ Diagnostic script failed:'), error);
  process.exit(1);
});
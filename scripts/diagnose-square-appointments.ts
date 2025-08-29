#!/usr/bin/env tsx
/**
 * Diagnostic script for Square Appointments API issues
 * Specifically for troubleshooting "Merchant not onboarded to Appointments" error
 * 
 * Run with: npx tsx scripts/diagnose-square-appointments.ts
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Client, Environment } from 'square';

const REQUIRED_SCOPES = [
  'APPOINTMENTS_ALL_READ',
  'APPOINTMENTS_ALL_WRITE',
  'APPOINTMENTS_READ',
  'APPOINTMENTS_WRITE',
  'MERCHANT_PROFILE_READ',
  'EMPLOYEES_READ',
  'ITEMS_READ'
];

async function diagnoseSquareAppointments() {
  console.log('🔍 SQUARE APPOINTMENTS DIAGNOSTIC TOOL\n');
  console.log('=' .repeat(70));
  
  // Step 1: Check environment variables
  console.log('\n📋 Step 1: Environment Configuration Check\n');
  
  const config = {
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    locationId: process.env.SQUARE_LOCATION_ID,
    environment: process.env.SQUARE_ENVIRONMENT,
    applicationId: process.env.SQUARE_APPLICATION_ID
  };
  
  console.log('Configuration Status:');
  console.log(`  Access Token: ${config.accessToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Location ID: ${config.locationId ? `✅ ${config.locationId}` : '❌ Missing'}`);
  console.log(`  Environment: ${config.environment ? `✅ ${config.environment}` : '⚠️  Not set (defaulting to sandbox)'}`);
  console.log(`  Application ID: ${config.applicationId ? '✅ Set' : '⚠️  Optional'}`);
  
  if (!config.accessToken || !config.locationId) {
    console.error('\n❌ Missing required configuration. Please check your .env file.');
    process.exit(1);
  }
  
  // Initialize Square client
  const client = new Client({
    accessToken: config.accessToken,
    environment: config.environment === 'production' ? Environment.Production : Environment.Sandbox
  });
  
  // Step 2: Verify merchant account
  console.log('\n📋 Step 2: Merchant Account Verification\n');
  
  try {
    const merchantResponse = await client.merchantsApi.listMerchants();
    const merchant = merchantResponse.result.merchant?.[0];
    
    if (merchant) {
      console.log('Merchant Information:');
      console.log(`  ID: ${merchant.id}`);
      console.log(`  Business Name: ${merchant.businessName || 'Not set'}`);
      console.log(`  Country: ${merchant.country}`);
      console.log(`  Status: ${merchant.status}`);
      console.log(`  Currency: ${merchant.currency}`);
    }
  } catch (error: any) {
    console.error('❌ Failed to retrieve merchant info:', error.message);
  }
  
  // Step 3: Verify location details
  console.log('\n📋 Step 3: Location Verification\n');
  
  try {
    const locationResponse = await client.locationsApi.retrieveLocation(config.locationId!);
    const location = locationResponse.result.location;
    
    if (location) {
      console.log('Location Information:');
      console.log(`  Name: ${location.name}`);
      console.log(`  Status: ${location.status}`);
      console.log(`  Type: ${location.type || 'Not specified'}`);
      console.log(`  Country: ${location.country}`);
      console.log(`  Capabilities: ${location.capabilities?.join(', ') || 'None listed'}`);
      
      // Check if location has APPOINTMENTS capability
      const hasAppointments = location.capabilities?.includes('APPOINTMENTS');
      console.log(`\n  🔑 Appointments Capability: ${hasAppointments ? '✅ ENABLED' : '❌ NOT ENABLED'}`);
      
      if (!hasAppointments) {
        console.log('\n⚠️  IMPORTANT: This location does not have APPOINTMENTS capability enabled!');
        console.log('  This is likely the cause of the "not onboarded" error.');
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to retrieve location:', error.message);
  }
  
  // Step 4: Check OAuth token scopes (if possible)
  console.log('\n📋 Step 4: OAuth Token Permissions Check\n');
  
  try {
    // Try to retrieve token info using the OAuth API
    const tokenInfoResponse = await client.oAuthApi.retrieveTokenStatus(config.accessToken!);
    
    if (tokenInfoResponse.result.scopes) {
      console.log('Token Scopes:');
      const scopes = tokenInfoResponse.result.scopes;
      
      REQUIRED_SCOPES.forEach(scope => {
        const hasScope = scopes.includes(scope);
        console.log(`  ${scope}: ${hasScope ? '✅' : '❌'}`);
      });
      
      const hasAppointmentScopes = scopes.some(s => s.includes('APPOINTMENTS'));
      if (!hasAppointmentScopes) {
        console.log('\n⚠️  WARNING: Token does not have any APPOINTMENTS scopes!');
        console.log('  You need to regenerate the access token with proper permissions.');
      }
    }
  } catch (error: any) {
    console.log('⚠️  Could not retrieve token scopes (this is normal for personal access tokens)');
    console.log('  Error:', error.errors?.[0]?.detail || error.message);
  }
  
  // Step 5: Test team members (required for appointments)
  console.log('\n📋 Step 5: Team Members Check\n');
  
  try {
    const teamResponse = await client.teamApi.searchTeamMembers({
      query: {
        filter: {
          locationIds: [config.locationId!],
          status: 'ACTIVE'
        }
      }
    });
    
    const teamMembers = teamResponse.result.teamMembers || [];
    console.log(`Active Team Members: ${teamMembers.length}`);
    
    if (teamMembers.length === 0) {
      console.log('⚠️  WARNING: No active team members found!');
      console.log('  Square Appointments requires at least one team member.');
    } else {
      teamMembers.slice(0, 3).forEach(member => {
        console.log(`  - ${member.givenName} ${member.familyName || ''} (${member.id})`);
      });
      if (teamMembers.length > 3) {
        console.log(`  ... and ${teamMembers.length - 3} more`);
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to retrieve team members:', error.errors?.[0]?.detail || error.message);
    console.log('  This might indicate the account lacks employee management permissions.');
  }
  
  // Step 6: Test Appointments API directly
  console.log('\n📋 Step 6: Testing Appointments API Access\n');
  
  // Test 1: Try to list bookings (read operation)
  console.log('Testing: List Bookings (Read Operation)');
  try {
    const bookingsResponse = await client.bookingsApi.listBookings({
      locationId: config.locationId!,
      limit: 1
    });
    console.log('  ✅ Can list bookings - Read access working');
    console.log(`  Found ${bookingsResponse.result.bookings?.length || 0} bookings`);
  } catch (error: any) {
    console.error('  ❌ Cannot list bookings:', error.errors?.[0]?.detail || error.message);
    
    if (error.errors?.[0]?.code === 'UNAUTHORIZED' && 
        error.errors?.[0]?.detail?.includes('not onboarded')) {
      console.log('\n🚨 CONFIRMED: "Merchant not onboarded to Appointments" error detected!');
    }
  }
  
  // Test 2: Try to list services (required for appointments)
  console.log('\nTesting: List Catalog Services');
  try {
    const catalogResponse = await client.catalogApi.listCatalog({
      types: 'ITEM_VARIATION'
    });
    const services = catalogResponse.result.objects?.filter(
      obj => obj.itemVariationData?.itemId
    ) || [];
    console.log(`  ✅ Can access catalog - Found ${services.length} service variations`);
  } catch (error: any) {
    console.error('  ❌ Cannot access catalog:', error.errors?.[0]?.detail || error.message);
  }
  
  // Step 7: Provide diagnosis and recommendations
  console.log('\n' + '=' .repeat(70));
  console.log('\n📊 DIAGNOSIS SUMMARY\n');
  
  const issues: string[] = [];
  const actions: string[] = [];
  
  // Analyze results and provide recommendations
  try {
    const locationResponse = await client.locationsApi.retrieveLocation(config.locationId!);
    const hasAppointments = locationResponse.result.location?.capabilities?.includes('APPOINTMENTS');
    
    if (!hasAppointments) {
      issues.push('Location does not have APPOINTMENTS capability');
      actions.push('Enable Square Appointments for this location in Square Dashboard');
      actions.push('Navigate to Square Dashboard > Appointments > Settings > Locations');
    }
  } catch (error) {
    issues.push('Cannot verify location capabilities');
  }
  
  // Check team members
  try {
    const teamResponse = await client.teamApi.searchTeamMembers({
      query: {
        filter: {
          locationIds: [config.locationId!],
          status: 'ACTIVE'
        }
      }
    });
    
    if (!teamResponse.result.teamMembers || teamResponse.result.teamMembers.length === 0) {
      issues.push('No active team members configured');
      actions.push('Add at least one team member in Square Dashboard > Team > Team Members');
    }
  } catch (error) {
    issues.push('Cannot access team members (may need EMPLOYEES_READ permission)');
  }
  
  if (issues.length > 0) {
    console.log('🔴 Issues Found:');
    issues.forEach(issue => console.log(`  • ${issue}`));
    
    console.log('\n✅ Recommended Actions:');
    actions.forEach((action, index) => console.log(`  ${index + 1}. ${action}`));
  } else {
    console.log('✅ No major issues detected with Square Appointments configuration');
  }
  
  console.log('\n📝 Additional Steps to Try:\n');
  console.log('1. Log into Square Dashboard at https://squareup.com/dashboard');
  console.log('2. Navigate to "Apps" > "Square Appointments"');
  console.log('3. Ensure you have an active Square Appointments subscription');
  console.log('4. Complete any pending onboarding steps shown in the dashboard');
  console.log('5. Verify the location ID in your .env matches an Appointments-enabled location');
  console.log('6. Regenerate your access token after enabling Appointments');
  console.log('\nIf issues persist, contact Square Support with this diagnostic output.');
  
  console.log('\n' + '=' .repeat(70));
}

// Run the diagnostic
diagnoseSquareAppointments()
  .then(() => {
    console.log('\n✨ Diagnostic complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Diagnostic failed:', error);
    process.exit(1);
  });
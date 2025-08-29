import * as dotenv from 'dotenv';
dotenv.config();

async function testSquareConnection() {
  console.log('🔍 Testing Square API Connection...\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('SQUARE_ACCESS_TOKEN:', process.env.SQUARE_ACCESS_TOKEN ? '✓ Set' : '✗ Missing');
  console.log('SQUARE_LOCATION_ID:', process.env.SQUARE_LOCATION_ID || '✗ Missing');
  console.log('SQUARE_ENVIRONMENT:', process.env.SQUARE_ENVIRONMENT || '✗ Missing');
  console.log('SQUARE_APPLICATION_ID:', process.env.SQUARE_APPLICATION_ID ? '✓ Set' : '✗ Missing');
  console.log('\n');

  if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID) {
    console.error('❌ Missing required Square credentials!');
    process.exit(1);
  }

  // Dynamically import Square to avoid ESM issues
  const { Client, Environment, ApiError } = await import('square');
  
  // Initialize Square client
  const client = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox,
  });

  try {
    // Test 1: List locations
    console.log('📍 Testing: List Locations...');
    const locationsResponse = await client.locationsApi.listLocations();
    if (locationsResponse.result.locations) {
      console.log(`✓ Found ${locationsResponse.result.locations.length} location(s)`);
      locationsResponse.result.locations.forEach(loc => {
        console.log(`  - ${loc.name} (${loc.id})`);
      });
    }
    console.log('');

    // Test 2: Get specific location
    console.log('📍 Testing: Get Specific Location...');
    const locationResponse = await client.locationsApi.retrieveLocation(process.env.SQUARE_LOCATION_ID!);
    console.log(`✓ Location found: ${locationResponse.result.location?.name}`);
    console.log(`  Status: ${locationResponse.result.location?.status}`);
    console.log('');

    // Test 3: List team members
    console.log('👥 Testing: List Team Members...');
    const teamResponse = await client.teamApi.searchTeamMembers({
      query: {
        filter: {
          locationIds: [process.env.SQUARE_LOCATION_ID!],
          status: 'ACTIVE'
        }
      }
    });
    console.log(`✓ Found ${teamResponse.result.teamMembers?.length || 0} team member(s)`);
    teamResponse.result.teamMembers?.forEach(member => {
      console.log(`  - ${member.givenName} ${member.familyName} (${member.id})`);
    });
    console.log('');

    // Test 4: List booking profiles (if available)
    console.log('📅 Testing: List Booking Profiles...');
    try {
      const bookingsResponse = await client.bookingsApi.listBookingProfiles();
      console.log(`✓ Found ${bookingsResponse.result.bookingProfiles?.length || 0} booking profile(s)`);
      bookingsResponse.result.bookingProfiles?.forEach(profile => {
        console.log(`  - ${profile.displayName} (${profile.id})`);
      });
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        console.log('⚠️  Bookings API not available (needs Square Appointments subscription)');
      } else {
        throw error;
      }
    }
    console.log('');

    // Test 5: List customers
    console.log('👤 Testing: List Customers...');
    const customersResponse = await client.customersApi.listCustomers({
      limit: 5
    });
    console.log(`✓ Found ${customersResponse.result.customers?.length || 0} customer(s) (showing max 5)`);
    console.log('');

    console.log('✅ Square API connection successful!');
    console.log('All basic operations are working correctly.');
    
  } catch (error) {
    console.error('❌ Square API Error:');
    if (error instanceof ApiError) {
      console.error('Status:', error.statusCode);
      console.error('Errors:', JSON.stringify(error.errors, null, 2));
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

testSquareConnection().catch(console.error);
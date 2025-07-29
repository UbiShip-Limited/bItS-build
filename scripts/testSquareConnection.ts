import 'dotenv/config';
import { SquareClient, SquareEnvironment } from 'square';

async function testConnection() {
  console.log('🔍 Testing Square API Connection\n');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('- SQUARE_ACCESS_TOKEN:', process.env.SQUARE_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
  console.log('- SQUARE_LOCATION_ID:', process.env.SQUARE_LOCATION_ID || '❌ Missing');
  console.log('- SQUARE_ENVIRONMENT:', process.env.SQUARE_ENVIRONMENT || '❌ Missing');
  console.log('');

  if (!process.env.SQUARE_ACCESS_TOKEN) {
    console.error('❌ SQUARE_ACCESS_TOKEN is required');
    process.exit(1);
  }

  // Initialize Square client
  const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.SQUARE_ENVIRONMENT === 'production' 
      ? SquareEnvironment.Production 
      : SquareEnvironment.Sandbox
  });

  try {
    // Test 1: List locations
    console.log('📍 Testing: List Locations...');
    const locationsResponse = await client.locations.list() as any;
    
    console.log('Raw locations response:', JSON.stringify(locationsResponse, null, 2));
    
    if (locationsResponse.result?.locations) {
      console.log(`✅ Found ${locationsResponse.result.locations.length} location(s):`);
      locationsResponse.result.locations.forEach((location: any) => {
        console.log(`   - ${location.name} (ID: ${location.id})`);
      });
    } else if (locationsResponse.locations) {
      console.log(`✅ Found ${locationsResponse.locations.length} location(s):`);
      locationsResponse.locations.forEach((location: any) => {
        console.log(`   - ${location.name} (ID: ${location.id})`);
      });
    } else {
      console.log('❌ No locations found in response');
    }
    console.log('');

    // Test 2: List existing customers
    console.log('👥 Testing: List Customers...');
    const customersResponse = await client.customers.list({ limit: 5 }) as any;
    
    if (customersResponse.data?.customers) {
      console.log(`✅ Found ${customersResponse.data.customers.length} customer(s)`);
    } else {
      console.log('ℹ️  No customers found (this is normal for a new sandbox)');
    }
    console.log('');

    // Test 3: Create a test customer
    console.log('🧪 Testing: Create Customer...');
    const testCustomer = {
      givenName: 'Test',
      familyName: 'Customer',
      emailAddress: `test${Date.now()}@example.com`,
      note: 'Created by connection test script'
    };

    try {
      const createResponse = await client.customers.create(testCustomer) as any;
      
      if (createResponse.data?.customer) {
        console.log(`✅ Successfully created customer: ${createResponse.data.customer.id}`);
        console.log(`   Name: ${createResponse.data.customer.givenName} ${createResponse.data.customer.familyName}`);
        console.log(`   Email: ${createResponse.data.customer.emailAddress}`);
      }
    } catch (error: any) {
      console.error('❌ Failed to create customer:', error.message);
      if (error.errors) {
        error.errors.forEach((err: any) => {
          console.error(`   - ${err.code}: ${err.detail}`);
        });
      }
    }

    console.log('\n✅ Square API connection test completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Square API test failed:', error.message);
    if (error.errors) {
      console.error('\nError details:');
      error.errors.forEach((err: any) => {
        console.error(`- ${err.code}: ${err.detail}`);
      });
    }
    process.exit(1);
  }
}

testConnection().catch(console.error);
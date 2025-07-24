import 'dotenv/config';
import { SquareClient, SquareEnvironment } from 'square';

async function listLocations() {
  console.log('🔍 Listing Square Locations\n');

  const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN || '',
    environment: process.env.SQUARE_ENVIRONMENT === 'production' 
      ? SquareEnvironment.Production 
      : SquareEnvironment.Sandbox
  });

  try {
    const response = await client.locations.list() as any;
    const locations = response.result?.locations || response.locations || [];

    if (locations.length === 0) {
      console.log('❌ No locations found');
      console.log('\nTo create a sandbox location:');
      console.log('1. Go to https://developer.squareup.com/console/sandbox');
      console.log('2. Click on "Locations" in the left sidebar');
      console.log('3. Create a new location or use the default one');
      return;
    }

    console.log(`Found ${locations.length} location(s):\n`);
    
    locations.forEach((location: any, index: number) => {
      console.log(`Location ${index + 1}:`);
      console.log(`  Name: ${location.name}`);
      console.log(`  ID: ${location.id}`);
      console.log(`  Status: ${location.status}`);
      console.log(`  Country: ${location.country}`);
      console.log(`  Currency: ${location.currency}`);
      console.log(`  Capabilities: ${location.capabilities?.join(', ') || 'None'}`);
      console.log('');
    });

    console.log(`\n💡 Current SQUARE_LOCATION_ID in .env: ${process.env.SQUARE_LOCATION_ID}`);
    
    if (locations.length === 1 && locations[0].id !== process.env.SQUARE_LOCATION_ID) {
      console.log(`\n⚠️  Your .env file has a different location ID.`);
      console.log(`   Update your .env file with: SQUARE_LOCATION_ID=${locations[0].id}`);
    }

  } catch (error: any) {
    console.error('❌ Failed to list locations:', error.message);
    if (error.errors) {
      error.errors.forEach((err: any) => {
        console.error(`   - ${err.code}: ${err.detail}`);
      });
    }
  }
}

listLocations().catch(console.error);
import * as dotenv from 'dotenv';
import { Client } from 'square';

dotenv.config();

console.log('Square Quick Test');
console.log('-----------------');
console.log('TOKEN:', process.env.SQUARE_ACCESS_TOKEN ? 'Set' : 'Missing');
console.log('LOCATION:', process.env.SQUARE_LOCATION_ID || 'Missing');
console.log('ENVIRONMENT:', process.env.SQUARE_ENVIRONMENT || 'Missing');

if (!process.env.SQUARE_ACCESS_TOKEN) {
  console.error('\n❌ SQUARE_ACCESS_TOKEN is missing!');
  process.exit(1);
}

const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
});

console.log('\n📍 Testing locations endpoint...');

client.locationsApi.listLocations()
  .then(response => {
    console.log('✅ Success! Found', response.result.locations?.length, 'location(s)');
    response.result.locations?.forEach(loc => {
      console.log(`  - ${loc.name} (${loc.id})`);
    });
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      console.error('Details:', JSON.stringify(error.errors, null, 2));
    }
    process.exit(1);
  });
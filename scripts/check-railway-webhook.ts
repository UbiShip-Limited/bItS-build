#!/usr/bin/env tsx
/**
 * Check Railway deployment webhook endpoint
 * Run with: npx tsx scripts/check-railway-webhook.ts
 */

console.log('🚂 Railway Webhook Endpoint Checker\n');
console.log('=' .repeat(50));

console.log('\n📝 Instructions to find your webhook URL:\n');

console.log('1. Go to your Railway dashboard: https://railway.app/dashboard');
console.log('2. Click on your backend/server deployment');
console.log('3. Look for the "Deployment URL" or generate one if not exists');
console.log('4. Your webhook URL will be:\n');

console.log('   https://[your-deployment].up.railway.app/api/v1/webhooks/square\n');

console.log('=' .repeat(50));

console.log('\n🔧 Common Railway deployment URLs:\n');

const possibleUrls = [
  'bowenislandtattooshop-production',
  'bowenislandtattooshop-backend', 
  'bowenislandtattooshop-server',
  'bowenislandtattooshop',
  'bits-backend',
  'bits-server'
];

console.log('Try these URLs in Square Dashboard:\n');
possibleUrls.forEach(subdomain => {
  console.log(`• https://${subdomain}.up.railway.app/api/v1/webhooks/square`);
});

console.log('\n=' .repeat(50));
console.log('\n✅ Once you find the correct URL:');
console.log('1. Enter it in Square Dashboard with https:// prefix');
console.log('2. Subscribe to these events:');
console.log('   - booking.created');
console.log('   - booking.updated'); 
console.log('   - payment.created');
console.log('   - payment.updated');
console.log('3. Copy the Signature Key');
console.log('4. Add to Railway environment variables:');
console.log('   SQUARE_WEBHOOK_SIGNATURE_KEY=your_signature_key');
console.log('\n=' .repeat(50));

// Test health endpoint to verify deployment
console.log('\n🔍 Testing common health endpoints...\n');

async function testHealthEndpoint(baseUrl: string) {
  try {
    const response = await fetch(`https://${baseUrl}.up.railway.app/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      console.log(`✅ Found working deployment: https://${baseUrl}.up.railway.app`);
      console.log(`   Webhook URL: https://${baseUrl}.up.railway.app/api/v1/webhooks/square`);
      return true;
    }
  } catch (error) {
    // Silent fail - endpoint doesn't exist
  }
  return false;
}

async function checkEndpoints() {
  let foundAny = false;
  
  for (const subdomain of possibleUrls) {
    const found = await testHealthEndpoint(subdomain);
    if (found) foundAny = true;
  }
  
  if (!foundAny) {
    console.log('❌ No working deployments found at common URLs');
    console.log('   Please check your Railway dashboard for the actual URL');
  }
}

checkEndpoints().catch(console.error);
#!/usr/bin/env tsx
/**
 * Test webhook endpoint accessibility
 * Run with: npx tsx scripts/test-webhook-endpoint.ts
 */

async function testWebhookEndpoint() {
  const endpoints = [
    'https://bowenislandtattooshop.com/api/v1/webhooks/square',
    'https://api.bowenislandtattooshop.com/api/v1/webhooks/square',
    // Add your actual deployment URL here if different
  ];

  console.log('🔍 Testing Webhook Endpoints\n');
  console.log('=' .repeat(50));

  for (const url of endpoints) {
    console.log(`\nTesting: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test',
          event_id: 'test-123',
          created_at: new Date().toISOString(),
          data: {}
        })
      });

      console.log(`  Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 401) {
        console.log('  ✅ Endpoint reachable (signature validation working)');
      } else if (response.status === 400 || response.status === 500) {
        console.log('  ✅ Endpoint reachable (but needs configuration)');
      } else if (response.status === 200) {
        console.log('  ⚠️  Endpoint accepting unsigned requests (check security)');
      } else {
        console.log('  ❓ Unexpected response');
      }
      
      const text = await response.text();
      if (text) {
        console.log(`  Response: ${text.substring(0, 100)}`);
      }
    } catch (error: any) {
      console.log(`  ❌ Failed to reach endpoint: ${error.message}`);
      if (error.cause) {
        console.log(`     ${error.cause}`);
      }
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('\n📝 Next Steps:');
  console.log('1. Use the URL that returns status 401 (signature validation)');
  console.log('2. Add https:// prefix to the URL in Square Dashboard');
  console.log('3. Copy the signature key from Square to SQUARE_WEBHOOK_SIGNATURE_KEY');
  console.log('4. Test webhook delivery from Square Dashboard');
}

testWebhookEndpoint().catch(console.error);
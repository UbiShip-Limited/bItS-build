#!/usr/bin/env npx tsx
import axios from 'axios';

const PRODUCTION_API = 'https://bits-build-production.up.railway.app';
const REQUEST_ID = '81830f80-7ce5-4917-98a3-ffd63169b860';

// You'll need to get a valid auth token from the browser
// Open the browser console and run:
// localStorage.getItem('sb-jjozvqtgdutoidsylnoe-auth-token')
// Then paste the access_token value here
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

async function testProductionAPI() {
  console.log('🔍 Testing Production API\n');
  
  if (!AUTH_TOKEN) {
    console.log('⚠️  No auth token provided. Set AUTH_TOKEN environment variable.');
    console.log('To get a token, open the browser console on the logged-in site and run:');
    console.log('JSON.parse(localStorage.getItem("sb-jjozvqtgdutoidsylnoe-auth-token")).access_token');
    return;
  }
  
  try {
    // Test 1: List endpoint (this works according to logs)
    console.log('Test 1: Fetching tattoo requests list...');
    const listResponse = await axios.get(`${PRODUCTION_API}/tattoo-requests?page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    console.log('✅ List endpoint works');
    console.log(`   Found ${listResponse.data.data.length} requests`);
    
    // Show the first request ID
    if (listResponse.data.data.length > 0) {
      console.log(`   First request ID: ${listResponse.data.data[0].id}`);
    }
    
    // Test 2: Individual request endpoint
    console.log('\nTest 2: Fetching individual tattoo request...');
    console.log(`   Request ID: ${REQUEST_ID}`);
    
    try {
      const detailResponse = await axios.get(`${PRODUCTION_API}/tattoo-requests/${REQUEST_ID}`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      });
      console.log('✅ Individual request endpoint works');
      console.log('   Status:', detailResponse.data.status);
      console.log('   Has images:', !!detailResponse.data.referenceImages);
      console.log('   Image count:', detailResponse.data.referenceImages?.length || 0);
    } catch (detailError: any) {
      console.log('❌ Individual request endpoint failed');
      console.log('   Status:', detailError.response?.status);
      console.log('   Error:', detailError.response?.data);
      
      // Try with a different ID from the list
      if (listResponse.data.data.length > 0) {
        const firstId = listResponse.data.data[0].id;
        console.log(`\nTest 3: Trying with a different ID from the list: ${firstId}`);
        
        try {
          const altResponse = await axios.get(`${PRODUCTION_API}/tattoo-requests/${firstId}`, {
            headers: {
              'Authorization': `Bearer ${AUTH_TOKEN}`
            }
          });
          console.log('✅ Alternative ID works!');
          console.log('   This suggests the issue is specific to ID:', REQUEST_ID);
        } catch (altError: any) {
          console.log('❌ Alternative ID also failed');
          console.log('   Status:', altError.response?.status);
          console.log('   Error:', altError.response?.data);
          console.log('   This suggests a general issue with the endpoint');
        }
      }
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run with: AUTH_TOKEN="your_token_here" npx tsx scripts/test-production-api.ts
testProductionAPI().catch(console.error);
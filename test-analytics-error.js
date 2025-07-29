#!/usr/bin/env node
/**
 * Test script to debug analytics dashboard 500 error
 * Run this script with: node test-analytics-error.js
 */

const fetch = require('node-fetch');

const API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

console.log('🧪 Testing Analytics Dashboard API');
console.log(`📡 Backend URL: ${API_URL}`);
console.log('');

async function testAnalyticsEndpoint() {
  try {
    console.log('📊 Testing /api/analytics/dashboard endpoint...');
    
    const response = await fetch(`${API_URL}/api/analytics/dashboard?timeframe=today`, {
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if needed
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, response.headers.raw());
    
    const responseText = await response.text();
    console.log('\nRaw response:', responseText);
    
    if (!response.ok) {
      console.error('❌ Error response received');
      
      // Try to parse as JSON
      try {
        const errorData = JSON.parse(responseText);
        console.log('\nParsed error:', JSON.stringify(errorData, null, 2));
        
        if (errorData.details) {
          console.log('\n🔍 Error details:');
          console.log('Message:', errorData.details.message);
          console.log('Timeframe:', errorData.details.timeframe);
          if (errorData.details.stack) {
            console.log('\nStack trace:');
            console.log(errorData.details.stack);
          }
        }
      } catch (e) {
        console.log('Response is not JSON');
      }
      return;
    }

    try {
      const data = JSON.parse(responseText);
      console.log('\n✅ Response received. Structure:');
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('❌ Failed to parse response as JSON:', e.message);
    }

  } catch (error) {
    console.error('\n❌ Failed to test analytics endpoint:', error.message);
    console.error('Full error:', error);
  }
}

// Test different timeframes
async function testAllTimeframes() {
  const timeframes = ['today', 'yesterday', 'last7days', 'last30days', 'thisMonth'];
  
  console.log('\n🔄 Testing different timeframes...');
  for (const tf of timeframes) {
    console.log(`\nTesting timeframe: ${tf}`);
    try {
      const response = await fetch(`${API_URL}/api/analytics/dashboard?timeframe=${tf}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log(`- Status: ${response.status}`);
    } catch (error) {
      console.log(`- Error: ${error.message}`);
    }
  }
}

async function main() {
  await testAnalyticsEndpoint();
  await testAllTimeframes();
}

main();
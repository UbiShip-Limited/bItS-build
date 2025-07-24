#!/usr/bin/env node
/**
 * Test script to debug business hours 500 error
 * Run this script with: node test-business-hours.js
 */

const fetch = require('node-fetch');

const API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

console.log('🧪 Testing Business Hours API');
console.log(`📡 Backend URL: ${API_URL}`);
console.log('');

async function testBusinessHours() {
  try {
    console.log('📊 Testing /api/business-hours endpoint...');
    
    const response = await fetch(`${API_URL}/api/business-hours`, {
      headers: {
        'Content-Type': 'application/json',
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
      } catch (e) {
        console.log('Response is not JSON');
      }
      return;
    }

    try {
      const data = JSON.parse(responseText);
      console.log('\n✅ Response received:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.businessHours) {
        console.log(`\n📅 Found ${data.businessHours.length} business hours entries`);
        console.log(`Source: ${data.source}`);
      }
    } catch (e) {
      console.error('❌ Failed to parse response as JSON:', e.message);
    }

  } catch (error) {
    console.error('\n❌ Failed to test business hours endpoint:', error.message);
    console.error('Full error:', error);
  }
}

// Also test if the database tables exist
async function checkDatabaseStatus() {
  console.log('\n🔍 Checking database status...');
  
  try {
    // Test health endpoint which might give us database info
    const healthResponse = await fetch(`${API_URL}/api/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('Health check:', JSON.stringify(health, null, 2));
    }
  } catch (error) {
    console.log('Could not check health endpoint');
  }
}

async function main() {
  await testBusinessHours();
  await checkDatabaseStatus();
}

main();
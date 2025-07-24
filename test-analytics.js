#!/usr/bin/env node
/**
 * Test script to verify analytics API is returning correct data structure
 * Run this script with: node test-analytics.js
 */

const fetch = require('node-fetch');

const API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

console.log('🧪 Testing Analytics API');
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
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error response:', error);
      return;
    }

    const data = await response.json();
    console.log('\n✅ Response received. Structure:');
    console.log(JSON.stringify(data, null, 2));

    // Check if response has the expected structure
    if (data.success && data.data) {
      console.log('\n✅ Response has correct wrapper structure');
      
      const metrics = data.data;
      
      // Check for required properties
      const requiredPaths = [
        'revenue',
        'revenue.today',
        'revenue.today.amount',
        'revenue.breakdown',
        'customers',
        'customers.segments',
        'customers.returning',
        'customers.returning.rate',
        'appointments',
        'appointments.metrics',
        'requests',
        'requests.conversion',
        'business'
      ];

      console.log('\n🔍 Checking required properties:');
      for (const path of requiredPaths) {
        const value = path.split('.').reduce((obj, key) => obj?.[key], metrics);
        const exists = value !== undefined;
        console.log(`  ${exists ? '✅' : '❌'} ${path}: ${exists ? 'exists' : 'MISSING'}`);
      }

      // Check for specific issues
      if (!metrics.customers?.returning?.rate && metrics.customers?.returning?.rate !== 0) {
        console.log('\n⚠️  WARNING: customers.returning.rate is missing - this is the error source!');
      }

    } else {
      console.log('\n❌ Response missing expected structure');
      console.log('Expected: { success: boolean, data: {...} }');
      console.log('Received:', Object.keys(data));
    }

  } catch (error) {
    console.error('\n❌ Failed to test analytics endpoint:', error.message);
  }
}

testAnalyticsEndpoint();
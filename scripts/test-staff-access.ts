#!/usr/bin/env tsx

/**
 * Test script for staff access verification endpoint
 * 
 * Usage:
 *   npm run tsx scripts/test-staff-access.ts
 * 
 * Environment:
 *   Set BACKEND_URL to test against production/staging
 *   Default: http://localhost:3001
 */

import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const STAFF_ACCESS_CODE = process.env.STAFF_ACCESS_CODE;

async function testStaffAccess() {
  console.log('🔐 Testing Staff Access Verification');
  console.log('=====================================');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Staff Access Code: ${STAFF_ACCESS_CODE ? '✅ Configured' : '❌ Not configured'}`);
  console.log('');

  // Test 1: Health check
  console.log('1️⃣ Testing backend health...');
  try {
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    console.log(`   ✅ Backend is ${healthData.status}`);
    console.log(`   Environment: ${healthData.environment}`);
  } catch (error) {
    console.error('   ❌ Backend health check failed:', error.message);
    console.error('   Make sure the backend is running on', BACKEND_URL);
    process.exit(1);
  }

  // Test 2: Environment check
  console.log('\n2️⃣ Testing environment configuration...');
  try {
    const envResponse = await fetch(`${BACKEND_URL}/health/environment`);
    const envData = await envResponse.json();
    
    // Check if STAFF_ACCESS_CODE is in the optional list
    const staffCodeStatus = envData.optional?.STAFF_ACCESS_CODE;
    if (staffCodeStatus === 'present') {
      console.log('   ✅ STAFF_ACCESS_CODE is configured in backend');
    } else {
      console.log('   ⚠️  STAFF_ACCESS_CODE is not configured in backend');
      console.log('   This will cause 503 errors on staff verification');
    }
  } catch (error) {
    console.error('   ❌ Environment check failed:', error.message);
  }

  // Test 3: Test with correct code
  if (STAFF_ACCESS_CODE) {
    console.log('\n3️⃣ Testing with correct access code...');
    try {
      const response = await fetch(`${BACKEND_URL}/auth/verify-staff-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessCode: STAFF_ACCESS_CODE
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('   ✅ Access granted with correct code');
        console.log('   Response:', data);
      } else {
        console.error(`   ❌ Unexpected response: ${response.status}`);
        console.error('   Response:', data);
      }
    } catch (error) {
      console.error('   ❌ Request failed:', error.message);
    }
  } else {
    console.log('\n3️⃣ Skipping correct code test (STAFF_ACCESS_CODE not set locally)');
  }

  // Test 4: Test with incorrect code
  console.log('\n4️⃣ Testing with incorrect access code...');
  try {
    const response = await fetch(`${BACKEND_URL}/auth/verify-staff-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessCode: 'WRONG-CODE-123'
      })
    });

    const data = await response.json();
    
    if (response.status === 401) {
      console.log('   ✅ Correctly rejected invalid code (401)');
    } else if (response.status === 503) {
      console.log('   ⚠️  Got 503 - Staff access system not configured');
      console.log('   Backend needs STAFF_ACCESS_CODE environment variable');
    } else {
      console.error(`   ❌ Unexpected response: ${response.status}`);
      console.error('   Response:', data);
    }
  } catch (error) {
    console.error('   ❌ Request failed:', error.message);
  }

  // Test 5: Test with missing code
  console.log('\n5️⃣ Testing with missing access code...');
  try {
    const response = await fetch(`${BACKEND_URL}/auth/verify-staff-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const data = await response.json();
    
    if (response.status === 400) {
      console.log('   ✅ Correctly rejected missing code (400)');
    } else {
      console.error(`   ❌ Unexpected response: ${response.status}`);
      console.error('   Response:', data);
    }
  } catch (error) {
    console.error('   ❌ Request failed:', error.message);
  }

  console.log('\n=====================================');
  console.log('🏁 Staff Access Testing Complete');
  
  // Summary
  console.log('\n📋 Summary:');
  console.log('- Backend is running:', BACKEND_URL);
  console.log('- STAFF_ACCESS_CODE configured locally:', STAFF_ACCESS_CODE ? 'Yes' : 'No');
  console.log('- Test endpoint: /auth/verify-staff-access');
  console.log('\n💡 If getting 503 errors:');
  console.log('1. Set STAFF_ACCESS_CODE in Railway environment variables');
  console.log('2. Redeploy the backend service');
  console.log('3. Check logs with: railway logs');
}

// Run the test
testStaffAccess().catch(console.error);
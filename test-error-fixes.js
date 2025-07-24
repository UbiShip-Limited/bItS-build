/**
 * Test script to verify error handling fixes
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/v1`;

// Add auth header if you have a test token
const headers = {
  'Content-Type': 'application/json',
  // 'Authorization': 'Bearer YOUR_TEST_TOKEN'
};

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log(`   URL: ${url}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, { headers, ...options });
    const duration = Date.now() - startTime;
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Duration: ${duration}ms`);
    
    if (!response.ok) {
      const text = await response.text();
      console.log(`   ❌ Error: ${text}`);
      return false;
    }
    
    const data = await response.json();
    console.log(`   ✅ Success:`, JSON.stringify(data).substring(0, 100) + '...');
    return true;
  } catch (error) {
    console.log(`   ❌ Network Error:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Error Fix Verification Tests\n');
  console.log(`Testing against: ${BASE_URL}`);
  console.log('=========================================');
  
  const results = [];
  
  // Test 1: Basic health check
  results.push({
    name: 'Basic Health Check',
    success: await testEndpoint('Basic Health Check', `${BASE_URL}/health`)
  });
  
  // Test 2: Database health check
  results.push({
    name: 'Database Health Check',
    success: await testEndpoint('Database Health Check', `${BASE_URL}/health/database`)
  });
  
  // Test 3: Detailed health check
  results.push({
    name: 'Detailed Health Check',
    success: await testEndpoint('Detailed Health Check', `${BASE_URL}/health/detailed`)
  });
  
  // Test 4: Analytics endpoint (this was failing with database errors)
  results.push({
    name: 'Analytics Dashboard',
    success: await testEndpoint('Analytics Dashboard', `${API_URL}/analytics/dashboard?timeframe=today`)
  });
  
  // Test 5: SSE Events endpoint
  console.log(`\n🧪 Testing SSE Events...`);
  console.log(`   URL: ${BASE_URL}/events?userId=test-user`);
  
  try {
    const eventSource = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('SSE connection timeout after 5 seconds'));
      }, 5000);
      
      // Just test that we can establish connection
      fetch(`${BASE_URL}/events?userId=test-user`, { headers })
        .then(response => {
          clearTimeout(timeoutId);
          if (response.ok) {
            resolve(true);
          } else {
            reject(new Error(`SSE connection failed: ${response.status}`));
          }
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
    
    await eventSource;
    console.log(`   ✅ SSE connection established successfully`);
    results.push({ name: 'SSE Events', success: true });
  } catch (error) {
    console.log(`   ❌ SSE Error:`, error.message);
    results.push({ name: 'SSE Events', success: false });
  }
  
  // Summary
  console.log('\n=========================================');
  console.log('📊 TEST SUMMARY:');
  console.log('=========================================');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log('\n=========================================');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('=========================================');
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    console.log('\n🔍 Debugging tips:');
    console.log('1. Check if the backend is running: npm run dev:backend');
    console.log('2. Check database connection: verify DATABASE_URL in .env');
    console.log('3. Check server logs for detailed error messages');
    console.log('4. Try the health endpoints directly in browser:');
    console.log('   - http://localhost:3001/health');
    console.log('   - http://localhost:3001/health/database');
  } else {
    console.log('\n🎉 All tests passed! Error handling fixes are working correctly.');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
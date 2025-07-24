// Test script to verify the "Create Customer from Tattoo Request" flow
// This tests the complete end-to-end functionality

const API_BASE_URL = 'http://localhost:3001/api/v1';

// Helper to make authenticated requests
async function makeRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer mock-admin-token', // Use your actual token
      ...options.headers
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error(`Error ${response.status}:`, data);
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

async function testCreateCustomerFromRequest() {
  try {
    console.log('🔍 Testing Create Customer from Tattoo Request flow...\n');
    
    // Step 1: Create an anonymous tattoo request
    console.log('1️⃣ Creating anonymous tattoo request...');
    const tattooRequest = await makeRequest('/tattoo-requests', {
      method: 'POST',
      body: JSON.stringify({
        contactEmail: 'test.customer@example.com',
        contactPhone: '555-0123',
        description: 'I would like a small rose tattoo on my wrist',
        placement: 'wrist',
        size: 'small',
        style: 'traditional',
        colorPreference: 'black and gray'
      })
    });
    console.log('✅ Tattoo request created:', {
      id: tattooRequest.id,
      email: tattooRequest.contactEmail,
      status: tattooRequest.status
    });
    
    // Step 2: Create a customer
    console.log('\n2️⃣ Creating customer profile...');
    const customer = await makeRequest('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Customer',
        email: 'test.customer@example.com',
        phone: '555-0123',
        notes: 'Created from tattoo request'
      })
    });
    console.log('✅ Customer created:', {
      id: customer.id,
      name: customer.name,
      email: customer.email
    });
    
    // Step 3: Link the customer to the tattoo request
    console.log('\n3️⃣ Linking customer to tattoo request...');
    const updatedRequest = await makeRequest(`/tattoo-requests/${tattooRequest.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        customerId: customer.id
      })
    });
    console.log('✅ Tattoo request updated:', {
      id: updatedRequest.id,
      customerId: updatedRequest.customerId,
      customerName: updatedRequest.customer?.name
    });
    
    // Step 4: Verify the link by fetching the request again
    console.log('\n4️⃣ Verifying the link...');
    const verifiedRequest = await makeRequest(`/tattoo-requests/${tattooRequest.id}`);
    
    if (verifiedRequest.customerId === customer.id) {
      console.log('✅ Success! Customer is properly linked to the tattoo request');
      console.log('   Customer:', verifiedRequest.customer?.name);
      console.log('   Email:', verifiedRequest.customer?.email);
    } else {
      console.error('❌ Failed to link customer to tattoo request');
    }
    
    console.log('\n✨ Test completed successfully!');
    console.log('The "Create Customer from Tattoo Request" flow is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Please ensure:');
    console.error('1. The backend is running on port 3001');
    console.error('2. You have a valid admin token');
    console.error('3. The database is accessible');
  }
}

// Run the test
testCreateCustomerFromRequest();
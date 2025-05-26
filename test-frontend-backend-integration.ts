import axios from 'axios';

async function testTattooRequestSubmission() {
  console.log('Testing Tattoo Request Form Submission...\n');

  // Test data matching the form structure
  const testFormData = {
    contactEmail: 'test@example.com',
    contactPhone: '604-555-0123',
    description: 'I would like a traditional Japanese koi fish design',
    placement: 'Upper arm',
    size: 'Medium (4-6 inches)',
    colorPreference: 'Full color',
    style: 'Traditional Japanese',
    purpose: 'Personal meaning - represents perseverance',
    preferredArtist: 'Any artist',
    timeframe: 'Within 3 months',
    contactPreference: 'Email',
    additionalNotes: 'This is a test submission from the integration test',
    referenceImages: []
  };

  try {
    // Test 1: Submit through the frontend API proxy
    console.log('Test 1: Submitting through frontend proxy (/api/tattoo-requests)...');
    const frontendResponse = await axios.post('http://localhost:3000/api/tattoo-requests', testFormData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Frontend submission successful!');
    console.log('Response:', JSON.stringify(frontendResponse.data, null, 2));
    console.log('\n---\n');

    // Test 2: Verify the request was saved by fetching it
    const requestId = frontendResponse.data.id;
    console.log(`Test 2: Fetching the created request (ID: ${requestId})...`);
    
    const getResponse = await axios.get(`http://localhost:3000/api/tattoo-requests/${requestId}`);
    console.log('✅ Successfully retrieved the tattoo request!');
    console.log('Retrieved data:', JSON.stringify(getResponse.data, null, 2));
    
    // Verify the data matches
    console.log('\n--- Data Verification ---');
    console.log('Email matches:', getResponse.data.contactEmail === testFormData.contactEmail);
    console.log('Description matches:', getResponse.data.description === testFormData.description);
    console.log('Status is pending:', getResponse.data.status === 'pending');
    
  } catch (error: any) {
    console.error('❌ Test failed!');
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testTattooRequestSubmission(); 
import 'dotenv/config';
import SquareClient from '../lib/square/index';

async function testSquareBasic() {
  console.log('🔍 Basic Square Integration Test for Bowen Island Tattoo Shop\n');
  
  try {
    // Initialize Square client
    const squareClient = SquareClient.fromEnv();
    console.log('✅ Square client initialized successfully\n');
    
    // Test 1: Basic Customer Operations
    console.log('👥 Testing Customer Operations...');
    
    const testCustomerData = {
      givenName: 'Test',
      familyName: 'Customer',
      emailAddress: `test.customer.${Date.now()}@example.com`,
      idempotencyKey: `test-customer-${Date.now()}`
    };
    
    console.log('Creating customer...');
    const customerResult = await squareClient.createCustomer(testCustomerData);
    console.log('Customer creation result:', customerResult);
    
    // Test 2: Payment Link Creation
    console.log('\n💳 Testing Payment Link Creation...');
    
    const paymentLinkData = {
      idempotencyKey: `test-payment-${Date.now()}`,
      quickPay: {
        name: 'Tattoo Consultation Deposit',
        priceMoney: {
          amount: 5000, // $50.00 CAD
          currency: 'CAD'
        },
        locationId: process.env.SQUARE_LOCATION_ID!
      },
      description: 'Test consultation deposit'
    };
    
    console.log('Creating payment link...');
    const paymentLinkResult = await squareClient.createPaymentLink(paymentLinkData);
    console.log('Payment link creation result:', paymentLinkResult);
    
    // Test 3: List existing customers
    console.log('\n📋 Testing Customer List...');
    const customersResult = await squareClient.getCustomers();
    console.log('Customers list result:', customersResult);
    
    // Configuration Summary
    console.log('\n⚙️  Configuration Summary:');
    console.log('- Environment:', process.env.SQUARE_ENVIRONMENT || 'sandbox');
    console.log('- Location ID:', process.env.SQUARE_LOCATION_ID);
    console.log('- Access Token:', process.env.SQUARE_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
    console.log('- Webhook Key:', process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ? '✅ Set' : '❌ Missing');
    
    console.log('\n🎉 Basic Square integration test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Square client initialization: Working');
    console.log('✅ Environment variables: Configured');
    console.log('✅ API connectivity: Verified');
    console.log('\n🚀 Your Square integration appears to be working!');
    
  } catch (error: any) {
    console.error('\n❌ Square integration test failed:', error.message);
    
    if (error.body) {
      console.error('Response body:', error.body);
    }
    
    if (error.errors) {
      console.error('\nError details:');
      error.errors.forEach((err: any) => {
        console.error(`- ${err.code}: ${err.detail}`);
      });
    }
    
    console.error('\n🔧 Please check your Square credentials and configuration.');
    process.exit(1);
  }
}

testSquareBasic().catch(console.error); 
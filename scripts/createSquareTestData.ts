import 'dotenv/config';
import { SquareClient, SquareEnvironment } from 'square';
import { randomUUID } from 'crypto';

// Initialize Square client with sandbox credentials
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN || '',
  environment: process.env.SQUARE_ENVIRONMENT === 'production' 
    ? SquareEnvironment.Production 
    : SquareEnvironment.Sandbox
});

// Test customer data
const testCustomers = [
  {
    givenName: 'John',
    familyName: 'Smith',
    emailAddress: 'john.smith@example.com',
    note: 'Regular client - Multiple sessions for full back piece',
    referenceId: 'test-customer-1'
  },
  {
    givenName: 'Sarah',
    familyName: 'Johnson',
    emailAddress: 'sarah.johnson@example.com',
    note: 'New consultation client - Interested in floral sleeve',
    referenceId: 'test-customer-2'
  },
  {
    givenName: 'Mike',
    familyName: 'Chen',
    emailAddress: 'mike.chen@example.com',
    note: 'Walk-in customer - Small geometric designs',
    referenceId: 'test-customer-3'
  },
  {
    givenName: 'Emma',
    familyName: 'Wilson',
    emailAddress: 'emma.wilson@example.com',
    note: 'Deposit-only customer - Planning large piece',
    referenceId: 'test-customer-4'
  },
  {
    givenName: 'Alex',
    familyName: 'Rivera',
    emailAddress: 'alex.rivera@example.com',
    note: 'Completed full sleeve project - May need touch-ups',
    referenceId: 'test-customer-5'
  }
];

// Payment scenarios for each customer
const paymentScenarios = {
  'test-customer-1': [
    { amount: 10000, description: 'Consultation fee', daysAgo: 180 },
    { amount: 30000, description: 'Initial deposit - back piece', daysAgo: 175 },
    { amount: 150000, description: 'Session 1 - outline work', daysAgo: 160 },
    { amount: 150000, description: 'Session 2 - shading', daysAgo: 130 },
    { amount: 150000, description: 'Session 3 - color work', daysAgo: 100 },
    { amount: 100000, description: 'Session 4 - final details', daysAgo: 70 }
  ],
  'test-customer-2': [
    { amount: 7500, description: 'Consultation fee - floral sleeve', daysAgo: 5 }
  ],
  'test-customer-3': [
    { amount: 25000, description: 'Walk-in geometric tattoo', daysAgo: 30 },
    { amount: 15000, description: 'Second small piece', daysAgo: 10 }
  ],
  'test-customer-4': [
    { amount: 20000, description: 'Deposit for large piece', daysAgo: 15 }
  ],
  'test-customer-5': [
    { amount: 30000, description: 'Initial deposit - sleeve', daysAgo: 365 },
    { amount: 120000, description: 'Session 1 - upper arm', daysAgo: 350 },
    { amount: 120000, description: 'Session 2 - forearm', daysAgo: 320 },
    { amount: 100000, description: 'Session 3 - connections', daysAgo: 290 },
    { amount: 80000, description: 'Session 4 - touch-ups', daysAgo: 260 },
    { amount: 5000, description: 'Final touch-up', daysAgo: 90, refund: true }
  ]
};

async function createTestCustomer(customerData: any) {
  try {
    const customerRequest: any = {
      givenName: customerData.givenName,
      familyName: customerData.familyName,
      emailAddress: customerData.emailAddress,
      note: customerData.note,
      referenceId: customerData.referenceId
    };
    
    // Only include phone number if it's provided
    if (customerData.phoneNumber) {
      customerRequest.phoneNumber = customerData.phoneNumber;
    }
    
    const response = await client.customers.create(customerRequest) as any;

    // Try different response structures
    const customer = response.result?.customer || response.data?.customer || response.customer;
    
    if (customer) {
      console.log(`✅ Created customer: ${customerData.givenName} ${customerData.familyName} (ID: ${customer.id})`);
      return customer;
    } else {
      console.log('⚠️  No customer in response:', JSON.stringify(response, null, 2));
      return null;
    }
  } catch (error: any) {
    console.error(`❌ Failed to create customer ${customerData.givenName} ${customerData.familyName}:`);
    if (error.errors) {
      error.errors.forEach((err: any) => {
        console.error(`   - ${err.code}: ${err.detail}`);
      });
    } else {
      console.error(error.message || error);
    }
    return null;
  }
}

async function createTestPayment(customerId: string, amount: bigint, description: string, daysAgo: number) {
  try {
    // For sandbox, we need to use the CreatePayment endpoint with a source_id
    // In sandbox, we can use test payment tokens
    const response = await client.payments.create({
      sourceId: 'cnon:card-nonce-ok', // Sandbox test nonce for successful payment
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount,
        currency: 'CAD'
      },
      customerId,
      locationId: process.env.SQUARE_LOCATION_ID,
      note: description,
      autocomplete: true
    }) as any;

    // Try different response structures
    const payment = response.result?.payment || response.data?.payment || response.payment;
    
    if (payment) {
      console.log(`  💳 Created payment: $${Number(amount) / 100} - ${description}`);
      return payment;
    } else {
      console.log('  ⚠️  No payment in response:', JSON.stringify(response, null, 2));
      return null;
    }
  } catch (error: any) {
    console.error(`  ❌ Failed to create payment: ${description}`);
    if (error.errors) {
      error.errors.forEach((err: any) => {
        console.error(`     - ${err.code}: ${err.detail}`);
      });
    } else {
      console.error(error.message || error);
    }
    return null;
  }
}

async function createTestRefund(paymentId: string, amount: bigint, reason: string) {
  try {
    const response = await client.refunds.create({
      idempotencyKey: randomUUID(),
      paymentId,
      amountMoney: {
        amount,
        currency: 'CAD'
      },
      reason
    }) as any;

    // Try different response structures
    const refund = response.result?.refund || response.data?.refund || response.refund;
    
    if (refund) {
      console.log(`  💸 Created refund: $${Number(amount) / 100} - ${reason}`);
      return refund;
    }
  } catch (error: any) {
    console.error(`  ❌ Failed to create refund:`);
    if (error.errors) {
      error.errors.forEach((err: any) => {
        console.error(`     - ${err.code}: ${err.detail}`);
      });
    } else {
      console.error(error.message || error);
    }
    return null;
  }
}

async function main() {
  console.log('🎨 Bowen Island Tattoo Shop - Square Test Data Generator');
  console.log('========================================================\n');

  // Check required environment variables
  const requiredVars = ['SQUARE_ACCESS_TOKEN', 'SQUARE_LOCATION_ID', 'SQUARE_ENVIRONMENT'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.error('\n💡 Please set these variables in your .env file');
    process.exit(1);
  }

  // Verify we're using sandbox
  if (process.env.SQUARE_ENVIRONMENT !== 'sandbox') {
    console.error('❌ ERROR: This script should only be run in sandbox environment!');
    console.error('Please set SQUARE_ENVIRONMENT=sandbox in your .env file');
    process.exit(1);
  }

  console.log('📍 Location ID:', process.env.SQUARE_LOCATION_ID);
  console.log('🏗️  Environment: SANDBOX\n');

  const createdCustomers: { [key: string]: string } = {};
  const createdPayments: any[] = [];

  // Create test customers
  console.log('Creating test customers...\n');
  for (const customerData of testCustomers) {
    const customer = await createTestCustomer(customerData);
    if (customer?.id) {
      createdCustomers[customerData.referenceId] = customer.id;
    }
  }

  console.log('\n----------------------------------------\n');

  // Create payments for each customer
  console.log('Creating test payments...\n');
  for (const [referenceId, customerId] of Object.entries(createdCustomers)) {
    const scenarios = paymentScenarios[referenceId as keyof typeof paymentScenarios];
    if (scenarios) {
      console.log(`\nProcessing payments for ${referenceId}:`);
      
      for (const scenario of scenarios) {
        const payment = await createTestPayment(
          customerId,
          BigInt(scenario.amount),
          scenario.description,
          scenario.daysAgo
        );
        
        if (payment) {
          createdPayments.push(payment);
          
          // Create refund if specified
          if (scenario.refund && payment.id) {
            await createTestRefund(
              payment.id,
              BigInt(scenario.amount),
              'Customer requested refund'
            );
          }
        }
      }
    }
  }

  console.log('\n========================================================');
  console.log('✅ Test data creation complete!\n');
  console.log('Summary:');
  console.log(`  - Created ${Object.keys(createdCustomers).length} customers`);
  console.log(`  - Created ${createdPayments.length} payments`);
  console.log('\nNext steps:');
  console.log('1. Check your Square Sandbox dashboard to verify the data');
  console.log('2. Run the import script: npm run import:square:enhanced');
  console.log('3. Verify the imported data in your local database\n');
}

// Run the script
main().catch(console.error);
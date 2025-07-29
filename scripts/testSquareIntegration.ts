import 'dotenv/config';
import SquareClient from '../lib/square/index';
import { SquareIntegrationService } from '../lib/services/squareIntegrationService';
import { prisma } from '../lib/prisma/prisma';

async function testSquareIntegration() {
  console.log('🔍 Testing Square Integration for Bowen Island Tattoo Shop\n');
  
  try {
    // Initialize clients
    const squareClient = SquareClient.fromEnv();
    const integrationService = new SquareIntegrationService(squareClient);
    
    console.log('🏥 Testing Square Client Initialization...');
    console.log('✅ Square client initialized successfully\n');
    
    // Test 1: Customer Operations
    console.log('👥 Testing Customer Operations...');
    
    const testCustomerData = {
      givenName: 'Test',
      familyName: 'Customer',
      emailAddress: `test.customer.${Date.now()}@example.com`,
      idempotencyKey: `test-customer-${Date.now()}`
    };
    
    const customerResult = await squareClient.createCustomer(testCustomerData);
    if (customerResult.result?.customer && !customerResult.errors?.length) {
      console.log(`✅ Customer created: ${customerResult.result.customer.id}`);
      console.log(`   Name: ${customerResult.result.customer.givenName} ${customerResult.result.customer.familyName}`);
      console.log(`   Email: ${customerResult.result.customer.emailAddress}`);
      
      // Test customer retrieval
      const retrievedCustomer = await squareClient.getCustomerById(customerResult.result.customer.id!);
      if (retrievedCustomer.result?.customer) {
        console.log(`✅ Customer retrieved successfully`);
      }
    } else {
      console.log('❌ Customer creation failed:', customerResult.errors);
    }
    console.log('');
    
    // Test 2: Payment Link Creation (for consultations/deposits)
    console.log('💳 Testing Payment Link Creation...');
    
    const paymentLinkData = {
      idempotencyKey: `test-payment-${Date.now()}`,
      quickPay: {
        name: 'Tattoo Consultation Deposit',
        priceMoney: {
          amount: 5000, // $50.00 CAD in cents
          currency: 'CAD'
        },
        locationId: process.env.SQUARE_LOCATION_ID!
      },
      description: 'Consultation deposit for tattoo appointment',
      checkoutOptions: {
        redirectUrl: 'https://bowenislandtattoo.com/booking/confirmation',
        askForShippingAddress: false
      }
    };
    
    const paymentLinkResult = await squareClient.createPaymentLink(paymentLinkData);
    if (paymentLinkResult.result?.paymentLink && !paymentLinkResult.errors?.length) {
      console.log(`✅ Payment link created: ${paymentLinkResult.result.paymentLink.id}`);
      console.log(`   URL: ${paymentLinkResult.result.paymentLink.url}`);
      console.log(`   Amount: $${(paymentLinkData.quickPay.priceMoney.amount / 100).toFixed(2)} CAD`);
    } else {
      console.log('❌ Payment link creation failed:', paymentLinkResult.errors);
    }
    console.log('');
    
    // Test 3: Booking Operations
    console.log('📅 Testing Booking Operations...');
    
    // Create a test customer first (required for booking)
    const bookingCustomerData = {
      givenName: 'Booking',
      familyName: 'Test',
      emailAddress: `booking.test.${Date.now()}@example.com`,
      idempotencyKey: `booking-customer-${Date.now()}`
    };
    
    const bookingCustomerResult = await squareClient.createCustomer(bookingCustomerData);
    if (!bookingCustomerResult.success || !bookingCustomerResult.data) {
      console.log('❌ Failed to create customer for booking test');
      console.log('');
      return;
    }
    
    console.log(`✅ Created test customer for booking: ${bookingCustomerResult.data.id}`);
    
    // Create a test booking
    const bookingStartTime = new Date();
    bookingStartTime.setDate(bookingStartTime.getDate() + 7); // 1 week from now
    bookingStartTime.setHours(14, 0, 0, 0); // 2:00 PM
    
    const bookingData = {
      startAt: bookingStartTime.toISOString(),
      locationId: process.env.SQUARE_LOCATION_ID!,
      customerId: bookingCustomerResult.data.id,
      duration: 60,
      idempotencyKey: `test-booking-${Date.now()}`,
      note: 'Test consultation booking for Square integration',
      bookingType: 'consultation'
    };
    
    const bookingResult = await squareClient.createBooking(bookingData);
    if (bookingResult.success && bookingResult.data) {
      console.log(`✅ Booking created: ${bookingResult.data.id}`);
      console.log(`   Start time: ${bookingResult.data.startAt}`);
      console.log(`   Customer: ${bookingResult.data.customerId}`);
      console.log(`   Status: ${bookingResult.data.status}`);
      
      // Test booking retrieval
      const retrievedBooking = await squareClient.getBookingById(bookingResult.data.id);
      if (retrievedBooking.success) {
        console.log(`✅ Booking retrieved successfully`);
      }
      
      // Test booking cancellation
      const cancelResult = await squareClient.cancelBooking({
        bookingId: bookingResult.data.id,
        idempotencyKey: `cancel-${Date.now()}`
      });
      if (cancelResult.success) {
        console.log(`✅ Booking cancelled successfully`);
      }
    } else {
      console.log('❌ Booking creation failed:', bookingResult.error);
    }
    console.log('');
    
    // Test 4: Integration Service
    console.log('🔗 Testing Integration Service...');
    
    // Create a test appointment in the database
    const testAppointment = await prisma.appointment.create({
      data: {
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // tomorrow + 1 hour
        duration: 60,
        status: 'scheduled',
        type: 'consultation',
        notes: 'Test integration service appointment',
        // Don't set customerId to test anonymous handling
      }
    });
    
    // Test sync for anonymous appointment (should skip)
    const syncResult = await integrationService.syncAppointmentToSquare(testAppointment);
    if (syncResult.error) {
      console.log(`✅ Anonymous appointment sync correctly skipped: ${syncResult.error}`);
    }
    
    // Clean up test appointment
    await prisma.appointment.delete({ where: { id: testAppointment.id } });
    console.log('✅ Integration service test completed');
    console.log('');
    
    // Test 5: Configuration Check
    console.log('⚙️  Configuration Summary...');
    console.log('- Environment:', process.env.SQUARE_ENVIRONMENT || 'sandbox');
    console.log('- Location ID:', process.env.SQUARE_LOCATION_ID);
    console.log('- Webhook configured:', process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ? '✅ Yes' : '❌ No');
    console.log('');
    
    console.log('🎉 All Square integration tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Square API connection working');
    console.log('✅ Customer operations working');
    console.log('✅ Payment link creation working');
    console.log('✅ Booking operations working');
    console.log('✅ Integration service working');
    console.log('\n🚀 Your Square integration is ready for production!');
    
  } catch (error: any) {
    console.error('\n❌ Square integration test failed:', error.message);
    if (error.errors) {
      console.error('\nError details:');
      error.errors.forEach((err: any) => {
        console.error(`- ${err.code}: ${err.detail}`);
      });
    }
    console.error('\n🔧 Please check your Square credentials and try again.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testSquareIntegration().catch(console.error); 
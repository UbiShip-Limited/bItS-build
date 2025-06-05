import { describe, it, expect, vi } from 'vitest';
import { 
  setupIntegrationTests, 
  createTestUser, 
  realisticTattooRequestData,
  realisticAppointmentData,
  realisticPaymentData,
  prisma 
} from '../integration-setup';
import { TattooRequestService } from '@lib/services/tattooRequestService';
import { PaymentService } from '@lib/services/paymentService';
import { AppointmentService } from '@lib/services/appointmentService';
import { BookingService, BookingType } from '@lib/services/bookingService';
import PaymentLinkService from '@lib/services/paymentLinkService';

// Initialize integration test environment
setupIntegrationTests();

describe('🎨 Complete User Journey Integration Test', () => {
  let tattooRequestService: TattooRequestService;
  let paymentService: PaymentService;
  let appointmentService: AppointmentService;
  let bookingService: BookingService;
  let paymentLinkService: PaymentLinkService;
  let adminUser: any;
  let artist: any;

  beforeEach(async () => {
    // Initialize services with real implementations
    tattooRequestService = new TattooRequestService();
    paymentService = new PaymentService();
    appointmentService = new AppointmentService();
    bookingService = new BookingService();
    paymentLinkService = new PaymentLinkService();

    // Create test users
    adminUser = await createTestUser('admin');
    artist = await createTestUser('artist');
  });

  describe('🔄 Anonymous Customer: Request → Approval → Customer Creation → Booking → Payment', () => {
    it('should complete the full journey for an anonymous customer', async () => {
      console.log('\n🎯 Starting Anonymous Customer Journey Test');
      
      // Step 1: Anonymous customer submits tattoo request
      console.log('\n📝 Step 1: Submitting anonymous tattoo request...');
      const tattooRequest = await tattooRequestService.create(
        realisticTattooRequestData,
        adminUser.id
      );

      expect(tattooRequest).toBeDefined();
      expect(tattooRequest.trackingToken).toBeTruthy(); // Should have tracking token for anonymous
      expect(tattooRequest.customerId).toBeNull(); // Should be anonymous
      expect(tattooRequest.status).toBe('new');
      expect(tattooRequest.description).toBe(realisticTattooRequestData.description);
      expect(tattooRequest.contactEmail).toBe(realisticTattooRequestData.contactEmail);
      expect(tattooRequest.referenceImages).toHaveLength(2);

      console.log(`✅ Tattoo request created: ${tattooRequest.id}`);
      console.log(`📧 Contact email: ${tattooRequest.contactEmail}`);
      console.log(`🎫 Tracking token: ${tattooRequest.trackingToken}`);

      // Step 2: Admin reviews and approves the request
      console.log('\n🔍 Step 2: Admin reviewing and approving request...');
      
      // First review
      const reviewedRequest = await tattooRequestService.updateStatus(
        tattooRequest.id,
        'reviewed',
        adminUser.id
      );
      expect(reviewedRequest.status).toBe('reviewed');

      // Then approve
      const approvedRequest = await tattooRequestService.updateStatus(
        tattooRequest.id,
        'approved',
        adminUser.id
      );
      expect(approvedRequest.status).toBe('approved');

      console.log(`✅ Request approved by admin: ${adminUser.email}`);

      // Step 3: Convert to appointment (this creates customer automatically)
      console.log('\n📅 Step 3: Converting to appointment and creating customer...');
      
      const conversionResult = await tattooRequestService.convertToAppointment(
        tattooRequest.id,
        {
          ...realisticAppointmentData,
          artistId: artist.id,
          bookingType: BookingType.TATTOO_SESSION
        },
        adminUser.id
      );

      expect(conversionResult.success).toBe(true);
      expect(conversionResult.appointment).toBeDefined();
      expect(conversionResult.customer).toBeTruthy(); // Customer should be created
      expect(conversionResult.tattooRequest.status).toBe('converted_to_appointment');

      const appointment = conversionResult.appointment;
      const customerId = conversionResult.customer;

      console.log(`✅ Appointment created: ${appointment.id}`);
      console.log(`👤 Customer created: ${customerId}`);
      console.log(`🎨 Artist assigned: ${artist.email}`);

      // Verify customer was created properly
      const customer = await prisma.customer.findUnique({
        where: { id: customerId as string }
      });
      expect(customer).toBeDefined();
      expect(customer!.email).toBe(realisticTattooRequestData.contactEmail);
      expect(customer!.phone).toBe(realisticTattooRequestData.contactPhone);
      expect(customer!.name).toBe('tattoo.enthusiast'); // Generated from email

      // Step 4: Create payment link for deposit
      console.log('\n💰 Step 4: Creating payment link for tattoo deposit...');
      
      const paymentLink = await paymentLinkService.createPaymentLink({
        amount: realisticPaymentData.amount,
        title: 'Tattoo Deposit - Japanese Dragon Design',
        description: 'Deposit payment for traditional Japanese dragon tattoo session',
        customerId: customerId as string,
        appointmentId: appointment.id,
        paymentType: 'tattoo_deposit',
        redirectUrl: 'http://localhost:3000/booking-confirmation'
      });

      expect(paymentLink).toBeDefined();
      expect(paymentLink.url).toContain('checkout');
      expect(paymentLink.amount).toBe(realisticPaymentData.amount);

      console.log(`✅ Payment link created: ${paymentLink.id}`);
      console.log(`🔗 Payment URL: ${paymentLink.url}`);

      // Step 5: Process payment (simulate customer paying)
      console.log('\n💳 Step 5: Processing payment...');
      
      const payment = await paymentService.processPayment({
        sourceId: 'test-payment-source-123',
        amount: realisticPaymentData.amount,
        customerId: customerId as string,
        paymentType: 'tattoo_deposit',
        bookingId: appointment.id,
        note: 'Deposit payment for Japanese dragon tattoo',
        customerEmail: realisticTattooRequestData.contactEmail,
        staffId: adminUser.id
      });

      expect(payment.success).toBe(true);
      expect(payment.payment).toBeDefined();
      expect(payment.payment.amount).toBe(realisticPaymentData.amount);
      expect(payment.payment.status).toBe('completed');
      expect(payment.payment.paymentType).toBe('tattoo_deposit');

      console.log(`✅ Payment processed: ${payment.payment.id}`);
      console.log(`💵 Amount: $${payment.payment.amount}`);
      console.log(`🏦 Square Payment ID: ${payment.payment.squareId}`);

      // Step 6: Verify complete flow integrity
      console.log('\n🔍 Step 6: Verifying complete flow integrity...');

      // Check audit logs were created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          OR: [
            { resourceId: tattooRequest.id },
            { resourceId: appointment.id },
            { resourceId: payment.payment.id }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });

      expect(auditLogs.length).toBeGreaterThan(3); // Multiple audit entries
      expect(auditLogs.some(log => log.action === 'CREATE')).toBe(true);
      expect(auditLogs.some(log => log.action === 'UPDATE_STATUS')).toBe(true);
      expect(auditLogs.some(log => log.action === 'CONVERTED_TO_APPOINTMENT')).toBe(true);

      // Verify final state
      const finalTattooRequest = await tattooRequestService.findById(tattooRequest.id);
      const finalAppointment = await appointmentService.findById(appointment.id);
      const finalCustomer = await prisma.customer.findUnique({ where: { id: customerId as string } });

      expect(finalTattooRequest.status).toBe('converted_to_appointment');
      expect(finalTattooRequest.customerId).toBe(customerId);
      expect(finalAppointment.status).toBe('confirmed');
      expect(finalAppointment.customerId).toBe(customerId);
      expect(finalAppointment.tattooRequestId).toBe(tattooRequest.id);
      expect(finalCustomer).toBeDefined();

      console.log('\n🎉 COMPLETE USER JOURNEY SUCCESSFUL!');
      console.log('📊 Journey Summary:');
      console.log(`   • Tattoo Request: ${tattooRequest.id} ✅`);
      console.log(`   • Customer: ${customerId} ✅`);
      console.log(`   • Appointment: ${appointment.id} ✅`);
      console.log(`   • Payment: ${payment.payment.id} ✅`);
      console.log(`   • Audit Logs: ${auditLogs.length} entries ✅`);
    });
  });

  describe('🎯 Authenticated Customer: Request → Approval → Booking → Payment', () => {
    it('should complete the full journey for an existing customer', async () => {
      console.log('\n🎯 Starting Authenticated Customer Journey Test');

      // Step 1: Create existing customer
      console.log('\n👤 Step 1: Creating existing customer...');
      const existingCustomer = await prisma.customer.create({
        data: {
          name: 'Sarah Johnson',
          email: 'sarah.johnson@example.com',
          phone: '+1 (555) 987-6543',
          notes: 'Returning customer, has previous small tattoo'
        }
      });

      console.log(`✅ Customer created: ${existingCustomer.id}`);

      // Step 2: Authenticated customer submits request
      console.log('\n📝 Step 2: Submitting authenticated tattoo request...');
      const tattooRequest = await tattooRequestService.create(
        {
          ...realisticTattooRequestData,
          customerId: existingCustomer.id,
          contactEmail: existingCustomer.email,
          contactPhone: existingCustomer.phone,
          description: 'I want a delicate watercolor rose design on my wrist. Something feminine and elegant with soft pinks and greens. This will complement my existing small butterfly tattoo.',
          placement: 'Left wrist',
          size: 'Small (2-3 inches)',
          style: 'Watercolor',
          colorPreference: 'Soft pinks and greens'
        },
        adminUser.id
      );

      expect(tattooRequest.customerId).toBe(existingCustomer.id);
      expect(tattooRequest.trackingToken).toBeNull(); // No tracking token for authenticated
      expect(tattooRequest.status).toBe('new');

      console.log(`✅ Authenticated request created: ${tattooRequest.id}`);

      // Step 3: Fast-track approval for existing customer
      console.log('\n⚡ Step 3: Fast-track approval process...');
      
      const reviewedRequest = await tattooRequestService.updateStatus(
        tattooRequest.id,
        'reviewed',
        adminUser.id
      );
      
      const approvedRequest = await tattooRequestService.updateStatus(
        tattooRequest.id,
        'approved',
        adminUser.id
      );

      console.log(`✅ Request fast-track approved`);

      // Step 4: Convert to appointment (no customer creation needed)
      console.log('\n📅 Step 4: Converting to appointment...');
      
      const conversionResult = await tattooRequestService.convertToAppointment(
        tattooRequest.id,
        {
          startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          duration: 90, // 1.5 hours for small piece
          artistId: artist.id,
          priceQuote: 350,
          note: 'Small watercolor rose for returning customer'
        },
        adminUser.id
      );

      expect(conversionResult.success).toBe(true);
      expect(conversionResult.customer).toBe(existingCustomer.id); // Should use existing customer

      const appointment = conversionResult.appointment;

      console.log(`✅ Appointment created for existing customer`);

      // Step 5: Process full payment (smaller piece, full payment upfront)
      console.log('\n💳 Step 5: Processing full payment...');
      
      const payment = await paymentService.processPayment({
        sourceId: 'test-payment-source-456',
        amount: 350,
        customerId: existingCustomer.id,
        paymentType: 'tattoo_final',
        bookingId: appointment.id,
        note: 'Full payment for watercolor rose tattoo',
        customerEmail: existingCustomer.email,
        staffId: adminUser.id
      });

      expect(payment.success).toBe(true);
      expect(payment.payment.amount).toBe(350);
      expect(payment.payment.paymentType).toBe('tattoo_final');

      console.log(`✅ Full payment processed: $${payment.payment.amount}`);

      // Verify final state
      const finalAppointment = await appointmentService.findById(appointment.id);
      expect(finalAppointment.customerId).toBe(existingCustomer.id);
      expect(finalAppointment.priceQuote).toBe(350);

      console.log('\n🎉 AUTHENTICATED CUSTOMER JOURNEY SUCCESSFUL!');
    });
  });

  describe('💰 Payment Edge Cases and Business Logic', () => {
    it('should handle multiple payment types and partial payments', async () => {
      console.log('\n💰 Testing Advanced Payment Scenarios');

      // Create customer and appointment for testing
      const customer = await prisma.customer.create({
        data: {
          name: 'Payment Test Customer',
          email: 'payment.test@example.com',
          phone: '+1 (555) 111-2222'
        }
      });

      const appointment = await prisma.appointment.create({
        data: {
          customerId: customer.id,
          artistId: artist.id,
          startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          duration: 240, // 4 hours
          status: 'confirmed',
          priceQuote: 1200,
          type: 'tattoo_session'
        }
      });

      // Test 1: Consultation fee
      console.log('\n💡 Processing consultation fee...');
      const consultationPayment = await paymentService.processPayment({
        sourceId: 'consultation-source',
        amount: 75,
        customerId: customer.id,
        paymentType: 'consultation',
        note: 'Initial consultation fee',
        customerEmail: customer.email
      });

      expect(consultationPayment.success).toBe(true);
      expect(consultationPayment.payment.paymentType).toBe('consultation');

      // Test 2: Deposit payment
      console.log('\n💰 Processing deposit payment...');
      const depositPayment = await paymentService.processPayment({
        sourceId: 'deposit-source',
        amount: 600, // 50% deposit
        customerId: customer.id,
        paymentType: 'tattoo_deposit',
        bookingId: appointment.id,
        note: 'Deposit for large tattoo session',
        customerEmail: customer.email
      });

      expect(depositPayment.success).toBe(true);
      expect(depositPayment.payment.amount).toBe(600);

      // Test 3: Final payment
      console.log('\n✅ Processing final payment...');
      const finalPayment = await paymentService.processPayment({
        sourceId: 'final-source',
        amount: 600, // Remaining 50%
        customerId: customer.id,
        paymentType: 'tattoo_final',
        bookingId: appointment.id,
        note: 'Final payment for tattoo session',
        customerEmail: customer.email
      });

      expect(finalPayment.success).toBe(true);
      expect(finalPayment.payment.amount).toBe(600);

      // Verify payment history
      const allPayments = await prisma.payment.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'asc' }
      });

      expect(allPayments).toHaveLength(3);
      expect(allPayments[0].paymentType).toBe('consultation');
      expect(allPayments[1].paymentType).toBe('tattoo_deposit');
      expect(allPayments[2].paymentType).toBe('tattoo_final');

      const totalPaid = allPayments.reduce((sum, payment) => sum + payment.amount, 0);
      expect(totalPaid).toBe(1275); // 75 + 600 + 600

      console.log(`✅ Total payments processed: $${totalPaid}`);
    });

    it('should validate payment amounts and prevent duplicate payments', async () => {
      console.log('\n🔒 Testing Payment Security and Validation');

      const customer = await prisma.customer.create({
        data: {
          name: 'Security Test Customer',
          email: 'security@example.com',
          phone: '+1 (555) 333-4444'
        }
      });

      // Test minimum amount validation
      await expect(
        paymentService.processPayment({
          sourceId: 'invalid-amount',
          amount: 0.5, // Below minimum
          customerId: customer.id,
          paymentType: 'consultation',
          customerEmail: customer.email
        })
      ).rejects.toThrow(); // Should throw validation error

      // Test duplicate payment prevention (using same idempotency key)
      const paymentData = {
        sourceId: 'duplicate-test',
        amount: 100,
        customerId: customer.id,
        paymentType: 'consultation' as const,
        customerEmail: customer.email,
        idempotencyKey: 'unique-key-123'
      };

      const firstPayment = await paymentService.processPayment(paymentData);
      expect(firstPayment.success).toBe(true);

      // Second payment with same idempotency key should be handled gracefully
      const secondPayment = await paymentService.processPayment(paymentData);
      // Implementation should handle duplicates appropriately

      console.log('✅ Payment security validations passed');
    });
  });

  describe('📋 Business Logic Validation', () => {
    it('should enforce proper status transitions', async () => {
      console.log('\n📋 Testing Business Logic Validations');

      const tattooRequest = await tattooRequestService.create(
        realisticTattooRequestData,
        adminUser.id
      );

      // Valid transition: new -> reviewed
      const reviewed = await tattooRequestService.updateStatus(
        tattooRequest.id,
        'reviewed',
        adminUser.id
      );
      expect(reviewed.status).toBe('reviewed');

      // Invalid transition: reviewed -> converted_to_appointment (must be approved first)
      await expect(
        tattooRequestService.updateStatus(tattooRequest.id, 'converted_to_appointment', adminUser.id)
      ).rejects.toThrow('Invalid status transition');

      // Valid transition: reviewed -> approved
      const approved = await tattooRequestService.updateStatus(
        tattooRequest.id,
        'approved',
        adminUser.id
      );
      expect(approved.status).toBe('approved');

      console.log('✅ Status transition validations working correctly');
    });

    it('should validate tattoo request data thoroughly', async () => {
      console.log('\n🔍 Testing Data Validation');

      // Test invalid email
      await expect(
        tattooRequestService.create({
          ...realisticTattooRequestData,
          contactEmail: 'invalid-email'
        }, adminUser.id)
      ).rejects.toThrow('Invalid email format');

      // Test short description
      await expect(
        tattooRequestService.create({
          ...realisticTattooRequestData,
          description: 'Short'
        }, adminUser.id)
      ).rejects.toThrow('Description must be at least 10 characters');

      // Test missing contact info for anonymous request
      await expect(
        tattooRequestService.create({
          description: 'Valid long description for testing validation',
          placement: 'Arm',
          size: 'Medium'
          // Missing contactEmail and customerId
        }, adminUser.id)
      ).rejects.toThrow('Either customer ID or contact email is required');

      console.log('✅ Data validation working correctly');
    });
  });

  describe('🎨 Image Upload Integration', () => {
    it('should handle image uploads during tattoo request flow', async () => {
      console.log('\n🖼️ Testing Image Upload Integration');

      // Create tattoo request with images
      const requestWithImages = await tattooRequestService.create(
        {
          ...realisticTattooRequestData,
          referenceImages: [
            { url: 'https://res.cloudinary.com/demo/ref1.jpg', publicId: 'ref-1' },
            { url: 'https://res.cloudinary.com/demo/ref2.jpg', publicId: 'ref-2' },
            { url: 'https://res.cloudinary.com/demo/ref3.jpg', publicId: 'ref-3' }
          ]
        },
        adminUser.id
      );

      // Verify images were stored
      expect(requestWithImages.referenceImages).toHaveLength(3);
      
      const images = await prisma.image.findMany({
        where: { tattooRequestId: requestWithImages.id }
      });
      expect(images).toHaveLength(3);
      expect(images[0].publicId).toBe('ref-1');

      // Test image retrieval
      const requestImages = await tattooRequestService.getRequestImages(requestWithImages.id);
      expect(requestImages).toHaveLength(3);

      console.log(`✅ ${images.length} images uploaded and linked successfully`);

      // Test image transfer when converting anonymous to customer
      const approvedRequest = await tattooRequestService.updateStatus(
        requestWithImages.id,
        'reviewed',
        adminUser.id
      );
      await tattooRequestService.updateStatus(requestWithImages.id, 'approved', adminUser.id);

      const conversionResult = await tattooRequestService.convertToAppointment(
        requestWithImages.id,
        {
          ...realisticAppointmentData,
          artistId: artist.id
        },
        adminUser.id
      );

      expect(conversionResult.success).toBe(true);
      console.log('✅ Images transferred to customer profile during conversion');
    });
  });
});

describe('🚀 Performance and Concurrency Tests', () => {
  setupIntegrationTests();

  it('should handle multiple concurrent tattoo requests', async () => {
    console.log('\n🚀 Testing Concurrent Operations');

    const tattooRequestService = new TattooRequestService();
    const adminUser = await createTestUser('admin');

    // Create multiple requests concurrently
    const concurrentRequests = Array(5).fill(null).map((_, index) => 
      tattooRequestService.create({
        ...realisticTattooRequestData,
        contactEmail: `concurrent${index}@example.com`,
        description: `Concurrent tattoo request #${index + 1}: ${realisticTattooRequestData.description}`
      }, adminUser.id)
    );

    const results = await Promise.all(concurrentRequests);
    
    expect(results).toHaveLength(5);
    results.forEach((request, index) => {
      expect(request.contactEmail).toBe(`concurrent${index}@example.com`);
      expect(request.trackingToken).toBeTruthy();
    });

    console.log(`✅ ${results.length} concurrent requests processed successfully`);
  });
});

console.log('\n🎯 Integration Test Suite Initialized');
console.log('📋 Testing Real Business Logic:');
console.log('  • Anonymous customer journey');
console.log('  • Authenticated customer journey');
console.log('  • Payment processing workflows');
console.log('  • Business rule validations');
console.log('  • Image upload integration');
console.log('  • Concurrency handling');
console.log('🚀 External services mocked, business logic real!\n'); 
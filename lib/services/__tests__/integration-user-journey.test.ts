import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { TattooRequestService } from '../tattooRequestService';
import PaymentService from '../paymentService';
import { AppointmentService } from '../appointmentService';
import BookingService, { BookingType } from '../bookingService';
import PaymentLinkService from '../paymentLinkService';
import { PaymentType } from '../../config/pricing';

// Test database and external service mocks
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./test.db'
    }
  }
});

// Mock external services only (keep business logic real)
beforeAll(async () => {
  // Set test environment
  Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });
  process.env.BYPASS_AUTH = 'true';
  
  // Mock Square SDK with realistic responses
  vi.mock('square', () => ({
    Client: vi.fn().mockImplementation(() => ({
      paymentsApi: {
        createPayment: vi.fn().mockResolvedValue({
          result: {
            payment: {
              id: 'sq-payment-123',
              status: 'COMPLETED',
              amountMoney: { amount: 50000, currency: 'CAD' },
              sourceType: 'CARD',
              cardDetails: { card: { last4: '1234', cardBrand: 'VISA' } },
              createdAt: new Date().toISOString()
            }
          }
        })
      },
      customersApi: {
        createCustomer: vi.fn().mockResolvedValue({
          result: {
            customer: {
              id: 'sq-customer-123',
              givenName: 'Test',
              emailAddress: 'test@example.com'
            }
          }
        })
      },
      ordersApi: {
        createOrder: vi.fn().mockResolvedValue({
          result: {
            order: {
              id: 'sq-order-123',
              totalMoney: { amount: 50000, currency: 'CAD' }
            }
          }
        })
      },
      checkoutApi: {
        createPaymentLink: vi.fn().mockResolvedValue({
          result: {
            paymentLink: {
              id: 'sq-link-123',
              url: 'https://sandbox-squareup.com/checkout/sq-link-123'
            }
          }
        })
      },
      bookingsApi: {
        createBooking: vi.fn().mockResolvedValue({
          result: {
            booking: {
              id: 'sq-booking-123',
              startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              customerId: 'sq-customer-123'
            }
          }
        })
      }
    }))
  }));

  // Mock Cloudinary
  vi.mock('../../cloudinary', () => ({
    default: {
      validateUploadResult: vi.fn().mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/test.jpg',
        publicId: 'test-image-123'
      }),
      transferImagesToCustomer: vi.fn().mockResolvedValue(true)
    }
  }));

  await testPrisma.$connect();
});

beforeEach(async () => {
  // Clean database before each test
  await testPrisma.auditLog.deleteMany();
  await testPrisma.image.deleteMany();
  await testPrisma.invoice.deleteMany();
  await testPrisma.paymentLink.deleteMany();
  await testPrisma.appointment.deleteMany();
  await testPrisma.payment.deleteMany();
  await testPrisma.tattooRequest.deleteMany();
  await testPrisma.customer.deleteMany();
  await testPrisma.user.deleteMany();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

// Realistic test data
const realisticTattooRequest = {
  description: 'I want a traditional Japanese dragon design wrapping around my upper arm. The dragon should be detailed with scales, flowing whiskers, and surrounded by cherry blossoms and clouds. Looking for authentic traditional colors.',
  contactEmail: 'tattoo.enthusiast@example.com',
  contactPhone: '+1 (555) 123-4567',
  placement: 'Upper arm (wrapping around)',
  size: 'Large (8-10 inches)',
  colorPreference: 'Traditional colors with red accents',
  style: 'Traditional Japanese',
  purpose: 'new_tattoo',
  preferredArtist: 'Any artist experienced with Japanese traditional work',
  timeframe: 'Within 2-3 months',
  contactPreference: 'email',
  additionalNotes: 'Budget range is $800-1200. Flexible with scheduling.',
  referenceImages: [
    { url: 'https://res.cloudinary.com/demo/dragon1.jpg', publicId: 'dragon-ref-1' },
    { url: 'https://res.cloudinary.com/demo/dragon2.jpg', publicId: 'dragon-ref-2' }
  ]
};

describe('🎨 Complete User Journey Integration Tests', () => {
  let tattooRequestService: TattooRequestService;
  let paymentService: PaymentService;
  let appointmentService: AppointmentService;
  let bookingService: BookingService;
  let paymentLinkService: PaymentLinkService;
  let adminUser: any;
  let artist: any;

  beforeEach(async () => {
    // Initialize real services (no mocks)
    tattooRequestService = new TattooRequestService();
    paymentService = new PaymentService();
    appointmentService = new AppointmentService();
    bookingService = new BookingService();
    paymentLinkService = new PaymentLinkService();

    // Create test users
    adminUser = await testPrisma.user.create({
      data: {
        email: 'admin@tattoshop.com',
        role: 'admin'
      }
    });

    artist = await testPrisma.user.create({
      data: {
        email: 'artist@tattooshop.com',
        role: 'artist'
      }
    });
  });

  describe('🔄 Anonymous Customer: Complete Journey', () => {
    it('should complete the full journey: Request → Approval → Customer Creation → Booking → Payment', async () => {
      console.log('\n🎯 Starting Complete Anonymous Customer Journey');
      
      // ===== STEP 1: Submit Anonymous Tattoo Request =====
      console.log('\n📝 STEP 1: Anonymous customer submits tattoo request');
      
      const tattooRequest = await tattooRequestService.create(
        realisticTattooRequest,
        adminUser.id
      );

      // Verify request creation
      expect(tattooRequest).toBeDefined();
      expect(tattooRequest.trackingToken).toBeTruthy(); // Anonymous requests get tracking tokens
      expect(tattooRequest.customerId).toBeNull(); // No customer yet
      expect(tattooRequest.status).toBe('new');
      expect(tattooRequest.description).toBe(realisticTattooRequest.description);
      expect(tattooRequest.contactEmail).toBe(realisticTattooRequest.contactEmail);
      
      console.log(`✅ Request created: ${tattooRequest.id}`);
      console.log(`📧 Email: ${tattooRequest.contactEmail}`);
      console.log(`🎫 Tracking: ${tattooRequest.trackingToken}`);

      // ===== STEP 2: Admin Review Process =====
      console.log('\n🔍 STEP 2: Admin reviews and approves request');
      
      // Review step
      const reviewedRequest = await tattooRequestService.updateStatus(
        tattooRequest.id,
        'reviewed',
        adminUser.id
      );
      expect(reviewedRequest.status).toBe('reviewed');
      
      // Approval step
      const approvedRequest = await tattooRequestService.updateStatus(
        tattooRequest.id,
        'approved',
        adminUser.id
      );
      expect(approvedRequest.status).toBe('approved');
      
      console.log(`✅ Request approved by: ${adminUser.email}`);

      // ===== STEP 3: Convert to Appointment + Create Customer =====
      console.log('\n📅 STEP 3: Converting to appointment (auto-creates customer)');
      
      const appointmentData = {
        startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks out
        duration: 180, // 3 hours
        artistId: artist.id,
        bookingType: BookingType.TATTOO_SESSION,
        priceQuote: 900,
        note: 'Initial session for Japanese dragon sleeve'
      };

      const conversionResult = await tattooRequestService.convertToAppointment(
        tattooRequest.id,
        appointmentData,
        adminUser.id
      );

      // Verify conversion success
      expect(conversionResult.success).toBe(true);
      expect(conversionResult.appointment).toBeDefined();
      expect(conversionResult.customer).toBeTruthy(); // Customer was created
      expect(conversionResult.tattooRequest.status).toBe('converted_to_appointment');

      const appointment = conversionResult.appointment;
      const customerId = conversionResult.customer;

      console.log(`✅ Appointment: ${appointment.id}`);
      console.log(`👤 Customer created: ${customerId}`);
      console.log(`🎨 Artist: ${artist.email}`);

      // Verify customer was created properly
      const createdCustomer = await testPrisma.customer.findUnique({
        where: { id: customerId as string }
      });
      expect(createdCustomer).toBeDefined();
      expect(createdCustomer!.email).toBe(realisticTattooRequest.contactEmail);
      expect(createdCustomer!.phone).toBe(realisticTattooRequest.contactPhone);

      // ===== STEP 4: Create Payment Link =====
      console.log('\n💰 STEP 4: Creating payment link for deposit');
      
      const depositAmount = 450; // 50% deposit
      const paymentLinkResult = await paymentLinkService.createPaymentLink({
        amount: depositAmount,
        title: 'Tattoo Deposit - Japanese Dragon Design',
        description: 'Deposit payment for traditional Japanese dragon tattoo',
        customerId: customerId as string,
        appointmentId: appointment.id,
        paymentType: PaymentType.TATTOO_DEPOSIT,
        redirectUrl: 'http://localhost:3000/booking-confirmation'
      });

      expect(paymentLinkResult).toBeDefined();
      expect(paymentLinkResult.success).toBe(true);
      expect(paymentLinkResult.url).toContain('checkout');
      expect(paymentLinkResult.paymentLink).toBeDefined();

      console.log(`✅ Payment link: ${paymentLinkResult.paymentLink.id}`);
      console.log(`🔗 URL: ${paymentLinkResult.url}`);

      // ===== STEP 5: Process Payment =====
      console.log('\n💳 STEP 5: Customer pays deposit');
      
      const payment = await paymentService.processPayment({
        sourceId: 'test-card-source-nonce',
        amount: depositAmount,
        customerId: customerId as string,
        paymentType: PaymentType.TATTOO_DEPOSIT,
        bookingId: appointment.id,
        note: 'Deposit for Japanese dragon tattoo session',
        customerEmail: realisticTattooRequest.contactEmail,
        staffId: adminUser.id
      });

      expect(payment.success).toBe(true);
      expect(payment.payment).toBeDefined();
      expect(payment.payment.amount).toBe(depositAmount);
      expect(payment.payment.status).toBe('completed');
      expect(payment.payment.paymentType).toBe(PaymentType.TATTOO_DEPOSIT);

      console.log(`✅ Payment processed: ${payment.payment.id}`);
      console.log(`💵 Amount: $${payment.payment.amount}`);

      // ===== STEP 6: Verify Complete Flow Integrity =====
      console.log('\n🔍 STEP 6: Verifying complete flow integrity');

      // Check audit trail
      const auditLogs = await testPrisma.auditLog.findMany({
        where: {
          OR: [
            { resourceId: tattooRequest.id },
            { resourceId: appointment.id },
            { resourceId: payment.payment.id }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });

      expect(auditLogs.length).toBeGreaterThan(3);
      
      // Verify final state
      const finalRequest = await tattooRequestService.findById(tattooRequest.id);
      const finalAppointment = await appointmentService.findById(appointment.id);

      expect(finalRequest.status).toBe('converted_to_appointment');
      expect(finalRequest.customerId).toBe(customerId);
      expect(finalAppointment.status).toBe('confirmed');
      expect(finalAppointment.customerId).toBe(customerId);
      expect(finalAppointment.tattooRequestId).toBe(tattooRequest.id);

      console.log('\n🎉 COMPLETE JOURNEY SUCCESSFUL!');
      console.log('📊 Final State:');
      console.log(`   • Tattoo Request: ${tattooRequest.id} (converted)`);
      console.log(`   • Customer: ${customerId} (created from anonymous)`);
      console.log(`   • Appointment: ${appointment.id} (confirmed)`);
      console.log(`   • Payment: ${payment.payment.id} (completed)`);
      console.log(`   • Audit Trail: ${auditLogs.length} entries`);
    });
  });

  describe('🎯 Existing Customer Journey', () => {
    it('should handle existing customer requests efficiently', async () => {
      console.log('\n🎯 Starting Existing Customer Journey');

      // Create existing customer
      const existingCustomer = await testPrisma.customer.create({
        data: {
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          phone: '+1 (555) 987-6543',
          notes: 'Returning customer'
        }
      });

      // Existing customer submits request
      const tattooRequest = await tattooRequestService.create(
        {
          ...realisticTattooRequest,
          customerId: existingCustomer.id,
          contactEmail: existingCustomer.email || '',
          description: 'Small watercolor rose on wrist - returning customer',
          size: 'Small (2-3 inches)',
          style: 'Watercolor'
        },
        adminUser.id
      );

      expect(tattooRequest.customerId).toBe(existingCustomer.id);
      expect(tattooRequest.trackingToken).toBeNull(); // No tracking for authenticated

      // Fast approval
      await tattooRequestService.updateStatus(tattooRequest.id, 'reviewed', adminUser.id);
      await tattooRequestService.updateStatus(tattooRequest.id, 'approved', adminUser.id);

      // Convert to appointment
      const conversionResult = await tattooRequestService.convertToAppointment(
        tattooRequest.id,
        {
          startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          duration: 90,
          artistId: artist.id,
          priceQuote: 350,
          note: 'Small piece for returning customer'
        },
        adminUser.id
      );

      expect(conversionResult.success).toBe(true);
      expect(conversionResult.customer).toBe(existingCustomer.id); // Used existing customer

      // Process full payment (smaller piece)
      const payment = await paymentService.processPayment({
        sourceId: 'existing-customer-card',
        amount: 350,
        customerId: existingCustomer.id,
        paymentType: PaymentType.TATTOO_FINAL,
        bookingId: conversionResult.appointment.id,
        note: 'Full payment for small watercolor piece',
        customerEmail: existingCustomer.email || ''
      });

      expect(payment.success).toBe(true);
      expect(payment.payment.paymentType).toBe(PaymentType.TATTOO_FINAL);

      console.log('✅ Existing customer journey completed efficiently');
    });
  });

  describe('💰 Advanced Payment Scenarios', () => {
    it('should handle multiple payment types and business rules', async () => {
      console.log('\n💰 Testing Advanced Payment Business Logic');

      const customer = await testPrisma.customer.create({
        data: {
          name: 'Payment Test',
          email: 'payment@test.com',
          phone: '+1555000000'
        }
      });

      const appointment = await testPrisma.appointment.create({
        data: {
          customerId: customer.id,
          artistId: artist.id,
          startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          duration: 240,
          status: 'confirmed',
          priceQuote: 1200,
          type: 'tattoo_session'
        }
      });

      // 1. Consultation fee
      const consultation = await paymentService.processPayment({
        sourceId: 'consultation-source',
        amount: 75,
        customerId: customer.id,
        paymentType: PaymentType.CONSULTATION,
        note: 'Initial consultation'
      });
      expect(consultation.success).toBe(true);

      // 2. Deposit payment
      const deposit = await paymentService.processPayment({
        sourceId: 'deposit-source',
        amount: 600,
        customerId: customer.id,
        paymentType: PaymentType.TATTOO_DEPOSIT,
        bookingId: appointment.id,
        note: 'Deposit payment'
      });
      expect(deposit.success).toBe(true);

      // 3. Final payment
      const final = await paymentService.processPayment({
        sourceId: 'final-source',
        amount: 600,
        customerId: customer.id,
        paymentType: PaymentType.TATTOO_FINAL,
        bookingId: appointment.id,
        note: 'Final payment'
      });
      expect(final.success).toBe(true);

      // Verify payment history
      const payments = await testPrisma.payment.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'asc' }
      });

      expect(payments).toHaveLength(3);
      expect(payments[0].paymentType).toBe(PaymentType.CONSULTATION);
      expect(payments[1].paymentType).toBe(PaymentType.TATTOO_DEPOSIT);
      expect(payments[2].paymentType).toBe(PaymentType.TATTOO_FINAL);

      const total = payments.reduce((sum, p) => sum + p.amount, 0);
      expect(total).toBe(1275); // 75 + 600 + 600

      console.log(`✅ Processed ${payments.length} payments totaling $${total}`);
    });

    it('should validate payment business rules', async () => {
      const customer = await testPrisma.customer.create({
        data: { name: 'Validation Test', email: 'validation@test.com' }
      });

      // Test minimum amount validation
      await expect(
        paymentService.processPayment({
          sourceId: 'invalid',
          amount: 0.5, // Below minimum
          customerId: customer.id,
          paymentType: PaymentType.CONSULTATION
        })
      ).rejects.toThrow();

      console.log('✅ Payment validation rules enforced');
    });
  });

  describe('📋 Business Logic Validation', () => {
    it('should enforce proper workflow transitions', async () => {
      console.log('\n📋 Testing Business Rule Enforcement');

      const request = await tattooRequestService.create(realisticTattooRequest);

      // Valid: new -> reviewed
      await tattooRequestService.updateStatus(request.id, 'reviewed', adminUser.id);

      // Invalid: reviewed -> converted (must approve first)
      await expect(
        tattooRequestService.updateStatus(request.id, 'converted_to_appointment', adminUser.id)
      ).rejects.toThrow('Invalid status transition');

      // Test data validation
      await expect(
        tattooRequestService.create({
          description: 'Too short',
          contactEmail: 'invalid-email'
        })
      ).rejects.toThrow();

      console.log('✅ Business rules properly enforced');
    });
  });

  describe('🖼️ Image Integration', () => {
    it('should handle image uploads and transfers', async () => {
      const requestWithImages = await tattooRequestService.create({
        ...realisticTattooRequest,
        referenceImages: [
          { url: 'https://example.com/img1.jpg', publicId: 'img-1' },
          { url: 'https://example.com/img2.jpg', publicId: 'img-2' }
        ]
      });

      // Verify images stored
      const images = await testPrisma.image.findMany({
        where: { tattooRequestId: requestWithImages.id }
      });
      expect(images).toHaveLength(2);

      // Test image transfer during conversion
      await tattooRequestService.updateStatus(requestWithImages.id, 'reviewed', adminUser.id);
      await tattooRequestService.updateStatus(requestWithImages.id, 'approved', adminUser.id);

      const conversion = await tattooRequestService.convertToAppointment(
        requestWithImages.id,
        {
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          duration: 120,
          artistId: artist.id
        },
        adminUser.id
      );

      expect(conversion.success).toBe(true);
      console.log('✅ Images handled and transferred successfully');
    });
  });
});

console.log('\n🎯 Integration Test Suite Ready');
console.log('Testing REAL business logic with mocked external services only!'); 
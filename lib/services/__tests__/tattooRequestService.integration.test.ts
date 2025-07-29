import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { TattooRequestService } from '../tattooRequestService';
import { BookingType } from '../bookingService';
import { NotFoundError, ValidationError } from '../errors';
import { PrismaClient } from '@prisma/client';

// Test database
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
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('BYPASS_AUTH', 'true');
  
  // Mock Square client
  vi.mock('../square/index', () => {
    const mockSquareClient = {
      createPayment: vi.fn().mockResolvedValue({
        result: {
          payment: {
            id: 'sq-payment-mock',
            status: 'COMPLETED',
            amountMoney: { amount: 50000, currency: 'CAD' },
            sourceType: 'CARD'
          }
        }
      }),
      createCustomer: vi.fn().mockResolvedValue({
        result: {
          customer: {
            id: 'sq-customer-mock',
            givenName: 'Test',
            emailAddress: 'test@example.com'
          }
        }
      }),
      createBooking: vi.fn().mockResolvedValue({
        result: {
          booking: {
            id: 'sq-booking-mock',
            startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            customerId: 'sq-customer-mock'
          }
        }
      })
    };

    return {
      default: class MockSquareClient {
        static fromEnv() {
          return mockSquareClient;
        }
        constructor() {
          return mockSquareClient;
        }
      }
    };
  });

  // Mock Cloudinary
  vi.mock('../../cloudinary', () => ({
    default: {
      validateUploadResult: vi.fn().mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/test.jpg',
        publicId: 'test-image-123'
      }),
      transferImagesToCustomer: vi.fn().mockResolvedValue(true),
      getTattooRequestImages: vi.fn().mockResolvedValue([]),
      cloudinary: {
        uploader: {
          update_metadata: vi.fn().mockResolvedValue({ public_id: 'test' })
        }
      }
    }
  }));

  await testPrisma.$connect();
});

beforeEach(async () => {
  // Clean database before each test - exact same pattern as working integration test
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

// Test data factories
const createTestUser = async (role: 'admin' | 'artist' = 'admin') => {
  const uniqueId = Date.now() + Math.random();
  return await testPrisma.user.create({
    data: {
      email: `${role}-${uniqueId}@test.com`,
      role
    }
  });
};

const createTestCustomer = async (overrides: any = {}) => {
  const uniqueId = Date.now() + Math.random();
  return await testPrisma.customer.create({
    data: {
      name: 'Test Customer',
      email: `customer-${uniqueId}@test.com`,
      phone: '+1234567890',
      ...overrides
    }
  });
};

// Helper to ensure artist exists
const ensureArtistExists = async (currentArtist: any) => {
  const existingArtist = await testPrisma.user.findUnique({
    where: { id: currentArtist?.id || 'non-existent' }
  });
  if (!existingArtist) {
    console.log('⚠️ Artist not found, recreating...');
    return await testPrisma.user.create({
      data: {
        email: `artist-backup-${Date.now()}@tattooshop.com`,
        role: 'artist'
      }
    });
  }
  return existingArtist;
};

// Realistic test data matching your working integration test
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

describe('🎨 TattooRequestService Integration Tests', () => {
  let tattooRequestService: TattooRequestService;
  let adminUser: any;
  let artist: any;

  beforeEach(async () => {
    // Initialize real services (no mocks)
    tattooRequestService = new TattooRequestService();

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

  describe('🔄 Complete TattooRequest Business Logic Flow', () => {
    it('should handle complete anonymous request → approval → conversion → customer creation flow', { timeout: 15000 }, async () => {
      console.log('\n🎯 Testing Complete TattooRequest Flow');
      
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
       
       // Ensure artist still exists (may have been cleaned up)
       artist = await ensureArtistExists(artist);
       
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

      // ===== STEP 4: Verify Complete Flow Integrity =====
      console.log('\n🔍 STEP 4: Verifying complete flow integrity');

      // Check audit trail
      const auditLogs = await testPrisma.auditLog.findMany({
        where: {
          OR: [
            { resourceId: tattooRequest.id },
            { resourceId: appointment.id }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });

      expect(auditLogs.length).toBeGreaterThan(3);
      
      // Verify final state
      const finalRequest = await tattooRequestService.findById(tattooRequest.id);

      expect(finalRequest.status).toBe('converted_to_appointment');
      expect(finalRequest.customerId).toBe(customerId);

      console.log('\n🎉 TATTOO REQUEST SERVICE INTEGRATION SUCCESSFUL!');
      console.log('📊 Final State:');
      console.log(`   • Tattoo Request: ${tattooRequest.id} (converted)`);
      console.log(`   • Customer: ${customerId} (created from anonymous)`);
      console.log(`   • Appointment: ${appointment.id} (confirmed)`);
      console.log(`   • Audit Trail: ${auditLogs.length} entries`);
    });

    it('should handle existing customer requests efficiently', async () => {
      console.log('\n🎯 Testing Existing Customer Flow');

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

      // Ensure artist exists before conversion
      artist = await ensureArtistExists(artist);

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

      console.log('✅ Existing customer journey completed efficiently');
    });

    it('should enforce business validation rules', async () => {
      console.log('\n📋 Testing Business Rule Enforcement');

      // Test description length validation
      await expect(
        tattooRequestService.create({
          description: 'Too short',
          contactEmail: 'test@example.com'
        })
      ).rejects.toThrow('Description must be at least 10 characters');

      // Test email requirement for anonymous
      await expect(
        tattooRequestService.create({
          description: 'Valid description but no contact info'
        })
      ).rejects.toThrow('Either customer ID or contact email is required');

      // Test invalid email format
      await expect(
        tattooRequestService.create({
          description: 'Valid description with invalid email',
          contactEmail: 'invalid-email'
        })
      ).rejects.toThrow('Invalid email format');

      console.log('✅ Business rules properly enforced');
    });

    it('should enforce proper status workflow transitions', async () => {
      console.log('\n🔄 Testing Status Workflow');

      const request = await tattooRequestService.create({
        description: 'Test workflow transitions',
        contactEmail: 'workflow@test.com'
      });

      // Valid: new → reviewed
      const reviewed = await tattooRequestService.updateStatus(request.id, 'reviewed', adminUser.id);
      expect(reviewed.status).toBe('reviewed');

      // Valid: reviewed → approved
      const approved = await tattooRequestService.updateStatus(request.id, 'approved', adminUser.id);
      expect(approved.status).toBe('approved');

      // Invalid: try to go back to reviewed
      await expect(
        tattooRequestService.updateStatus(request.id, 'reviewed', adminUser.id)
      ).rejects.toThrow('Invalid status transition');

      // Test direct approval path (new → approved)
      const request2 = await tattooRequestService.create({
        description: 'Test direct approval',
        contactEmail: 'direct@test.com'
      });
      
      // Valid: new → approved (direct approval)
      const directApproved = await tattooRequestService.updateStatus(request2.id, 'approved', adminUser.id);
      expect(directApproved.status).toBe('approved');
      
      // Test direct rejection path (new → rejected)
      const request3 = await tattooRequestService.create({
        description: 'Test direct rejection',
        contactEmail: 'reject@test.com'
      });
      
      // Valid: new → rejected (direct rejection)
      const directRejected = await tattooRequestService.updateStatus(request3.id, 'rejected', adminUser.id);
      expect(directRejected.status).toBe('rejected');

      console.log('✅ Status workflow properly enforced');
    });
  });
});

console.log('\n🎯 TattooRequestService Integration Test Suite Ready');
console.log('Testing REAL business logic with mocked external services only!'); 
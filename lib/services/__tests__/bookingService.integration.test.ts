import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import BookingService, { BookingType, BookingStatus } from '../bookingService';
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
});

// Mock Square client
vi.mock('../square/index.js', () => ({
  default: {
    fromEnv: vi.fn(() => ({
      createBooking: vi.fn().mockResolvedValue({
        result: {
          booking: {
            id: 'sq-booking-mock',
            version: 1
          }
        }
      }),
      updateBooking: vi.fn().mockResolvedValue({
        result: { booking: { id: 'sq-booking-mock', version: 2 } }
      }),
      cancelBooking: vi.fn().mockResolvedValue({ result: true }),
      createPayment: vi.fn().mockResolvedValue({
        result: {
          payment: {
            id: 'sq-payment-mock',
            status: 'COMPLETED',
            amountMoney: { amount: 50000, currency: 'CAD' },
            sourceType: 'CARD'
          }
        }
      })
    }))
  }
}));

// Mock Cloudinary
vi.mock('../../cloudinary', () => ({
  default: {
    validateUploadResult: vi.fn().mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/test.jpg',
      publicId: 'test-image-123'
    }),
    transferImagesToCustomer: vi.fn().mockResolvedValue(true),
    getTattooRequestImages: vi.fn().mockResolvedValue([])
  }
}));

afterAll(async () => {
  await testPrisma.$disconnect();
  vi.unstubAllEnvs();
});

describe('BookingService (Integration)', () => {
  let bookingService: BookingService;
  let testCustomer: any;
  let testArtist: any;

  beforeEach(async () => {
    // Initialize REAL service (no mocks)
    bookingService = new BookingService();
    
    // Clean database FIRST in correct order (foreign keys matter)
    await testPrisma.auditLog.deleteMany();
    await testPrisma.appointment.deleteMany();
    await testPrisma.customer.deleteMany();
    await testPrisma.user.deleteMany();

    // Create unique identifiers
    const uniqueId = Date.now() + Math.random();
    
    // Create test customer with unique squareId
    testCustomer = await testPrisma.customer.create({
      data: {
        name: 'Test Customer',
        email: `customer-${uniqueId}@test.com`,
        phone: '+1234567890',
        squareId: `sq-customer-${uniqueId}` // Make squareId unique
      }
    });

    // Create test artist
    testArtist = await testPrisma.user.create({
      data: {
        email: `artist-${uniqueId}@tattooshop.com`,
        role: 'artist'
      }
    });
  });

  describe('📋 Booking Creation (Full Orchestration)', () => {
    it('should create authenticated booking successfully', async () => {
      console.log('\n📋 Testing authenticated booking creation');
      
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
      const bookingParams = {
        startAt: futureDate,
        duration: 120, // 2 hours
        customerId: testCustomer.id,
        bookingType: BookingType.CONSULTATION,
        artistId: testArtist.id,
        customerEmail: testCustomer.email,
        customerPhone: testCustomer.phone,
        note: 'Full orchestration booking test',
        priceQuote: 200,
        status: BookingStatus.SCHEDULED
      };

      const result = await bookingService.createBooking(bookingParams);

      expect(result.success).toBe(true);
      expect(result.booking).toBeDefined();
      expect(result.booking.customerId).toBe(testCustomer.id);
      expect(result.booking.artistId).toBe(testArtist.id);
      expect(result.booking.duration).toBe(120);
      expect(result.booking.status).toBe(BookingStatus.SCHEDULED);
      expect(result.booking.type).toBe(BookingType.CONSULTATION);
      expect(result.booking.priceQuote).toBe(200);

      // Verify database storage
      const dbBooking = await testPrisma.appointment.findUnique({
        where: { id: result.booking.id },
        include: { customer: true, artist: true }
      });
      
             expect(dbBooking).toBeTruthy();
       expect(dbBooking?.customer?.email).toBe(testCustomer.email);
       expect(dbBooking?.artist?.email).toBe(testArtist.email);

      console.log('✅ Authenticated booking created successfully');
    });

    it('should create anonymous booking with contact info', async () => {
      console.log('\n📞 Testing anonymous booking creation');
      
      const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now
      const anonymousParams = {
        startAt: futureDate,
        duration: 60,
        bookingType: BookingType.CONSULTATION,
        contactEmail: 'anonymous@example.com',
        contactPhone: '+1987654321',
        isAnonymous: true
      };

      const result = await bookingService.createBooking(anonymousParams);

      expect(result.success).toBe(true);
      expect(result.booking.customerId).toBeNull();
      expect(result.booking.contactEmail).toBe('anonymous@example.com');
      expect(result.booking.contactPhone).toBe('+1987654321');
      expect(result.booking.status).toBe(BookingStatus.SCHEDULED);

      // Should NOT sync with Square for anonymous bookings
      expect(result.squareBooking).toBeNull();

      console.log('✅ Anonymous booking created successfully');
    });

    it('should validate availability before creating booking', async () => {
      console.log('\n⏰ Testing availability validation during booking');
      
      const startTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
      
      // Create first booking
      await bookingService.createBooking({
        startAt: startTime,
        duration: 120, // 2 hours
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.CONSULTATION
      });

      // Try to create overlapping booking with same artist
      const overlappingTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
      await expect(
        bookingService.createBooking({
          startAt: overlappingTime,
          duration: 120,
          customerId: testCustomer.id,
          artistId: testArtist.id,
          bookingType: BookingType.CONSULTATION
        })
      ).rejects.toThrow('Selected time slot is not available');

      console.log('✅ Availability validation working correctly');
    });

    it('should handle booking without artist (general availability)', async () => {
      console.log('\n🎯 Testing booking without specific artist');
      
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const generalBookingParams = {
        startAt: futureDate,
        duration: 90,
        customerId: testCustomer.id,
        bookingType: BookingType.DRAWING_CONSULTATION,
        note: 'Any available artist is fine'
      };

      const result = await bookingService.createBooking(generalBookingParams);

      expect(result.success).toBe(true);
      expect(result.booking.artistId).toBeNull();
      expect(result.booking.notes).toContain('Any available artist is fine');

      console.log('✅ General availability booking working correctly');
    });
  });

  describe('✏️ Booking Updates', () => {
    let testBooking: any;

    beforeEach(async () => {
      console.log('\n✏️ Setting up booking for update testing');
      
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const result = await bookingService.createBooking({
        startAt: futureDate,
        duration: 90,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.CONSULTATION,
        note: 'Original booking',
        priceQuote: 150
      });
      testBooking = result.booking;

      console.log(`Test booking created: ${testBooking.id}`);
    });

    it('should update booking details successfully', async () => {
      console.log('\n📝 Testing booking update');
      
      const newStartTime = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now
      const updateParams = {
        bookingId: testBooking.id,
        startAt: newStartTime,
        duration: 120,
        status: BookingStatus.CONFIRMED,
        artistId: testArtist.id,
        note: 'Updated booking details',
        priceQuote: 200
      };

      const result = await bookingService.updateBooking(updateParams);

      expect(result.success).toBe(true);
      expect(result.booking.startTime).toEqual(newStartTime);
      expect(result.booking.duration).toBe(120);
      expect(result.booking.status).toBe(BookingStatus.CONFIRMED);
      expect(result.booking.notes).toBe('Updated booking details');
      expect(result.booking.priceQuote).toBe(200);

      console.log('✅ Booking updated successfully');
    });

    it('should validate availability when updating time', async () => {
      console.log('\n⏰ Testing availability validation during update');
      
      // Create conflicting booking
      const conflictTime = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      await bookingService.createBooking({
        startAt: conflictTime,
        duration: 120,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.CONSULTATION
      });

      // Try to update original booking to conflict
      await expect(
        bookingService.updateBooking({
          bookingId: testBooking.id,
          startAt: new Date(conflictTime.getTime() + 30 * 60 * 1000), // 30 minutes into existing booking
          artistId: testArtist.id
        })
      ).rejects.toThrow('Updated time slot is not available');

      console.log('✅ Update availability validation working correctly');
    });

    it('should handle partial updates correctly', async () => {
      console.log('\n🔄 Testing partial booking updates');
      
      const partialUpdate = {
        bookingId: testBooking.id,
        status: BookingStatus.CONFIRMED
      };

      const result = await bookingService.updateBooking(partialUpdate);

      expect(result.success).toBe(true);
      expect(result.booking.status).toBe(BookingStatus.CONFIRMED);
      // Other fields should remain unchanged
      expect(result.booking.duration).toBe(90); // Original duration
      expect(result.booking.priceQuote).toBe(150); // Original price

      console.log('✅ Partial update working correctly');
    });
  });

  describe('❌ Booking Cancellation', () => {
    let testBooking: any;

    beforeEach(async () => {
      console.log('\n❌ Setting up booking for cancellation testing');
      
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const result = await bookingService.createBooking({
        startAt: futureDate,
        duration: 90,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.CONSULTATION,
        note: 'Booking to be cancelled'
      });
      testBooking = result.booking;
    });

    it('should cancel booking successfully', async () => {
      console.log('\n🚫 Testing booking cancellation');
      
      const cancelParams = {
        bookingId: testBooking.id,
        reason: 'Customer request',
        cancelledBy: testArtist.id
      };

      const result = await bookingService.cancelBooking(cancelParams);

      expect(result.success).toBe(true);
      expect(result.booking.status).toBe(BookingStatus.CANCELLED);
      expect(result.booking.notes).toContain('Customer request');

      console.log('✅ Booking cancelled successfully');
    });

    it('should handle cancellation without Square ID gracefully', async () => {
      console.log('\n🔄 Testing cancellation of booking without Square sync');
      
      const result = await bookingService.cancelBooking({
        bookingId: testBooking.id,
        reason: 'Testing cancellation'
      });

      expect(result.success).toBe(true);
      expect(result.squareCancelled).toBe(false); // No Square ID to cancel

      console.log('✅ Non-Square cancellation working correctly');
    });
  });

  describe('📅 Booking Availability Integration', () => {
    it('should get booking availability for specific date', async () => {
      console.log('\n📅 Testing booking availability retrieval');
      
      const testDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const result = await bookingService.getBookingAvailability(testDate, testArtist.id);

      expect(result.success).toBe(true);
      expect(result.date).toBeTruthy();
      expect(result.availableSlots).toBeDefined();
      expect(Array.isArray(result.availableSlots)).toBe(true);

      console.log('✅ Booking availability retrieval working correctly');
    });

    it('should handle availability without specific artist', async () => {
      console.log('\n🎯 Testing general availability (no specific artist)');
      
      const testDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      const result = await bookingService.getBookingAvailability(testDate);

      expect(result.success).toBe(true);
      expect(result.availableSlots).toBeDefined();

      console.log('✅ General availability working correctly');
    });
  });

  describe('🔄 Complete Booking Workflows', () => {
    it('should handle complete booking lifecycle', async () => {
      console.log('\n🔄 Testing complete booking lifecycle');
      
      // Step 1: Create booking
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const createResult = await bookingService.createBooking({
        startAt: futureDate,
        duration: 120,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.TATTOO_SESSION,
        note: 'Lifecycle test booking',
        priceQuote: 500
      });

      expect(createResult.success).toBe(true);
      expect(createResult.booking.status).toBe(BookingStatus.SCHEDULED);

      // Step 2: Update to confirmed
      const updateResult = await bookingService.updateBooking({
        bookingId: createResult.booking.id,
        status: BookingStatus.CONFIRMED,
        note: 'Lifecycle test booking - CONFIRMED'
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.booking.status).toBe(BookingStatus.CONFIRMED);

      // Step 3: Cancel booking
      const cancelResult = await bookingService.cancelBooking({
        bookingId: createResult.booking.id,
        reason: 'Lifecycle test completion'
      });

      expect(cancelResult.success).toBe(true);
      expect(cancelResult.booking.status).toBe(BookingStatus.CANCELLED);

      // Step 4: Verify audit trail
      const auditLogs = await testPrisma.auditLog.findMany({
        where: { resourceId: createResult.booking.id },
        orderBy: { createdAt: 'asc' }
      });

      expect(auditLogs.length).toBeGreaterThanOrEqual(3); // Create + Update + Cancel
      console.log(`Audit trail: ${auditLogs.length} entries`);

      console.log('✅ Complete booking lifecycle successful');
    });

    it('should handle booking without tattoo request reference', async () => {
      console.log('\n🎨 Testing booking for tattoo session (no request reference)');
      
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const bookingParams = {
        startAt: futureDate,
        duration: 180, // 3 hours for tattoo session
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.TATTOO_SESSION,
        note: 'Direct tattoo session booking',
        priceQuote: 750
      };

      const result = await bookingService.createBooking(bookingParams);

      expect(result.success).toBe(true);
      expect(result.booking.type).toBe(BookingType.TATTOO_SESSION);
      expect(result.booking.duration).toBe(180);
      expect(result.booking.priceQuote).toBe(750);

      console.log('✅ Tattoo session booking working correctly');
    });
  });
}); 
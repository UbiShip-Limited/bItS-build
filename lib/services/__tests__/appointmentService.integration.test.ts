import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { AppointmentService } from '../appointmentService';
import { BookingStatus, BookingType } from '../../types/booking';
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
      cancelBooking: vi.fn().mockResolvedValue({ result: true })
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

describe('AppointmentService (Integration)', () => {
  let appointmentService: AppointmentService;
  let testCustomer: any;
  let testArtist: any;

  beforeEach(async () => {
    // Initialize REAL service (no mocks)
    appointmentService = new AppointmentService();
    
    // Create test data FIRST, then clean in correct order
    const uniqueId = Date.now() + Math.random();
    
    // Clean database in correct order (foreign keys matter)
    await testPrisma.auditLog.deleteMany();
    await testPrisma.appointment.deleteMany();
    await testPrisma.customer.deleteMany();
    await testPrisma.user.deleteMany();

    // Create test customer
    testCustomer = await testPrisma.customer.create({
      data: {
        name: 'Test Customer',
        email: `customer-${uniqueId}@test.com`,
        phone: '+1234567890'
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

  describe('📅 Appointment Creation', () => {
    it('should create appointment with customer successfully', async () => {
      console.log('\n📅 Testing appointment creation with customer');
      
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
      const appointmentData = {
        startAt: futureDate,
        duration: 120, // 2 hours
        customerId: testCustomer.id,
        bookingType: BookingType.CONSULTATION,
        artistId: testArtist.id,
        note: 'Initial consultation for sleeve tattoo',
        priceQuote: 200
      };

      const result = await appointmentService.create(appointmentData);

      expect(result).toBeDefined();
      expect(result.id).toBeTruthy();
      expect(result.startTime).toEqual(futureDate);
      expect(result.duration).toBe(120);
      expect(result.status).toBe(BookingStatus.SCHEDULED);
      expect(result.type).toBe(BookingType.CONSULTATION);
      expect(result.customerId).toBe(testCustomer.id);
      expect(result.artistId).toBe(testArtist.id);
      expect(result.notes).toBe('Initial consultation for sleeve tattoo');
      expect(result.priceQuote).toBe(200);

      // Verify database storage
      const dbAppointment = await testPrisma.appointment.findUnique({
        where: { id: result.id },
        include: { customer: true, artist: true }
      });
      
      expect(dbAppointment).toBeTruthy();
      expect(dbAppointment!.customer.email).toBe(testCustomer.email);
      expect(dbAppointment!.artist.email).toBe(testArtist.email);

      console.log('✅ Appointment created successfully');
    });

    it('should create anonymous appointment with contact info', async () => {
      console.log('\n📞 Testing anonymous appointment creation');
      
      const futureDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now
      const appointmentData = {
        startAt: futureDate,
        duration: 60, // 1 hour
        contactEmail: 'anonymous@example.com',
        contactPhone: '+1987654321',
        bookingType: BookingType.CONSULTATION,
        note: 'Anonymous consultation booking'
      };

      const result = await appointmentService.create(appointmentData);

      expect(result).toBeDefined();
      expect(result.customerId).toBeNull();
      expect(result.contactEmail).toBe('anonymous@example.com');
      expect(result.contactPhone).toBe('+1987654321');
      expect(result.status).toBe(BookingStatus.SCHEDULED);

      console.log('✅ Anonymous appointment created successfully');
    });

    it('should validate appointment data correctly', async () => {
      console.log('\n🚫 Testing appointment validation');
      
      // Past date (validates first)
      await expect(
        appointmentService.create({
          startAt: new Date('2020-01-01T10:00:00Z'),
          duration: 60,
          customerId: testCustomer.id,
          bookingType: BookingType.CONSULTATION
        })
      ).rejects.toThrow('Appointment date must be in the future');

      // Invalid duration
      await expect(
        appointmentService.create({
          startAt: new Date(Date.now() + 86400000), // Tomorrow
          duration: 5, // Too short
          customerId: testCustomer.id,
          bookingType: BookingType.CONSULTATION
        })
      ).rejects.toThrow('Minimum appointment duration is 15 minutes');

      // Missing customer ID and contact email (with valid date/duration)
      await expect(
        appointmentService.create({
          startAt: new Date(Date.now() + 86400000), // Tomorrow
          duration: 60,
          bookingType: BookingType.CONSULTATION
        })
      ).rejects.toThrow('Either customer ID or contact email is required');

      console.log('✅ Appointment validation working correctly');
    });

    it('should prevent time conflicts for same artist', async () => {
      console.log('\n⏰ Testing time conflict prevention');
      
      const startTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
      
      // Create first appointment
      await appointmentService.create({
        startAt: startTime,
        duration: 120, // 2 hours
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.CONSULTATION
      });

      // Try to create overlapping appointment with same artist
      const overlappingTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
      await expect(
        appointmentService.create({
          startAt: overlappingTime,
          duration: 120,
          customerId: testCustomer.id,
          artistId: testArtist.id,
          bookingType: BookingType.CONSULTATION
        })
      ).rejects.toThrow('Time conflict detected');

      console.log('✅ Time conflict prevention working correctly');
    });
  });

  describe('📝 Appointment Updates', () => {
    let testAppointment: any;

    beforeEach(async () => {
      console.log('\n📝 Setting up appointment for update testing');
      
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      testAppointment = await appointmentService.create({
        startAt: futureDate,
        duration: 90,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.CONSULTATION,
        note: 'Original appointment',
        priceQuote: 150
      });

      console.log(`Test appointment created: ${testAppointment.id}`);
    });

    it('should update appointment details successfully', async () => {
      console.log('\n✏️ Testing appointment update');
      
      const newStartTime = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 2 weeks from now
      const updateData = {
        startAt: newStartTime,
        duration: 120,
        status: BookingStatus.CONFIRMED,
        note: 'Updated appointment details',
        priceQuote: 200
      };

      const result = await appointmentService.update(testAppointment.id, updateData);

      expect(result.startTime).toEqual(newStartTime);
      expect(result.duration).toBe(120);
      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(result.notes).toBe('Updated appointment details');
      expect(result.priceQuote).toBe(200);

      // Verify audit log
      const auditLogs = await testPrisma.auditLog.findMany({
        where: { resourceId: testAppointment.id }
      });
      expect(auditLogs.length).toBeGreaterThanOrEqual(1);

      console.log('✅ Appointment updated successfully');
    });

    it('should validate artist exists when updating', async () => {
      console.log('\n👨‍🎨 Testing artist validation during update');
      
      await expect(
        appointmentService.update(testAppointment.id, {
          artistId: 'non-existent-artist'
        })
      ).rejects.toThrow(NotFoundError);

      console.log('✅ Artist validation working correctly');
    });
  });

  describe('❌ Appointment Cancellation', () => {
    let testAppointment: any;

    beforeEach(async () => {
      console.log('\n❌ Setting up appointment for cancellation testing');
      
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      testAppointment = await appointmentService.create({
        startAt: futureDate,
        duration: 90,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.CONSULTATION,
        note: 'Appointment to be cancelled'
      });
    });

    it('should cancel appointment successfully', async () => {
      console.log('\n🚫 Testing appointment cancellation');
      
      const result = await appointmentService.cancel(
        testAppointment.id,
        'Customer request',
        testArtist.id
      );

      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(result.notes).toContain('Customer request');

      // Verify audit log
      const auditLogs = await testPrisma.auditLog.findMany({
        where: { 
          resourceId: testAppointment.id,
          action: 'appointment_cancelled'
        }
      });
      expect(auditLogs.length).toBe(1);

      console.log('✅ Appointment cancelled successfully');
    });

    it('should prevent cancelling already cancelled appointment', async () => {
      console.log('\n🔒 Testing double cancellation prevention');
      
      // Cancel first time
      await appointmentService.cancel(testAppointment.id, 'First cancellation');

      // Try to cancel again
      await expect(
        appointmentService.cancel(testAppointment.id, 'Second cancellation')
      ).rejects.toThrow('Cannot cancel appointment that is already cancelled');

      console.log('✅ Double cancellation prevention working correctly');
    });
  });

  describe('📋 Appointment Retrieval and Business Logic', () => {
    beforeEach(async () => {
      console.log('\n📋 Setting up multiple appointments for retrieval testing');
      
      const baseTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 1 week from now
      
      // Create multiple appointments
      await appointmentService.create({
        startAt: new Date(baseTime),
        duration: 60,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.CONSULTATION,
        note: 'First appointment'
      });

      await appointmentService.create({
        startAt: new Date(baseTime + 2 * 60 * 60 * 1000), // 2 hours later
        duration: 90,
        customerId: testCustomer.id,
        bookingType: BookingType.DRAWING_CONSULTATION,
        note: 'Second appointment'
      });

      await appointmentService.create({
        startAt: new Date(baseTime + 4 * 60 * 60 * 1000), // 4 hours later
        duration: 120,
        contactEmail: 'third@example.com',
        bookingType: BookingType.TATTOO_SESSION,
        note: 'Third appointment (anonymous)'
      });
    });

    it('should retrieve appointments with pagination', async () => {
      console.log('\n📄 Testing appointment pagination');
      
      const result = await appointmentService.list({}, 1, 2);

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.pages).toBe(2);

      console.log('✅ Appointment pagination working correctly');
    });

    it('should filter appointments by status', async () => {
      console.log('\n🔍 Testing appointment filtering by status');
      
      const result = await appointmentService.list({ 
        status: BookingStatus.SCHEDULED 
      });

      expect(result.data).toHaveLength(3);
      expect(result.data.every(apt => apt.status === BookingStatus.SCHEDULED)).toBe(true);

      console.log('✅ Status filtering working correctly');
    });

    it('should handle complete appointment workflow', async () => {
      console.log('\n🔄 Testing complete appointment workflow');
      
      // Step 1: Create appointment
      const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      const appointment = await appointmentService.create({
        startAt: futureDate,
        duration: 120,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.TATTOO_SESSION,
        note: 'Workflow test appointment',
        priceQuote: 500
      });

      expect(appointment.status).toBe(BookingStatus.SCHEDULED);

      // Step 2: Update to confirmed
      const confirmed = await appointmentService.update(appointment.id, {
        status: BookingStatus.CONFIRMED,
        note: 'Workflow test appointment - CONFIRMED'
      });

      expect(confirmed.status).toBe(BookingStatus.CONFIRMED);
      expect(confirmed.notes).toContain('CONFIRMED');

      // Step 3: Verify audit trail
      const auditLogs = await testPrisma.auditLog.findMany({
        where: { resourceId: appointment.id },
        orderBy: { createdAt: 'asc' }
      });

      expect(auditLogs.length).toBeGreaterThanOrEqual(2); // Create + Update
      expect(auditLogs[0].action).toBe('appointment_created');
      expect(auditLogs[1].action).toBe('appointment_updated');

      console.log('✅ Complete appointment workflow successful');
    });
  });
}); 
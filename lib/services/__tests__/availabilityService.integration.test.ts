import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { AvailabilityService, AvailabilitySearchParams } from '../availabilityService';
import { BookingStatus } from '../../types/booking';
import { PrismaClient } from '@prisma/client';
import { addMinutes } from 'date-fns';

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
  vi.stubEnv('SQUARE_LOCATION_ID', 'test-location-123');
});

// Mock Square client
vi.mock('../square/index.js', () => ({
  default: {
    fromEnv: vi.fn(() => ({
      createBooking: vi.fn().mockResolvedValue({
        result: { booking: { id: 'sq-booking-mock' } }
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

describe('AvailabilityService (Integration)', () => {
  let availabilityService: AvailabilityService;
  let testArtist1: any;
  let testArtist2: any;

  beforeEach(async () => {
    // Initialize REAL service (no mocks)
    availabilityService = new AvailabilityService();
    
    // Clean database FIRST in correct order (foreign keys matter)
    await testPrisma.appointment.deleteMany();
    await testPrisma.user.deleteMany();

    // Create unique identifiers
    const uniqueId = Date.now() + Math.random();
    
    // Create test artists
    testArtist1 = await testPrisma.user.create({
      data: {
        email: `artist1-${uniqueId}@tattooshop.com`,
        role: 'artist'
      }
    });

    testArtist2 = await testPrisma.user.create({
      data: {
        email: `artist2-${uniqueId}@tattooshop.com`,  
        role: 'artist'
      }
    });
  });

  describe('🔍 Availability Search (Real Business Logic)', () => {
    it('should search availability with no conflicts', async () => {
      console.log('\n🔍 Testing availability search with no conflicts');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
      
      const endOfDay = new Date(tomorrow);
      endOfDay.setHours(17, 0, 0, 0); // 5 PM tomorrow
      
      const searchParams: AvailabilitySearchParams = {
        startAtMin: tomorrow,
        startAtMax: endOfDay,
        duration: 60, // 1 hour
        maxResults: 10
      };

      const result = await availabilityService.searchAvailability(searchParams);

      expect(result).toHaveProperty('availabilities');
      expect(result).toHaveProperty('totalResults');
      expect(result).toHaveProperty('searchParams');
      expect(result.searchParams).toEqual(searchParams);
      expect(Array.isArray(result.availabilities)).toBe(true);
      expect(typeof result.totalResults).toBe('number');

      console.log(`✅ Found ${result.totalResults} available slots`);
    });

    it('should filter by team member IDs', async () => {
      console.log('\n👥 Testing availability filtered by team members');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      
      const endOfDay = new Date(tomorrow);
      endOfDay.setHours(16, 0, 0, 0);

      const searchParams: AvailabilitySearchParams = {
        startAtMin: tomorrow,
        startAtMax: endOfDay,
        duration: 90, // 1.5 hours
        teamMemberIds: [testArtist1.id, testArtist2.id],
        maxResults: 5
      };

      const result = await availabilityService.searchAvailability(searchParams);

      expect(result.availabilities).toBeDefined();
      expect(result.totalResults).toBeGreaterThanOrEqual(0);
      
      // Verify search params are preserved
      expect(result.searchParams.teamMemberIds).toEqual([testArtist1.id, testArtist2.id]);

      console.log(`✅ Found ${result.totalResults} slots for specific team members`);
    });

    it('should exclude conflicting appointments', async () => {
      console.log('\n❌ Testing conflict exclusion');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0); // 2 PM tomorrow
      
      // Create a conflicting appointment
      const conflictingAppointment = await testPrisma.appointment.create({
        data: {
          startTime: tomorrow,
          endTime: addMinutes(tomorrow, 120), // 2 hours
          duration: 120,
          artistId: testArtist1.id,
          status: BookingStatus.SCHEDULED,
          type: 'consultation'
        }
      });

      const searchParams: AvailabilitySearchParams = {
        startAtMin: new Date(tomorrow.getTime() - 60 * 60 * 1000), // 1 hour before
        startAtMax: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000), // 3 hours after
        duration: 60,
        teamMemberIds: [testArtist1.id],
        maxResults: 10
      };

      const result = await availabilityService.searchAvailability(searchParams);

      // Should not include slots that conflict with the appointment
      const conflictingSlots = result.availabilities.filter(slot => {
        const slotStart = slot.startAt;
        const slotEnd = slot.endAt;
        const appointmentStart = conflictingAppointment.startTime;
        const appointmentEnd = conflictingAppointment.endTime;
        
        return slotStart < appointmentEnd && slotEnd > appointmentStart;
      });

      expect(conflictingSlots.length).toBe(0);

      console.log('✅ Conflicting appointments properly excluded');
    });
  });

  describe('📊 Business Booking Profile', () => {
    it('should return business booking profile with correct settings', async () => {
      console.log('\n📊 Testing business booking profile');
      
      const profile = await availabilityService.getBusinessBookingProfile();

      expect(profile).toHaveProperty('sellerId');
      expect(profile).toHaveProperty('bookingEnabled', true);
      expect(profile).toHaveProperty('customerTimezoneChoice', 'BUSINESS_LOCATION_TIMEZONE');
      expect(profile).toHaveProperty('bookingPolicy', 'ACCEPT_ALL');
      expect(profile).toHaveProperty('allowUserCancel', true);
      expect(profile).toHaveProperty('businessAppointmentSettings');

      expect(profile.businessAppointmentSettings).toMatchObject({
        locationTypes: ['PHYSICAL'],
        alignmentTime: 'SERVICE_DURATION',
        minBookingLeadTimeSeconds: 3600, // 1 hour
        maxBookingLeadTimeSeconds: 2592000, // 30 days
        anyTeamMemberBookingEnabled: true,
        multipleServiceBookingEnabled: false,
        maxAppointmentsPerDayLimitType: 'PER_TEAM_MEMBER',
        maxAppointmentsPerDayLimit: 8,
        cancellationWindowSeconds: 86400, // 24 hours
        cancellationPolicy: 'CANCELLATION_TREATED_AS_NO_SHOW'
      });

      console.log('✅ Business booking profile working correctly');
    });

    it('should include current timestamp', async () => {
      console.log('\n📅 Testing profile timestamp');
      
      const beforeTime = new Date();
      const profile = await availabilityService.getBusinessBookingProfile();
      const afterTime = new Date();

      expect(profile.createdAt).toBeDefined();
      const profileTime = new Date(profile.createdAt);
      expect(profileTime).toBeInstanceOf(Date);
      expect(profileTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(profileTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());

      console.log('✅ Profile timestamp working correctly');
    });
  });

  describe('🏢 Location Booking Profiles', () => {
    it('should return location booking profiles with business hours', async () => {
      console.log('\n🏢 Testing location booking profiles');
      
      const profiles = await availabilityService.getLocationBookingProfiles();

      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBe(1);

      const profile = profiles[0];
      expect(profile).toHaveProperty('locationId', 'test-location-123');
      expect(profile).toHaveProperty('bookingEnabled', true);
      expect(profile).toHaveProperty('onlineBookingEnabled', true);
      expect(profile).toHaveProperty('businessHours');
      expect(Array.isArray(profile.businessHours)).toBe(true);
      expect(profile.businessHours.length).toBe(7); // 7 days of the week

      console.log('✅ Location profiles working correctly');
    });

    it('should include business appointment settings', async () => {
      console.log('\n⚙️ Testing business appointment settings in location profile');
      
      const profiles = await availabilityService.getLocationBookingProfiles();
      const profile = profiles[0];

      expect(profile).toHaveProperty('businessAppointmentSettings');
      expect(profile.businessAppointmentSettings).toMatchObject({
        locationTypes: ['PHYSICAL'],
        alignmentTime: 'SERVICE_DURATION',
        minBookingLeadTimeSeconds: 3600,
        maxBookingLeadTimeSeconds: 2592000,
        anyTeamMemberBookingEnabled: true,
        multipleServiceBookingEnabled: false,
        maxAppointmentsPerDayLimitType: 'PER_TEAM_MEMBER',
        maxAppointmentsPerDayLimit: 8,
        cancellationWindowSeconds: 86400,
        cancellationPolicy: 'CANCELLATION_TREATED_AS_NO_SHOW'
      });

      console.log('✅ Business appointment settings working correctly');
    });
  });

  describe('👥 Team Member Booking Profiles', () => {
    it('should return profiles for all artists when no IDs provided', async () => {
      console.log('\n👥 Testing team member profiles (all artists)');
      
      const profiles = await availabilityService.getTeamMemberBookingProfiles();

      expect(profiles.length).toBeGreaterThanOrEqual(2); // At least our 2 test artists
      
      const testProfile = profiles.find(p => p.teamMemberId === testArtist1.id);
      expect(testProfile).toBeDefined();
      expect(testProfile?.description).toContain(testArtist1.email);
      expect(testProfile?.displayName).toBe(testArtist1.email);
      expect(testProfile?.isBookable).toBe(true);

      console.log(`✅ Found ${profiles.length} team member profiles`);
    });

    it('should filter by team member IDs when provided', async () => {
      console.log('\n🎯 Testing filtered team member profiles');
      
      const profiles = await availabilityService.getTeamMemberBookingProfiles([testArtist1.id]);

      expect(profiles.length).toBe(1);
      expect(profiles[0].teamMemberId).toBe(testArtist1.id);
      expect(profiles[0].displayName).toBe(testArtist1.email);

      console.log('✅ Team member filtering working correctly');
    });

    it('should include team member booking profile details', async () => {
      console.log('\n📋 Testing team member profile details');
      
      const profiles = await availabilityService.getTeamMemberBookingProfiles([testArtist2.id]);
      const profile = profiles[0];

      expect(profile.teamMemberBookingProfile).toMatchObject({
        teamMemberId: testArtist2.id,
        description: expect.stringContaining(testArtist2.email),
        displayName: testArtist2.email,
        isBookable: true,
        hourlyRate: null,
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      console.log('✅ Team member profile details working correctly');
    });
  });

  describe('⏰ Time Slot Availability', () => {
    it('should return true when no conflicting appointments exist', async () => {
      console.log('\n⏰ Testing time slot availability with no conflicts');
      
      const testStartTime = new Date();
      testStartTime.setDate(testStartTime.getDate() + 1);
      testStartTime.setHours(15, 0, 0, 0); // 3 PM tomorrow
      const testDuration = 90; // 1.5 hours

      const result = await availabilityService.isTimeSlotAvailable(testStartTime, testDuration);

      expect(result).toBe(true);

      console.log('✅ No conflicts - slot available');
    });

    it('should return false when conflicting appointments exist', async () => {
      console.log('\n❌ Testing time slot availability with conflicts');
      
      const testStartTime = new Date();
      testStartTime.setDate(testStartTime.getDate() + 1);
      testStartTime.setHours(16, 0, 0, 0); // 4 PM tomorrow
      
      // Create conflicting appointment
      await testPrisma.appointment.create({
        data: {
          startTime: testStartTime,
          endTime: addMinutes(testStartTime, 60),
          duration: 60,
          artistId: testArtist1.id,
          status: BookingStatus.SCHEDULED,
          type: 'consultation'
        }
      });

      const result = await availabilityService.isTimeSlotAvailable(testStartTime, 60);

      expect(result).toBe(false);

      console.log('✅ Conflict detected - slot unavailable');
    });

    it('should filter by team member ID when provided', async () => {
      console.log('\n👤 Testing time slot availability for specific artist');
      
      const testStartTime = new Date();
      testStartTime.setDate(testStartTime.getDate() + 1);
      testStartTime.setHours(17, 0, 0, 0); // 5 PM tomorrow

      // Create appointment for artist1 
      await testPrisma.appointment.create({
        data: {
          startTime: testStartTime,
          endTime: addMinutes(testStartTime, 60),
          duration: 60,
          artistId: testArtist1.id,
          status: BookingStatus.SCHEDULED,
          type: 'consultation'
        }
      });

      // Should be unavailable for artist1
      const result1 = await availabilityService.isTimeSlotAvailable(testStartTime, 60, testArtist1.id);
      expect(result1).toBe(false);

      // Should be available for artist2 (no conflict)
      const result2 = await availabilityService.isTimeSlotAvailable(testStartTime, 60, testArtist2.id);
      expect(result2).toBe(true);

      console.log('✅ Artist-specific availability working correctly');
    });

    it('should exclude specific appointment when provided', async () => {
      console.log('\n🔄 Testing time slot availability excluding specific appointment');
      
      const testStartTime = new Date();
      testStartTime.setDate(testStartTime.getDate() + 1);
      testStartTime.setHours(18, 0, 0, 0); // 6 PM tomorrow

      // Create appointment to exclude
      const excludeAppointment = await testPrisma.appointment.create({
        data: {
          startTime: testStartTime,
          endTime: addMinutes(testStartTime, 60),
          duration: 60,
          artistId: testArtist1.id,
          status: BookingStatus.SCHEDULED,
          type: 'consultation'
        }
      });

      // Should be available when excluding the appointment
      const result = await availabilityService.isTimeSlotAvailable(
        testStartTime,
        60,
        testArtist1.id,
        excludeAppointment.id
      );

      expect(result).toBe(true);

      console.log('✅ Appointment exclusion working correctly');
    });
  });

  describe('🕒 Business Hours', () => {
    it('should return business hours for valid day of week', () => {
      console.log('\n🕒 Testing business hours for weekdays');
      
      const mondayHours = availabilityService.getBusinessHoursForDay(1); // Monday
      
      expect(mondayHours).toMatchObject({
        dayOfWeek: 1,
        openTime: '09:00',
        closeTime: '17:00',
        isOpen: true
      });

      const fridayHours = availabilityService.getBusinessHoursForDay(5); // Friday
      expect(fridayHours?.isOpen).toBe(true);

      console.log('✅ Weekday business hours working correctly');
    });

    it('should return Sunday as closed', () => {
      console.log('\n🔒 Testing Sunday closure');
      
      const sundayHours = availabilityService.getBusinessHoursForDay(0); // Sunday
      
      expect(sundayHours).toMatchObject({
        dayOfWeek: 0,
        openTime: '00:00',
        closeTime: '00:00',
        isOpen: false
      });

      console.log('✅ Sunday closure working correctly');
    });

    it('should return Saturday with different hours', () => {
      console.log('\n📅 Testing Saturday hours');
      
      const saturdayHours = availabilityService.getBusinessHoursForDay(6); // Saturday
      
      expect(saturdayHours).toMatchObject({
        dayOfWeek: 6,
        openTime: '10:00',
        closeTime: '16:00',
        isOpen: true
      });

      console.log('✅ Saturday hours working correctly');
    });

    it('should return null for invalid day of week', () => {
      console.log('\n❌ Testing invalid day of week');
      
      const invalidDay = availabilityService.getBusinessHoursForDay(8);
      expect(invalidDay).toBeNull();

      const negativeDay = availabilityService.getBusinessHoursForDay(-1);
      expect(negativeDay).toBeNull();

      console.log('✅ Invalid day handling working correctly');
    });
  });

  describe('⚙️ Business Hours Updates', () => {
    it('should update business hours successfully', async () => {
      console.log('\n⚙️ Testing business hours updates');
      
      const newBusinessHours = [
        { dayOfWeek: 1, openTime: '08:00', closeTime: '18:00', isOpen: true },
        { dayOfWeek: 2, openTime: '08:00', closeTime: '18:00', isOpen: true },
        { dayOfWeek: 3, openTime: '08:00', closeTime: '18:00', isOpen: true },
        { dayOfWeek: 4, openTime: '08:00', closeTime: '18:00', isOpen: true },
        { dayOfWeek: 5, openTime: '08:00', closeTime: '18:00', isOpen: true },
        { dayOfWeek: 6, openTime: '09:00', closeTime: '17:00', isOpen: true },
        { dayOfWeek: 0, openTime: '00:00', closeTime: '00:00', isOpen: false }
      ];
      
      await availabilityService.updateBusinessHours(newBusinessHours);
      
      // Verify the update
      const updatedMondayHours = availabilityService.getBusinessHoursForDay(1);
      expect(updatedMondayHours).toMatchObject({
        dayOfWeek: 1,
        openTime: '08:00',
        closeTime: '18:00',
        isOpen: true
      });

      console.log('✅ Business hours update working correctly');
    });

    it('should handle empty business hours array', async () => {
      console.log('\n🔄 Testing empty business hours');
      
      await availabilityService.updateBusinessHours([]);
      
      // All days should return null after clearing
      const mondayHours = availabilityService.getBusinessHoursForDay(1);
      expect(mondayHours).toBeNull();

      console.log('✅ Empty business hours handling working correctly');
    });
  });
}); 
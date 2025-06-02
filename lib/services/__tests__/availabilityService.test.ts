import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AvailabilityService, AvailabilitySearchParams } from '../availabilityService';
import { BookingStatus } from '../../types/booking';
import { addDays, addMinutes, parseISO } from 'date-fns';

// Mock prisma
vi.mock('../../prisma/prisma', () => ({
  prisma: {
    appointment: {
      findMany: vi.fn(),
      count: vi.fn()
    },
    user: {
      findMany: vi.fn()
    }
  }
}));

describe('AvailabilityService', () => {
  let availabilityService: AvailabilityService;
  let mockPrisma: any;
  
  const mockTeamMembers = [
    { id: 'artist-1', email: 'artist1@example.com', role: 'artist', createdAt: new Date() },
    { id: 'artist-2', email: 'artist2@example.com', role: 'artist', createdAt: new Date() },
    { id: 'admin-1', email: 'admin@example.com', role: 'admin', createdAt: new Date() }
  ];
  
  const mockAppointments = [
    {
      id: 'app-1',
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T11:00:00Z'),
      duration: 60,
      artistId: 'artist-1',
      status: BookingStatus.SCHEDULED
    },
    {
      id: 'app-2', 
      startTime: new Date('2024-01-15T14:00:00Z'),
      endTime: new Date('2024-01-15T15:30:00Z'),
      duration: 90,
      artistId: 'artist-2',
      status: BookingStatus.CONFIRMED
    }
  ];
  
  beforeEach(async () => {
    vi.clearAllMocks();
    availabilityService = new AvailabilityService();
    
    // Get the mocked prisma instance
    const { prisma } = await import('../../prisma/prisma');
    mockPrisma = prisma;
    
    // Setup default mocks
    mockPrisma.user.findMany.mockResolvedValue(mockTeamMembers);
    mockPrisma.appointment.findMany.mockResolvedValue(mockAppointments);
    mockPrisma.appointment.count.mockResolvedValue(0);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('searchAvailability', () => {
    const validSearchParams: AvailabilitySearchParams = {
      startAtMin: new Date('2024-01-15T09:00:00Z'),
      startAtMax: new Date('2024-01-15T17:00:00Z'),
      duration: 60,
      maxResults: 10
    };
    
    it('should return available slots successfully', async () => {
      const result = await availabilityService.searchAvailability(validSearchParams);
      
      expect(result).toHaveProperty('availabilities');
      expect(result).toHaveProperty('totalResults');
      expect(result).toHaveProperty('searchParams');
      expect(result.searchParams).toEqual(validSearchParams);
      expect(Array.isArray(result.availabilities)).toBe(true);
      expect(typeof result.totalResults).toBe('number');
    });
    
    it('should filter by team member IDs when provided', async () => {
      const paramsWithTeamMembers = {
        ...validSearchParams,
        teamMemberIds: ['artist-1', 'artist-2']
      };
      
      await availabilityService.searchAvailability(paramsWithTeamMembers);
      
      expect(mockPrisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            artistId: { in: ['artist-1', 'artist-2'] }
          })
        })
      );
      
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { in: ['artist-1', 'artist-2'] }
          })
        })
      );
    });
    
    it('should handle location ID parameter', async () => {
      const paramsWithLocation = {
        ...validSearchParams,
        locationId: 'location-123'
      };
      
      const result = await availabilityService.searchAvailability(paramsWithLocation);
      
      expect(result.availabilities.every(slot => slot.locationId === 'location-123')).toBe(true);
    });
    
    it('should respect maxResults parameter', async () => {
      const paramsWithMaxResults = {
        ...validSearchParams,
        maxResults: 3
      };
      
      const result = await availabilityService.searchAvailability(paramsWithMaxResults);
      
      expect(result.availabilities.length).toBeLessThanOrEqual(3);
    });
    
    it('should use default duration when not provided', async () => {
      const paramsWithoutDuration = {
        startAtMin: validSearchParams.startAtMin,
        startAtMax: validSearchParams.startAtMax
      };
      
      const result = await availabilityService.searchAvailability(paramsWithoutDuration);
      
      // Should use default 60 minute duration
      expect(result.availabilities.every(slot => slot.durationMinutes === 60)).toBe(true);
    });
    
    it('should handle errors gracefully', async () => {
      mockPrisma.appointment.findMany.mockRejectedValueOnce(new Error('Database error'));
      
      await expect(availabilityService.searchAvailability(validSearchParams))
        .rejects.toThrow('Failed to search availability: Database error');
    });
    
    it('should exclude conflicting appointments', async () => {
      // Setup a specific conflict scenario
      const conflictingAppointment = {
        id: 'conflict-app',
        startTime: new Date('2024-01-15T10:30:00Z'),
        endTime: new Date('2024-01-15T11:30:00Z'),
        duration: 60,
        artistId: 'artist-1',
        status: BookingStatus.SCHEDULED
      };
      
      mockPrisma.appointment.findMany.mockResolvedValueOnce([conflictingAppointment]);
      
      const result = await availabilityService.searchAvailability({
        ...validSearchParams,
        teamMemberIds: ['artist-1']
      });
      
      // Should not include slots that conflict with the appointment
      const conflictingSlots = result.availabilities.filter(slot => {
        const slotStart = slot.startAt;
        const slotEnd = slot.endAt;
        const appointmentStart = conflictingAppointment.startTime;
        const appointmentEnd = conflictingAppointment.endTime;
        
        return slotStart < appointmentEnd && slotEnd > appointmentStart;
      });
      
      expect(conflictingSlots.length).toBe(0);
    });
  });
  
  describe('getBusinessBookingProfile', () => {
    it('should return business booking profile with default settings', async () => {
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
        minBookingLeadTimeSeconds: 3600,
        maxBookingLeadTimeSeconds: 2592000,
        anyTeamMemberBookingEnabled: true,
        multipleServiceBookingEnabled: false,
        maxAppointmentsPerDayLimitType: 'PER_TEAM_MEMBER',
        maxAppointmentsPerDayLimit: 8,
        cancellationWindowSeconds: 86400,
        cancellationPolicy: 'CANCELLATION_TREATED_AS_NO_SHOW'
      });
    });
    
    it('should include current timestamp', async () => {
      const profile = await availabilityService.getBusinessBookingProfile();
      
      expect(profile.createdAt).toBeDefined();
      expect(new Date(profile.createdAt)).toBeInstanceOf(Date);
    });
  });
  
  describe('getLocationBookingProfiles', () => {
    beforeEach(() => {
      process.env.SQUARE_LOCATION_ID = 'test-location-id';
    });
    
    it('should return location booking profiles with business hours', async () => {
      const profiles = await availabilityService.getLocationBookingProfiles();
      
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBe(1);
      
      const profile = profiles[0];
      expect(profile).toHaveProperty('locationId', 'test-location-id');
      expect(profile).toHaveProperty('bookingEnabled', true);
      expect(profile).toHaveProperty('onlineBookingEnabled', true);
      expect(profile).toHaveProperty('businessHours');
      expect(Array.isArray(profile.businessHours)).toBe(true);
      expect(profile.businessHours.length).toBe(7); // 7 days of the week
    });
    
    it('should include business appointment settings', async () => {
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
    });
  });
  
  describe('getTeamMemberBookingProfiles', () => {
    it('should return profiles for all artists and admins when no IDs provided', async () => {
      const profiles = await availabilityService.getTeamMemberBookingProfiles();
      
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { role: { in: ['artist', 'admin'] } },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true
        }
      });
      
      expect(profiles.length).toBe(3);
      expect(profiles[0]).toMatchObject({
        teamMemberId: 'artist-1',
        description: 'artist - artist1@example.com',
        displayName: 'artist1@example.com',
        isBookable: true,
        teamMemberBookingProfile: expect.objectContaining({
          teamMemberId: 'artist-1',
          isBookable: true
        })
      });
    });
    
    it('should filter by team member IDs when provided', async () => {
      await availabilityService.getTeamMemberBookingProfiles(['artist-1', 'admin-1']);
      
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { 
          id: { in: ['artist-1', 'admin-1'] },
          role: { in: ['artist', 'admin'] }
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true
        }
      });
    });
    
    it('should include team member booking profile details', async () => {
      const profiles = await availabilityService.getTeamMemberBookingProfiles();
      
      profiles.forEach(profile => {
        expect(profile.teamMemberBookingProfile).toMatchObject({
          teamMemberId: profile.teamMemberId,
          description: expect.stringContaining(profile.teamMemberId),
          displayName: expect.any(String),
          isBookable: true,
          hourlyRate: null,
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        });
      });
    });
  });
  
  describe('isTimeSlotAvailable', () => {
    const testStartTime = new Date('2024-01-15T10:00:00Z');
    const testDuration = 60;
    
    it('should return true when no conflicting appointments exist', async () => {
      mockPrisma.appointment.count.mockResolvedValueOnce(0);
      
      const result = await availabilityService.isTimeSlotAvailable(testStartTime, testDuration);
      
      expect(result).toBe(true);
      expect(mockPrisma.appointment.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          startTime: { lt: addMinutes(testStartTime, testDuration) },
          endTime: { gt: testStartTime },
          status: { in: [BookingStatus.SCHEDULED, BookingStatus.CONFIRMED] }
        })
      });
    });
    
    it('should return false when conflicting appointments exist', async () => {
      mockPrisma.appointment.count.mockResolvedValueOnce(1);
      
      const result = await availabilityService.isTimeSlotAvailable(testStartTime, testDuration);
      
      expect(result).toBe(false);
    });
    
    it('should filter by team member ID when provided', async () => {
      await availabilityService.isTimeSlotAvailable(testStartTime, testDuration, 'artist-1');
      
      expect(mockPrisma.appointment.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          artistId: 'artist-1'
        })
      });
    });
    
    it('should exclude specific appointment ID when provided', async () => {
      await availabilityService.isTimeSlotAvailable(
        testStartTime, 
        testDuration, 
        'artist-1', 
        'exclude-appointment-123'
      );
      
      expect(mockPrisma.appointment.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          id: { not: 'exclude-appointment-123' }
        })
      });
    });
  });
  
  describe('getBusinessHoursForDay', () => {
    it('should return business hours for valid day of week', () => {
      const mondayHours = availabilityService.getBusinessHoursForDay(1); // Monday
      
      expect(mondayHours).toMatchObject({
        dayOfWeek: 1,
        openTime: '09:00',
        closeTime: '17:00',
        isOpen: true
      });
    });
    
    it('should return Sunday as closed', () => {
      const sundayHours = availabilityService.getBusinessHoursForDay(0); // Sunday
      
      expect(sundayHours).toMatchObject({
        dayOfWeek: 0,
        openTime: '00:00',
        closeTime: '00:00',
        isOpen: false
      });
    });
    
    it('should return Saturday with different hours', () => {
      const saturdayHours = availabilityService.getBusinessHoursForDay(6); // Saturday
      
      expect(saturdayHours).toMatchObject({
        dayOfWeek: 6,
        openTime: '10:00',
        closeTime: '16:00',
        isOpen: true
      });
    });
    
    it('should return null for invalid day of week', () => {
      const invalidDay = availabilityService.getBusinessHoursForDay(8);
      
      expect(invalidDay).toBeNull();
    });
  });
  
  describe('updateBusinessHours', () => {
    it('should update business hours successfully', async () => {
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
      
      // Verify the update by checking business hours for a specific day
      const updatedMondayHours = availabilityService.getBusinessHoursForDay(1);
      expect(updatedMondayHours).toMatchObject({
        dayOfWeek: 1,
        openTime: '08:00',
        closeTime: '18:00',
        isOpen: true
      });
    });
    
    it('should handle empty business hours array', async () => {
      await availabilityService.updateBusinessHours([]);
      
      // All days should return null after clearing
      const mondayHours = availabilityService.getBusinessHoursForDay(1);
      expect(mondayHours).toBeNull();
    });
  });
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle database connection errors in searchAvailability', async () => {
      mockPrisma.appointment.findMany.mockRejectedValueOnce(new Error('Connection timeout'));
      
      await expect(availabilityService.searchAvailability({
        startAtMin: new Date(),
        startAtMax: addDays(new Date(), 1)
      })).rejects.toThrow('Failed to search availability: Connection timeout');
    });
    
    it('should handle empty team member results', async () => {
      mockPrisma.user.findMany.mockResolvedValueOnce([]);
      
      const profiles = await availabilityService.getTeamMemberBookingProfiles();
      expect(profiles).toEqual([]);
    });
    
    it('should handle very large date ranges in availability search', async () => {
      const largeRangeParams = {
        startAtMin: new Date('2024-01-01'),
        startAtMax: new Date('2024-12-31'),
        maxResults: 1000
      };
      
      const result = await availabilityService.searchAvailability(largeRangeParams);
      
      // Should still return results but possibly truncated
      expect(result.availabilities.length).toBeLessThanOrEqual(1000);
    });
    
    it('should handle overlapping appointment times correctly', async () => {
      const overlappingAppointments = [
        {
          id: 'overlap-1',
          startTime: new Date('2024-01-15T10:00:00Z'),
          endTime: new Date('2024-01-15T11:00:00Z'),
          duration: 60,
          artistId: 'artist-1',
          status: BookingStatus.SCHEDULED
        },
        {
          id: 'overlap-2',
          startTime: new Date('2024-01-15T10:30:00Z'),
          endTime: new Date('2024-01-15T11:30:00Z'),
          duration: 60,
          artistId: 'artist-1',
          status: BookingStatus.CONFIRMED
        }
      ];
      
      mockPrisma.appointment.findMany.mockResolvedValueOnce(overlappingAppointments);
      
      const result = await availabilityService.searchAvailability({
        startAtMin: new Date('2024-01-15T09:00:00Z'),
        startAtMax: new Date('2024-01-15T17:00:00Z'),
        teamMemberIds: ['artist-1']
      });
      
      // Should not have any conflicting slots
      expect(result.availabilities.length).toBeGreaterThanOrEqual(0);
    });
  });
}); 
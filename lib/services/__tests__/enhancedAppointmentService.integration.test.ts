import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedAppointmentService } from '../enhancedAppointmentService';
import { testPrisma, setupExternalMocks, createTestUser, createTestCustomer } from './testSetup';
import { BookingStatus, BookingType } from '../../types/booking';

// Use shared test setup
setupExternalMocks();

describe('EnhancedAppointmentService (Integration)', () => {
  let enhancedAppointmentService: EnhancedAppointmentService;
  let testAdmin: any;
  let testArtist: any;
  let testCustomer: any;

  beforeEach(async () => {
    console.log('\n📅 Setting up EnhancedAppointmentService integration test');
    
    enhancedAppointmentService = new EnhancedAppointmentService();
    testAdmin = await createTestUser('admin');
    testArtist = await createTestUser('artist');
    testCustomer = await createTestCustomer({
      name: 'Enhanced Test Customer',
      email: 'enhanced@test.com',
      phone: '+1-555-9999'
    });
    
    console.log('✅ EnhancedAppointmentService test setup complete');
  });

  describe('🚀 Enhanced Appointment Creation', () => {
    it('should create appointment with automation triggers', async () => {
      console.log('\n🤖 Testing appointment creation with automation');
      
      const appointmentData = {
        startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 120,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.CONSULTATION,
        note: 'Enhanced appointment with automation',
        priceQuote: 200,
        enableAutomation: true
      };

      const result = await enhancedAppointmentService.createAppointmentWithAutomation(appointmentData);

      expect(result.appointment).toBeDefined();
      expect(result.appointment.id).toBeTruthy();
      expect(result.automationsTriggered).toBeDefined();
      expect(result.automationsTriggered.length).toBeGreaterThanOrEqual(0);

      console.log('✅ Enhanced appointment created with automation');
      console.log(`🤖 Triggered ${result.automationsTriggered.length} automations`);
    });

    it('should detect and prevent appointment conflicts', async () => {
      console.log('\n⚠️ Testing appointment conflict detection');
      
      const baseTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Create first appointment
      await enhancedAppointmentService.createAppointmentWithAutomation({
        startAt: baseTime,
        duration: 120,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.CONSULTATION
      });

      // Try to create conflicting appointment
      const conflictResult = await enhancedAppointmentService.detectConflicts({
        startAt: new Date(baseTime.getTime() + 60 * 60 * 1000), // 1 hour later (overlap)
        duration: 120,
        artistId: testArtist.id
      });

      expect(conflictResult.hasConflicts).toBe(true);
      expect(conflictResult.conflicts.length).toBeGreaterThan(0);
      expect(conflictResult.conflicts[0]).toHaveProperty('type');
      expect(conflictResult.conflicts[0]).toHaveProperty('description');

      console.log('✅ Conflict detection working correctly');
      console.log(`⚠️ Detected ${conflictResult.conflicts.length} conflicts`);
    });

    it('should suggest alternative appointment times', async () => {
      console.log('\n💡 Testing alternative time suggestions');
      
      const baseTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Create blocking appointment
      await enhancedAppointmentService.createAppointmentWithAutomation({
        startAt: baseTime,
        duration: 120,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.CONSULTATION
      });

      // Get alternative suggestions
      const suggestions = await enhancedAppointmentService.suggestAlternativeTimes({
        preferredDate: baseTime,
        duration: 120,
        artistId: testArtist.id,
        timeRange: {
          start: '09:00',
          end: '17:00'
        }
      });

      expect(suggestions.alternatives).toBeDefined();
      expect(Array.isArray(suggestions.alternatives)).toBe(true);
      expect(suggestions.alternatives.length).toBeGreaterThan(0);

      suggestions.alternatives.forEach(alt => {
        expect(alt).toHaveProperty('startTime');
        expect(alt).toHaveProperty('endTime');
        expect(alt).toHaveProperty('availabilityScore');
        expect(alt.startTime).toBeInstanceOf(Date);
      });

      console.log('✅ Alternative time suggestions working');
      console.log(`💡 Found ${suggestions.alternatives.length} alternative times`);
    });
  });

  describe('📊 Appointment Analytics Integration', () => {
    beforeEach(async () => {
      console.log('\n📊 Setting up analytics test data');
      
      // Create multiple appointments for analytics
      const appointments = [
        {
          startAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
          duration: 90,
          customerId: testCustomer.id,
          artistId: testArtist.id,
          bookingType: BookingType.CONSULTATION,
          priceQuote: 150
        },
        {
          startAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          duration: 180,
          customerId: testCustomer.id,
          artistId: testArtist.id,
          bookingType: BookingType.TATTOO_SESSION,
          priceQuote: 600
        }
      ];

      for (const apt of appointments) {
        await enhancedAppointmentService.createAppointmentWithAutomation(apt);
      }
    });

    it('should provide appointment analytics', async () => {
      console.log('\n📈 Testing appointment analytics');
      
      const analytics = await enhancedAppointmentService.getAppointmentAnalytics({
        period: 'month',
        artistId: testArtist.id
      });

      expect(analytics).toBeDefined();
      expect(analytics.totalAppointments).toBeTypeOf('number');
      expect(analytics.completedAppointments).toBeTypeOf('number');
      expect(analytics.totalRevenue).toBeTypeOf('number');
      expect(analytics.averageDuration).toBeTypeOf('number');
      expect(analytics.bookingRate).toBeTypeOf('number');

      expect(analytics.breakdown).toBeDefined();
      expect(analytics.breakdown.byType).toBeDefined();
      expect(analytics.breakdown.byStatus).toBeDefined();
      expect(analytics.breakdown.byTimeSlot).toBeDefined();

      console.log('✅ Appointment analytics working correctly');
      console.log(`📊 ${analytics.totalAppointments} appointments, $${analytics.totalRevenue} revenue`);
    });

    it('should provide utilization metrics', async () => {
      console.log('\n⚡ Testing utilization metrics');
      
      const utilization = await enhancedAppointmentService.getUtilizationMetrics({
        artistId: testArtist.id,
        period: 'week'
      });

      expect(utilization).toBeDefined();
      expect(utilization.utilizationRate).toBeTypeOf('number');
      expect(utilization.totalAvailableHours).toBeTypeOf('number');
      expect(utilization.totalBookedHours).toBeTypeOf('number');
      expect(utilization.efficiency).toBeTypeOf('number');

      expect(utilization.utilizationRate).toBeGreaterThanOrEqual(0);
      expect(utilization.utilizationRate).toBeLessThanOrEqual(100);

      console.log('✅ Utilization metrics working correctly');
      console.log(`⚡ Utilization: ${utilization.utilizationRate}%, Efficiency: ${utilization.efficiency}%`);
    });
  });

  describe('📋 Bulk Operations', () => {
    it('should handle bulk appointment updates', async () => {
      console.log('\n📋 Testing bulk appointment updates');
      
      // Create multiple appointments
      const appointments = [];
      for (let i = 0; i < 3; i++) {
        const apt = await enhancedAppointmentService.createAppointmentWithAutomation({
          startAt: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          duration: 120,
          customerId: testCustomer.id,
          artistId: testArtist.id,
          bookingType: BookingType.CONSULTATION,
          note: `Bulk test appointment ${i + 1}`
        });
        appointments.push(apt.appointment);
      }

      const appointmentIds = appointments.map(a => a.id);
      const updates = {
        status: BookingStatus.CONFIRMED,
        note: 'Bulk updated via enhanced service'
      };

      const result = await enhancedAppointmentService.bulkUpdateAppointments(appointmentIds, updates);

      expect(result.success).toBe(true);
      expect(result.updated).toBe(appointmentIds.length);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(appointmentIds.length);

      console.log('✅ Bulk updates working correctly');
      console.log(`📋 Updated ${result.updated} appointments successfully`);
    });

    it('should handle bulk appointment cancellations', async () => {
      console.log('\n❌ Testing bulk appointment cancellations');
      
      // Create appointments to cancel
      const appointments = [];
      for (let i = 0; i < 2; i++) {
        const apt = await enhancedAppointmentService.createAppointmentWithAutomation({
          startAt: new Date(Date.now() + (i + 5) * 24 * 60 * 60 * 1000),
          duration: 90,
          customerId: testCustomer.id,
          artistId: testArtist.id,
          bookingType: BookingType.CONSULTATION
        });
        appointments.push(apt.appointment);
      }

      const appointmentIds = appointments.map(a => a.id);
      const reason = 'Bulk cancellation for testing';

      const result = await enhancedAppointmentService.bulkCancelAppointments(
        appointmentIds,
        reason,
        testAdmin.id
      );

      expect(result.success).toBe(true);
      expect(result.cancelled).toBe(appointmentIds.length);
      expect(result.failed).toBe(0);

      console.log('✅ Bulk cancellations working correctly');
      console.log(`❌ Cancelled ${result.cancelled} appointments`);
    });
  });

  describe('🔄 Appointment Automation', () => {
    it('should automatically send confirmations', async () => {
      console.log('\n📧 Testing automatic confirmation sending');
      
      const appointment = await enhancedAppointmentService.createAppointmentWithAutomation({
        startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 120,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.CONSULTATION,
        enableAutomation: true,
        automationSettings: {
          sendConfirmation: true,
          sendReminders: true
        }
      });

      expect(appointment.automationsTriggered).toContain('confirmation_sent');

      console.log('✅ Automatic confirmations working');
    });

    it('should schedule automatic reminders', async () => {
      console.log('\n⏰ Testing automatic reminder scheduling');
      
      const appointment = await enhancedAppointmentService.createAppointmentWithAutomation({
        startAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days from now
        duration: 120,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.TATTOO_SESSION,
        enableAutomation: true,
        automationSettings: {
          sendReminders: true,
          reminderSettings: {
            dayBefore: true,
            hourBefore: true
          }
        }
      });

      expect(appointment.automationsTriggered).toContain('reminders_scheduled');

      const reminders = await enhancedAppointmentService.getScheduledReminders(appointment.appointment.id);
      expect(reminders.length).toBeGreaterThan(0);

      console.log('✅ Automatic reminders scheduled');
      console.log(`⏰ ${reminders.length} reminders scheduled`);
    });
  });

  describe('🔍 Advanced Search and Filtering', () => {
    beforeEach(async () => {
      console.log('\n🔍 Setting up advanced search test data');
      
      // Create diverse appointments for searching
      const testData = [
        {
          startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          duration: 90,
          customerId: testCustomer.id,
          artistId: testArtist.id,
          bookingType: BookingType.CONSULTATION,
          note: 'First consultation for sleeve design',
          priceQuote: 150,
          status: BookingStatus.SCHEDULED
        },
        {
          startAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
          duration: 240,
          customerId: testCustomer.id,
          artistId: testArtist.id,
          bookingType: BookingType.TATTOO_SESSION,
          note: 'Main tattoo session for sleeve',
          priceQuote: 800,
          status: BookingStatus.CONFIRMED
        }
      ];

      for (const data of testData) {
        await enhancedAppointmentService.createAppointmentWithAutomation(data);
      }
    });

    it('should search appointments with advanced filters', async () => {
      console.log('\n🔍 Testing advanced appointment search');
      
      const searchResult = await enhancedAppointmentService.searchAppointments({
        query: 'sleeve',
        filters: {
          dateRange: {
            start: new Date(Date.now()),
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          },
          artistId: testArtist.id,
          minAmount: 100,
          status: [BookingStatus.SCHEDULED, BookingStatus.CONFIRMED]
        },
        sortBy: 'startTime',
        sortOrder: 'asc'
      });

      expect(searchResult.appointments).toBeDefined();
      expect(Array.isArray(searchResult.appointments)).toBe(true);
      expect(searchResult.total).toBeGreaterThan(0);
      expect(searchResult.filters).toBeDefined();

      console.log('✅ Advanced search working correctly');
      console.log(`🔍 Found ${searchResult.total} appointments matching criteria`);
    });

    it('should provide appointment insights', async () => {
      console.log('\n💡 Testing appointment insights');
      
      const insights = await enhancedAppointmentService.getAppointmentInsights({
        customerId: testCustomer.id,
        period: 'month'
      });

      expect(insights).toBeDefined();
      expect(insights.customerProfile).toBeDefined();
      expect(insights.appointmentHistory).toBeDefined();
      expect(insights.preferences).toBeDefined();
      expect(insights.recommendations).toBeDefined();

      expect(insights.customerProfile.totalAppointments).toBeTypeOf('number');
      expect(insights.customerProfile.totalSpent).toBeTypeOf('number');
      expect(insights.customerProfile.averageSessionDuration).toBeTypeOf('number');

      console.log('✅ Appointment insights working correctly');
      console.log(`💡 Customer has ${insights.customerProfile.totalAppointments} appointments`);
    });
  });

  describe('⚡ Performance and Edge Cases', () => {
    it('should handle high-volume appointment creation', async () => {
      console.log('\n⚡ Testing high-volume appointment handling');
      
      const startTime = Date.now();
      const promises = [];
      
      // Create multiple appointments concurrently
      for (let i = 0; i < 10; i++) {
        promises.push(
          enhancedAppointmentService.createAppointmentWithAutomation({
            startAt: new Date(Date.now() + (i + 10) * 24 * 60 * 60 * 1000),
            duration: 120,
            customerId: testCustomer.id,
            artistId: testArtist.id,
            bookingType: BookingType.CONSULTATION,
            note: `Volume test appointment ${i + 1}`
          })
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.appointment).toBeDefined();
        expect(result.appointment.id).toBeTruthy();
      });

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(10000); // Should complete in under 10 seconds

      console.log('✅ High-volume creation handled efficiently');
      console.log(`⚡ Created 10 appointments in ${executionTime}ms`);
    });

    it('should validate enhanced appointment data', async () => {
      console.log('\n🔍 Testing enhanced data validation');
      
      // Test invalid automation settings
      await expect(
        enhancedAppointmentService.createAppointmentWithAutomation({
          startAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Past date
          duration: 120,
          customerId: testCustomer.id,
          artistId: testArtist.id,
          bookingType: BookingType.CONSULTATION
        })
      ).rejects.toThrow();

      // Test invalid bulk operation
      await expect(
        enhancedAppointmentService.bulkUpdateAppointments([], {})
      ).rejects.toThrow();

      console.log('✅ Enhanced data validation working correctly');
    });

    it('should complete enhanced operations within reasonable time', async () => {
      console.log('\n⏱️ Testing enhanced service performance');
      
      const startTime = Date.now();
      
      await enhancedAppointmentService.createAppointmentWithAutomation({
        startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 120,
        customerId: testCustomer.id,
        artistId: testArtist.id,
        bookingType: BookingType.CONSULTATION,
        enableAutomation: true
      });
      
      await enhancedAppointmentService.getAppointmentAnalytics({
        period: 'week'
      });
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      expect(executionTime).toBeLessThan(5000); // Should complete in under 5 seconds

      console.log(`✅ Enhanced operations completed in ${executionTime}ms`);
    });
  });
}); 
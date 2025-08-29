import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { AnalyticsService } from '../analyticsService';
import { testPrisma, setupExternalMocks, createTestUser, createTestCustomer } from './testSetup';
import { BookingStatus, BookingType } from '../../types/booking';

// Use shared test setup
setupExternalMocks();

describe('AnalyticsService (Integration)', () => {
  let analyticsService: AnalyticsService;
  let testAdmin: any;
  let testArtist: any;
  let testCustomers: any[];

  beforeEach(async () => {
    console.log('\n📊 Setting up AnalyticsService integration test');
    
    // Initialize REAL service (no mocks)
    analyticsService = new AnalyticsService();
    
    // Create test users
    testAdmin = await createTestUser('admin');
    testArtist = await createTestUser('artist');
    
    // Create diverse test customers with realistic data
    testCustomers = await Promise.all([
      createTestCustomer({ 
        name: 'Alice Johnson', 
        email: 'alice@test.com',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      }),
      createTestCustomer({ 
        name: 'Bob Smith', 
        email: 'bob@test.com',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
      }),
      createTestCustomer({ 
        name: 'Carol Davis', 
        email: 'carol@test.com',
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
      })
    ]);

    // Create realistic test data for analytics
    await createTestAnalyticsData();
    
    console.log(`✅ Created ${testCustomers.length} test customers and analytics data`);
  });

  describe('📈 Dashboard Metrics', () => {
    it('should generate comprehensive dashboard metrics', async () => {
      console.log('\n📊 Testing dashboard metrics generation');
      
      const metrics = await analyticsService.getDashboardMetrics('current');

      // Validate structure
      expect(metrics).toBeDefined();
      expect(metrics.revenue).toBeDefined();
      expect(metrics.appointments).toBeDefined();
      expect(metrics.customers).toBeDefined();
      expect(metrics.requests).toBeDefined();
      expect(metrics.business).toBeDefined();

      // Validate revenue metrics
      expect(metrics.revenue.today).toHaveProperty('amount');
      expect(metrics.revenue.today).toHaveProperty('trend');
      expect(metrics.revenue.today).toHaveProperty('currency');
      expect(metrics.revenue.today.currency).toBe('USD');

      expect(metrics.revenue.week).toHaveProperty('amount');
      expect(metrics.revenue.week).toHaveProperty('trend');
      expect(metrics.revenue.week).toHaveProperty('target');

      expect(metrics.revenue.breakdown).toHaveProperty('consultations');
      expect(metrics.revenue.breakdown).toHaveProperty('tattoos');
      expect(metrics.revenue.breakdown).toHaveProperty('touchups');
      expect(metrics.revenue.breakdown).toHaveProperty('deposits');

      // Validate appointment metrics
      expect(metrics.appointments.today).toHaveProperty('count');
      expect(metrics.appointments.today).toHaveProperty('completed');
      expect(metrics.appointments.today).toHaveProperty('remaining');

      expect(metrics.appointments.metrics).toHaveProperty('averageDuration');
      expect(metrics.appointments.metrics).toHaveProperty('conversionRate');
      expect(metrics.appointments.metrics).toHaveProperty('noShowRate');

      // Validate customer metrics
      expect(metrics.customers.total).toBeTypeOf('number');
      expect(metrics.customers.new).toHaveProperty('today');
      expect(metrics.customers.new).toHaveProperty('week');
      expect(metrics.customers.new).toHaveProperty('month');

      expect(metrics.customers.segments).toHaveProperty('newCustomers');
      expect(metrics.customers.segments).toHaveProperty('regularCustomers');
      expect(metrics.customers.segments).toHaveProperty('vipCustomers');

      // Validate business metrics
      expect(metrics.business.efficiency).toHaveProperty('bookingUtilization');
      expect(metrics.business.efficiency).toHaveProperty('revenuePerHour');
      expect(metrics.business.efficiency).toHaveProperty('customerSatisfaction');

      expect(metrics.business.growth).toHaveProperty('customerGrowthRate');
      expect(metrics.business.growth).toHaveProperty('revenueGrowthRate');
      expect(metrics.business.growth).toHaveProperty('appointmentGrowthRate');

      console.log('✅ Dashboard metrics structure validated');
      console.log(`📊 Total customers: ${metrics.customers.total}`);
      console.log(`💰 Weekly revenue: $${metrics.revenue.week.amount}`);
    });

    it('should calculate real metrics from test data', async () => {
      console.log('\n🧮 Testing real metric calculations');
      
      const metrics = await analyticsService.getDashboardMetrics();

      // Should reflect our test data
      expect(metrics.customers.total).toBe(testCustomers.length);
      expect(metrics.customers.new.month).toBeGreaterThan(0); // We created customers in the last month
      expect(metrics.revenue.week.amount).toBeGreaterThanOrEqual(0);
      expect(metrics.appointments.today.count).toBeGreaterThanOrEqual(0);

      console.log('✅ Metrics accurately reflect test data');
    });
  });

  describe('💰 Revenue Analytics', () => {
    it('should provide detailed revenue breakdown', async () => {
      console.log('\n💰 Testing revenue breakdown analysis');
      
      const breakdown = await analyticsService.getRevenueBreakdown('month');

      expect(breakdown).toBeDefined();
      expect(breakdown.totalRevenue).toBeTypeOf('number');
      expect(breakdown.period).toBe('month');

      expect(breakdown.breakdown).toHaveProperty('byPaymentType');
      expect(breakdown.breakdown).toHaveProperty('byService');
      expect(breakdown.breakdown).toHaveProperty('byMonth');
      expect(breakdown.breakdown).toHaveProperty('byCustomerSegment');

      expect(breakdown.trends).toHaveProperty('growthRate');
      expect(breakdown.trends).toHaveProperty('averageTransactionValue');
      expect(breakdown.trends).toHaveProperty('transactionCount');

      console.log('✅ Revenue breakdown structure validated');
      console.log(`📈 Total revenue: $${breakdown.totalRevenue}`);
      console.log(`📊 Growth rate: ${breakdown.trends.growthRate}%`);
    });

    it('should handle different time periods', async () => {
      console.log('\n📅 Testing different time period analytics');
      
      const weekBreakdown = await analyticsService.getRevenueBreakdown('week');
      const monthBreakdown = await analyticsService.getRevenueBreakdown('month');
      const quarterBreakdown = await analyticsService.getRevenueBreakdown('quarter');

      expect(weekBreakdown.period).toBe('week');
      expect(monthBreakdown.period).toBe('month');
      expect(quarterBreakdown.period).toBe('quarter');

      // Quarter should generally have higher revenue than month than week
      expect(quarterBreakdown.totalRevenue).toBeGreaterThanOrEqual(monthBreakdown.totalRevenue);

      console.log('✅ Multiple time periods working correctly');
    });
  });

  describe('👥 Customer Segmentation', () => {
    it('should segment customers correctly', async () => {
      console.log('\n👥 Testing customer segmentation');
      
      const segments = await analyticsService.getCustomerSegments();

      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBeGreaterThan(0);

      // Should have the three main segments
      const segmentIds = segments.map(s => s.id);
      expect(segmentIds).toContain('new');
      expect(segmentIds).toContain('regular');
      expect(segmentIds).toContain('vip');

      // Validate segment structure
      segments.forEach(segment => {
        expect(segment).toHaveProperty('id');
        expect(segment).toHaveProperty('name');
        expect(segment).toHaveProperty('count');
        expect(segment).toHaveProperty('totalRevenue');
        expect(segment).toHaveProperty('averageValue');
        expect(segment).toHaveProperty('criteria');

        expect(segment.count).toBeTypeOf('number');
        expect(segment.totalRevenue).toBeTypeOf('number');
        expect(segment.averageValue).toBeTypeOf('number');
      });

      console.log('✅ Customer segmentation working correctly');
      segments.forEach(segment => {
        console.log(`   • ${segment.name}: ${segment.count} customers, $${segment.totalRevenue} revenue`);
      });
    });

    it('should calculate accurate segment metrics', async () => {
      console.log('\n📊 Testing segment metric accuracy');
      
      const segments = await analyticsService.getCustomerSegments();
      const totalSegmentCount = segments.reduce((sum, segment) => sum + segment.count, 0);
      
      // Total segment count should equal total customers
      expect(totalSegmentCount).toBe(testCustomers.length);

      // New customers should have minimal revenue since they're recently created
      const newSegment = segments.find(s => s.id === 'new');
      expect(newSegment).toBeDefined();
      expect(newSegment!.count).toBeGreaterThan(0);

      console.log('✅ Segment metrics are accurate');
    });
  });

  describe('📈 Business Trends', () => {
    it('should generate business trends over time', async () => {
      console.log('\n📈 Testing business trends analysis');
      
      const trends = await analyticsService.getBusinessTrends('month');

      expect(trends).toBeDefined();
      expect(trends.period).toBe('month');
      expect(Array.isArray(trends.revenue)).toBe(true);
      expect(Array.isArray(trends.appointments)).toBe(true);
      expect(Array.isArray(trends.customers)).toBe(true);
      expect(Array.isArray(trends.conversion)).toBe(true);

      // Validate data point structure
      if (trends.revenue.length > 0) {
        trends.revenue.forEach(point => {
          expect(point).toHaveProperty('date');
          expect(point).toHaveProperty('amount');
          expect(point.amount).toBeTypeOf('number');
        });
      }

      if (trends.customers.length > 0) {
        trends.customers.forEach(point => {
          expect(point).toHaveProperty('date');
          expect(point).toHaveProperty('new');
          expect(point).toHaveProperty('returning');
          expect(point.new).toBeTypeOf('number');
          expect(point.returning).toBeTypeOf('number');
        });
      }

      console.log('✅ Business trends structure validated');
      console.log(`📊 Trend data points: ${trends.revenue.length} revenue, ${trends.customers.length} customers`);
    });
  });

  describe('🔮 Predictive Analytics', () => {
    it('should generate predictive metrics', async () => {
      console.log('\n🔮 Testing predictive analytics');
      
      const predictions = await analyticsService.getPredictiveMetrics();

      expect(predictions).toBeDefined();
      expect(predictions.revenueForcast).toHaveProperty('nextMonth');
      expect(predictions.revenueForcast).toHaveProperty('confidence');
      expect(predictions.revenueForcast).toHaveProperty('factors');

      expect(predictions.customerGrowth).toHaveProperty('expectedNew');
      expect(predictions.customerGrowth).toHaveProperty('expectedChurn');
      expect(predictions.customerGrowth).toHaveProperty('netGrowth');

      expect(predictions.capacity).toHaveProperty('utilizationTrend');
      expect(predictions.capacity).toHaveProperty('recommendedBookings');
      expect(predictions.capacity).toHaveProperty('peakHours');

      // Validate numeric values
      expect(predictions.revenueForcast.nextMonth).toBeTypeOf('number');
      expect(predictions.revenueForcast.confidence).toBeGreaterThanOrEqual(0);
      expect(predictions.revenueForcast.confidence).toBeLessThanOrEqual(100);

      expect(predictions.customerGrowth.expectedNew).toBeTypeOf('number');
      expect(predictions.customerGrowth.expectedChurn).toBeTypeOf('number');

      expect(Array.isArray(predictions.revenueForcast.factors)).toBe(true);
      expect(Array.isArray(predictions.capacity.peakHours)).toBe(true);

      console.log('✅ Predictive analytics working correctly');
      console.log(`🔮 Next month forecast: $${predictions.revenueForcast.nextMonth} (${predictions.revenueForcast.confidence}% confidence)`);
      console.log(`👥 Expected new customers: ${predictions.customerGrowth.expectedNew}`);
    });

    it('should provide reasonable predictions', async () => {
      console.log('\n🎯 Testing prediction reasonableness');
      
      const predictions = await analyticsService.getPredictiveMetrics();

      // Confidence should be reasonable (not 0 or 100)
      expect(predictions.revenueForcast.confidence).toBeGreaterThan(40);
      expect(predictions.revenueForcast.confidence).toBeLessThan(95);

      // Revenue forecast should be positive
      expect(predictions.revenueForcast.nextMonth).toBeGreaterThanOrEqual(0);

      // Customer growth should be reasonable
      expect(predictions.customerGrowth.expectedNew).toBeGreaterThanOrEqual(0);
      expect(predictions.customerGrowth.expectedChurn).toBeGreaterThanOrEqual(0);

      console.log('✅ Predictions are within reasonable bounds');
    });
  });

  describe('⚡ Performance and Edge Cases', () => {
    it('should handle empty data gracefully', async () => {
      console.log('\n🗑️ Testing empty data handling');
      
      // Clean all data
      await testPrisma.payment.deleteMany();
      await testPrisma.appointment.deleteMany();
      await testPrisma.tattooRequest.deleteMany();
      await testPrisma.customer.deleteMany();

      const metrics = await analyticsService.getDashboardMetrics();

      expect(metrics.customers.total).toBe(0);
      expect(metrics.revenue.today.amount).toBe(0);
      expect(metrics.appointments.today.count).toBe(0);

      console.log('✅ Empty data handled gracefully');
    });

    it('should complete analytics within reasonable time', async () => {
      console.log('\n⏱️ Testing analytics performance');
      
      const startTime = Date.now();
      await analyticsService.getDashboardMetrics();
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(5000); // Should complete in under 5 seconds

      console.log(`✅ Analytics completed in ${executionTime}ms`);
    });
  });

  // Helper function to create realistic test data
  async function createTestAnalyticsData() {
    const now = new Date();
    
    // Create appointments across different time periods
    const appointments = [
      {
        customerId: testCustomers[0].id,
        artistId: testArtist?.id || null,
        startTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // Yesterday
        endTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours
        duration: 120,
        status: BookingStatus.COMPLETED,
        type: BookingType.CONSULTATION,
        priceQuote: 150
      },
      {
        customerId: testCustomers[1].id,
        artistId: testArtist?.id || null,
        startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Last week
        endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours
        duration: 180,
        status: BookingStatus.COMPLETED,
        type: BookingType.TATTOO_SESSION,
        priceQuote: 500
      },
      {
        customerId: testCustomers[2].id,
        startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
        endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours
        duration: 120,
        status: BookingStatus.SCHEDULED,
        type: BookingType.CONSULTATION,
        priceQuote: 200
      }
    ];

    for (const aptData of appointments) {
      await testPrisma.appointment.create({ data: aptData });
    }

    // Create payments
    const payments = [
      {
        customerId: testCustomers[0].id,
        amount: 150,
        status: 'completed',
        paymentType: 'consultation',
        paymentMethod: 'card',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) // Yesterday
      },
      {
        customerId: testCustomers[1].id,
        amount: 250,
        status: 'completed',
        paymentType: 'tattoo_deposit',
        paymentMethod: 'card',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last week
      },
      {
        customerId: testCustomers[1].id,
        amount: 250,
        status: 'completed',
        paymentType: 'tattoo_final',
        paymentMethod: 'card',
        createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      }
    ];

    for (const paymentData of payments) {
      await testPrisma.payment.create({ data: paymentData });
    }

    // Create tattoo requests
    const requests = [
      {
        customerId: testCustomers[0].id,
        description: 'Small flower tattoo',
        contactEmail: testCustomers[0].email,
        placement: 'Wrist',
        size: 'Small',
        status: 'approved',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        description: 'Large back piece',
        contactEmail: 'anonymous@test.com',
        contactPhone: '+1234567890',
        placement: 'Back',
        size: 'Large',
        status: 'new',
        trackingToken: 'test-track-123',
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];

    for (const requestData of requests) {
      await testPrisma.tattooRequest.create({ data: requestData });
    }
  }
}); 
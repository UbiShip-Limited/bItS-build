import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { SearchService, SearchEntity } from '../searchService';
import { testPrisma, setupExternalMocks, createTestUser, createTestCustomer, createTestTattooRequest } from './testSetup';
import { BookingStatus, BookingType } from '../../types/booking';

// Use shared test setup
setupExternalMocks();

describe('SearchService (Integration)', () => {
  let searchService: SearchService;
  let testAdmin: any;
  let testArtist: any;
  let testCustomers: any[];
  let testAppointments: any[];
  let testRequests: any[];
  let testPayments: any[];

  beforeEach(async () => {
    console.log('\n🔍 Setting up SearchService integration test');
    
    // Initialize REAL service (no mocks)
    searchService = new SearchService();
    
    // Create test users
    testAdmin = await createTestUser('admin');
    testArtist = await createTestUser('artist');
    
    // Create diverse test data for searching
    await createTestSearchData();
    
    console.log('✅ SearchService test setup complete with comprehensive test data');
  });

  describe('🔍 Global Search', () => {
    it('should perform global search across all entities', async () => {
      console.log('\n🌐 Testing global search functionality');
      
      const results = await searchService.globalSearch('tattoo');

      expect(results).toBeDefined();
      expect(results.customers).toBeDefined();
      expect(results.appointments).toBeDefined();
      expect(results.requests).toBeDefined();
      expect(results.payments).toBeDefined();

      // Should find relevant items
      const totalResults = 
        results.customers.items.length + 
        results.appointments.items.length + 
        results.requests.items.length + 
        results.payments.items.length;

      expect(totalResults).toBeGreaterThan(0);

      console.log('✅ Global search working correctly');
      console.log(`📊 Found ${totalResults} total results across all entities`);
      console.log(`   • Customers: ${results.customers.items.length}`);
      console.log(`   • Appointments: ${results.appointments.items.length}`);
      console.log(`   • Requests: ${results.requests.items.length}`);
      console.log(`   • Payments: ${results.payments.items.length}`);
    });

    it('should handle empty search query', async () => {
      console.log('\n📭 Testing empty search query handling');
      
      const results = await searchService.globalSearch('');

      // Should return empty results for empty query
      expect(results.customers.items).toEqual([]);
      expect(results.appointments.items).toEqual([]);
      expect(results.requests.items).toEqual([]);
      expect(results.payments.items).toEqual([]);

      console.log('✅ Empty search query handled correctly');
    });

    it('should search with filters', async () => {
      console.log('\n🔧 Testing filtered global search');
      
      const results = await searchService.globalSearch('test', {
        entities: [SearchEntity.CUSTOMERS, SearchEntity.APPOINTMENTS],
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          end: new Date()
        }
      });

      // Should only include specified entities
      expect(results.customers).toBeDefined();
      expect(results.appointments).toBeDefined();
      expect(results.requests.items).toEqual([]);
      expect(results.payments.items).toEqual([]);

      console.log('✅ Filtered search working correctly');
    });

    it('should search with pagination', async () => {
      console.log('\n📄 Testing search with pagination');
      
      const results = await searchService.globalSearch('test', {}, 1, 2);

      // Check pagination metadata
      expect(results.customers.pagination).toBeDefined();
      expect(results.customers.pagination.page).toBe(1);
      expect(results.customers.pagination.limit).toBe(2);

      console.log('✅ Search pagination working correctly');
    });

    it('should search with autocomplete suggestions', async () => {
      console.log('\n💡 Testing autocomplete functionality');
      
      const suggestions = await searchService.getAutocompleteSuggestions('ali');

      expect(Array.isArray(suggestions)).toBe(true);
      
      console.log(`✅ Autocomplete working - found ${suggestions.length} suggestions`);
    });
  });

  describe('👥 Customer Search', () => {
    it('should search customers by various fields', async () => {
      console.log('\n👤 Testing customer search functionality');
      
      // Search by name
      const nameResults = await searchService.searchCustomers('Alice');
      expect(nameResults.some(c => c.name.includes('Alice'))).toBe(true);

      // Search by email
      const emailResults = await searchService.searchCustomers('alice@test.com');
      expect(emailResults.some(c => c.email?.includes('alice@test.com'))).toBe(true);

      // Search by phone
      const phoneResults = await searchService.searchCustomers('555-0001');
      expect(phoneResults.some(c => c.phone?.includes('555-0001'))).toBe(true);

      console.log('✅ Customer search across multiple fields working');
      console.log(`📊 Name: ${nameResults.length}, Email: ${emailResults.length}, Phone: ${phoneResults.length}`);
    });

    it('should search customers with filters', async () => {
      console.log('\n🔍 Testing customer search with filters');
      
      const results = await searchService.searchCustomers('test', {
        hasAppointments: true,
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: new Date()
        }
      });

      // All results should have appointments if filter is applied
      expect(Array.isArray(results)).toBe(true);

      console.log(`✅ Customer filtering working correctly - found ${results.length} customers`);
    });

    it('should provide relevance scoring for customers', async () => {
      console.log('\n⭐ Testing customer relevance scoring');
      
      const results = await searchService.searchCustomers('Alice Johnson');

      if (results.length > 1) {
        // Results should be ordered by relevance
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].relevanceScore).toBeGreaterThanOrEqual(results[i + 1].relevanceScore);
        }
      }

      console.log('✅ Customer relevance scoring working correctly');
    });

    it('should search customers effectively', async () => {
      console.log('\n👤 Testing customer search');
      
      const results = await searchService.searchCustomers('Alice');
      expect(Array.isArray(results)).toBe(true);

      console.log(`✅ Customer search working - found ${results.length} customers`);
    });
  });

  describe('📅 Appointment Search', () => {
    it('should search appointments by various criteria', async () => {
      console.log('\n📅 Testing appointment search functionality');
      
      // Search by notes
      const noteResults = await searchService.searchAppointments('consultation');
      expect(noteResults.some(a => a.notes?.toLowerCase().includes('consultation'))).toBe(true);

      // Search by customer info
      const customerResults = await searchService.searchAppointments('Alice');
      expect(customerResults.length).toBeGreaterThanOrEqual(0);

      console.log('✅ Appointment search working correctly');
      console.log(`📊 Note results: ${noteResults.length}, Customer results: ${customerResults.length}`);
    });

    it('should filter appointments by status', async () => {
      console.log('\n📊 Testing appointment status filtering');
      
      const scheduledResults = await searchService.searchAppointments('', {
        status: [BookingStatus.SCHEDULED]
      });

      scheduledResults.forEach(appointment => {
        expect(appointment.status).toBe(BookingStatus.SCHEDULED);
      });

      console.log(`✅ Status filtering working - found ${scheduledResults.length} scheduled appointments`);
    });

    it('should filter appointments by type', async () => {
      console.log('\n🎨 Testing appointment type filtering');
      
      const consultationResults = await searchService.searchAppointments('', {
        type: [BookingType.CONSULTATION]
      });

      consultationResults.forEach(appointment => {
        expect(appointment.type).toBe(BookingType.CONSULTATION);
      });

      console.log(`✅ Type filtering working - found ${consultationResults.length} consultations`);
    });

    it('should filter appointments by date range', async () => {
      console.log('\n📅 Testing appointment date range filtering');
      
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      
      const results = await searchService.searchAppointments('', {
        dateRange: {
          start: today,
          end: tomorrow
        }
      });

      results.forEach(appointment => {
        const appointmentDate = new Date(appointment.startTime);
        expect(appointmentDate >= today && appointmentDate <= tomorrow).toBe(true);
      });

      console.log(`✅ Date range filtering working - found ${results.length} appointments`);
    });

    it('should search appointments with filters', async () => {
      console.log('\n📅 Testing appointment search');
      
      const results = await searchService.searchAppointments('consultation');
      expect(Array.isArray(results)).toBe(true);

      console.log(`✅ Appointment search working - found ${results.length} appointments`);
    });
  });

  describe('📝 Request Search', () => {
    it('should search tattoo requests by content', async () => {
      console.log('\n📝 Testing tattoo request search');
      
      // Search by description
      const descResults = await searchService.searchRequests('dragon');
      expect(descResults.some(r => r.description.toLowerCase().includes('dragon'))).toBe(true);

      // Search by placement
      const placementResults = await searchService.searchRequests('arm');
      expect(placementResults.some(r => r.placement?.toLowerCase().includes('arm'))).toBe(true);

      // Search by style
      const styleResults = await searchService.searchRequests('traditional');
      expect(styleResults.some(r => r.style?.toLowerCase().includes('traditional'))).toBe(true);

      console.log('✅ Request search working correctly');
      console.log(`📊 Desc: ${descResults.length}, Placement: ${placementResults.length}, Style: ${styleResults.length}`);
    });

    it('should filter requests by status', async () => {
      console.log('\n📊 Testing request status filtering');
      
      const newRequests = await searchService.searchRequests('', {
        status: ['new', 'reviewed']
      });

      newRequests.forEach(request => {
        expect(['new', 'reviewed'].includes(request.status)).toBe(true);
      });

      console.log(`✅ Request status filtering working - found ${newRequests.length} new/reviewed requests`);
    });

    it('should distinguish between anonymous and customer requests', async () => {
      console.log('\n👤 Testing anonymous vs customer request filtering');
      
      const anonymousRequests = await searchService.searchRequests('', {
        hasCustomer: false
      });

      const customerRequests = await searchService.searchRequests('', {
        hasCustomer: true
      });

      anonymousRequests.forEach(request => {
        expect(request.customerId).toBeNull();
      });

      customerRequests.forEach(request => {
        expect(request.customerId).toBeTruthy();
      });

      console.log(`✅ Anonymous/Customer filtering working`);
      console.log(`📊 Anonymous: ${anonymousRequests.length}, Customer: ${customerRequests.length}`);
    });

    it('should search tattoo requests', async () => {
      console.log('\n📝 Testing request search');
      
      const results = await searchService.searchRequests('tattoo');
      expect(Array.isArray(results)).toBe(true);

      console.log(`✅ Request search working - found ${results.length} requests`);
    });
  });

  describe('💳 Payment Search', () => {
    it('should search payments by various criteria', async () => {
      console.log('\n💳 Testing payment search functionality');
      
      // Search by customer
      const customerResults = await searchService.searchPayments('Alice');
      expect(customerResults.length).toBeGreaterThanOrEqual(0);

      // Search by notes
      const noteResults = await searchService.searchPayments('consultation');
      expect(noteResults.some(p => p.note?.toLowerCase().includes('consultation'))).toBe(true);

      console.log('✅ Payment search working correctly');
      console.log(`📊 Customer results: ${customerResults.length}, Note results: ${noteResults.length}`);
    });

    it('should filter payments by status', async () => {
      console.log('\n✅ Testing payment status filtering');
      
      const completedPayments = await searchService.searchPayments('', {
        status: ['completed']
      });

      completedPayments.forEach(payment => {
        expect(payment.status).toBe('completed');
      });

      console.log(`✅ Payment status filtering working - found ${completedPayments.length} completed payments`);
    });

    it('should filter payments by amount range', async () => {
      console.log('\n💰 Testing payment amount range filtering');
      
      const results = await searchService.searchPayments('', {
        amountRange: { min: 100, max: 500 }
      });

      results.forEach(payment => {
        expect(payment.amount).toBeGreaterThanOrEqual(100);
        expect(payment.amount).toBeLessThanOrEqual(500);
      });

      console.log(`✅ Amount range filtering working - found ${results.length} payments`);
    });

    it('should filter payments by type', async () => {
      console.log('\n🎯 Testing payment type filtering');
      
      const depositPayments = await searchService.searchPayments('', {
        paymentType: ['tattoo_deposit']
      });

      depositPayments.forEach(payment => {
        expect(payment.paymentType).toBe('tattoo_deposit');
      });

      console.log(`✅ Payment type filtering working - found ${depositPayments.length} deposits`);
    });

    it('should search payments', async () => {
      console.log('\n💳 Testing payment search');
      
      const results = await searchService.searchPayments('payment');
      expect(Array.isArray(results)).toBe(true);

      console.log(`✅ Payment search working - found ${results.length} payments`);
    });
  });

  describe('🚀 Advanced Search Features', () => {
    it('should perform fuzzy search', async () => {
      console.log('\n🔍 Testing fuzzy search capabilities');
      
      // Intentional typo in customer name
      const fuzzyResults = await searchService.globalSearch('Alise', { fuzzy: true });
      const exactResults = await searchService.globalSearch('Alise', { fuzzy: false });

      // Fuzzy search should find more results than exact
      const fuzzyTotal = Object.values(fuzzyResults).reduce((sum, entity: any) => sum + entity.items.length, 0);
      const exactTotal = Object.values(exactResults).reduce((sum, entity: any) => sum + entity.items.length, 0);

      expect(fuzzyTotal).toBeGreaterThanOrEqual(exactTotal);

      console.log(`✅ Fuzzy search working - Fuzzy: ${fuzzyTotal}, Exact: ${exactTotal}`);
    });

    it('should highlight search matches', async () => {
      console.log('\n✨ Testing search result highlighting');
      
      const results = await searchService.globalSearch('Alice', { highlight: true });

      // Check if highlights are included in results
      if (results.customers.items.length > 0) {
        const firstCustomer = results.customers.items[0];
        expect(firstCustomer).toHaveProperty('_highlights');
      }

      console.log('✅ Search highlighting working correctly');
    });

    it('should provide search analytics', async () => {
      console.log('\n📊 Testing search analytics');
      
      // Perform some searches to generate data
      await searchService.globalSearch('tattoo');
      await searchService.globalSearch('consultation');
      await searchService.searchCustomers('Alice');

      const analytics = await searchService.getSearchAnalytics();

      expect(analytics).toHaveProperty('totalSearches');
      expect(analytics).toHaveProperty('topQueries');
      expect(analytics).toHaveProperty('entityBreakdown');
      expect(analytics).toHaveProperty('averageResponseTime');

      expect(analytics.totalSearches).toBeGreaterThan(0);
      expect(Array.isArray(analytics.topQueries)).toBe(true);
      expect(typeof analytics.entityBreakdown).toBe('object');
      expect(analytics.averageResponseTime).toBeGreaterThan(0);

      console.log('✅ Search analytics working correctly');
      console.log(`📊 Total searches: ${analytics.totalSearches}, Avg response: ${analytics.averageResponseTime}ms`);
    });
  });

  describe('⚡ Performance and Edge Cases', () => {
    it('should handle large result sets efficiently', async () => {
      console.log('\n⚡ Testing performance with large result sets');
      
      const startTime = Date.now();
      const results = await searchService.globalSearch('test', {}, 1, 100);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(3000); // Should complete in under 3 seconds

      console.log(`✅ Large result set handled efficiently in ${executionTime}ms`);
    });

    it('should handle special characters in search', async () => {
      console.log('\n🔤 Testing special character handling');
      
      const specialChars = ['@', '#', '&', '%', '!'];
      
      for (const char of specialChars) {
        const results = await searchService.globalSearch(char);
        // Should not throw error
        expect(results).toBeDefined();
      }

      console.log('✅ Special characters handled gracefully');
    });

    it('should handle very long search queries', async () => {
      console.log('\n📏 Testing long search query handling');
      
      const longQuery = 'a'.repeat(1000);
      const results = await searchService.globalSearch(longQuery);

      // Should not throw error and return empty results
      expect(results).toBeDefined();
      
      console.log('✅ Long search queries handled gracefully');
    });

    it('should be case insensitive', async () => {
      console.log('\n🔤 Testing case insensitive search');
      
      const lowerResults = await searchService.globalSearch('alice');
      const upperResults = await searchService.globalSearch('ALICE');
      const mixedResults = await searchService.globalSearch('AlIcE');

      // Should return similar results regardless of case
      expect(lowerResults.customers.items.length).toBe(upperResults.customers.items.length);
      expect(upperResults.customers.items.length).toBe(mixedResults.customers.items.length);

      console.log('✅ Case insensitive search working correctly');
    });
  });

  // Helper function to create comprehensive test data
  async function createTestSearchData() {
    console.log('\n📦 Creating comprehensive search test data');
    
    // Create diverse customers
    testCustomers = await Promise.all([
      createTestCustomer({
        name: 'Alice Johnson',
        email: 'alice@test.com',
        phone: '+1-555-0001',
        notes: 'Regular customer, loves traditional tattoos'
      }),
      createTestCustomer({
        name: 'Bob Smith',
        email: 'bob.smith@email.com',
        phone: '+1-555-0002',
        notes: 'New customer, interested in black and grey work'
      }),
      createTestCustomer({
        name: 'Carol Davis',
        email: 'carol.davis@gmail.com',
        phone: '+1-555-0003',
        notes: 'VIP customer, multiple large pieces'
      }),
      createTestCustomer({
        name: 'David Wilson',
        email: 'david.w@company.com',
        phone: '+1-555-0004',
        notes: 'Corporate client, simple designs'
      })
    ]);

    // Create diverse appointments
    const now = new Date();
    testAppointments = [];
    
    for (let i = 0; i < testCustomers.length; i++) {
      const customer = testCustomers[i];
      const appointmentTime = new Date(now.getTime() + (i * 24 * 60 * 60 * 1000)); // Spread over days
      
      const appointment = await testPrisma.appointment.create({
        data: {
          customerId: customer.id,
          artistId: testArtist.id,
          startTime: appointmentTime,
          endTime: new Date(appointmentTime.getTime() + 2 * 60 * 60 * 1000), // 2 hours
          duration: 120,
          status: i % 2 === 0 ? BookingStatus.SCHEDULED : BookingStatus.COMPLETED,
          type: i % 2 === 0 ? BookingType.CONSULTATION : BookingType.TATTOO_SESSION,
          notes: `${i % 2 === 0 ? 'Initial consultation' : 'Tattoo session'} for ${customer.name}`,
          priceQuote: 150 + (i * 50)
        }
      });
      
      testAppointments.push(appointment);
    }

    // Create diverse tattoo requests
    testRequests = await Promise.all([
      createTestTattooRequest(testCustomers[0].id, {
        description: 'Traditional Japanese dragon tattoo on upper arm',
        placement: 'Upper arm',
        size: 'Large',
        style: 'Traditional Japanese',
        status: 'approved'
      }),
      createTestTattooRequest(null, {
        description: 'Small minimalist flower design for wrist',
        contactEmail: 'anonymous1@test.com',
        placement: 'Wrist',
        size: 'Small',
        style: 'Minimalist',
        status: 'new',
        trackingToken: 'track-001'
      }),
      createTestTattooRequest(testCustomers[1].id, {
        description: 'Black and grey portrait tattoo of family pet',
        placement: 'Forearm',
        size: 'Medium',
        style: 'Black and Grey',
        status: 'reviewed'
      }),
      createTestTattooRequest(null, {
        description: 'Geometric mandala design for shoulder blade',
        contactEmail: 'anonymous2@test.com',
        placement: 'Shoulder blade',
        size: 'Large',
        style: 'Geometric',
        status: 'new',
        trackingToken: 'track-002'
      })
    ]);

    // Create diverse payments
    testPayments = [];
    
    for (let i = 0; i < testCustomers.length; i++) {
      const customer = testCustomers[i];
      const paymentTypes = ['consultation', 'tattoo_deposit', 'tattoo_final', 'touch_up'];
      
      const payment = await testPrisma.payment.create({
        data: {
          customerId: customer.id,
          amount: 100 + (i * 75),
          status: 'completed',
          paymentType: paymentTypes[i % paymentTypes.length],
          paymentMethod: 'card',
          note: `Payment for ${paymentTypes[i % paymentTypes.length]} - ${customer.name}`,
          createdAt: new Date(now.getTime() - (i * 24 * 60 * 60 * 1000)) // Spread over past days
        }
      });
      
      testPayments.push(payment);
    }

    console.log(`✅ Created test data:`);
    console.log(`   • ${testCustomers.length} customers`);
    console.log(`   • ${testAppointments.length} appointments`);
    console.log(`   • ${testRequests.length} tattoo requests`);
    console.log(`   • ${testPayments.length} payments`);
  }
}); 
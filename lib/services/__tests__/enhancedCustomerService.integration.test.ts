import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedCustomerService } from '../enhancedCustomerService';
import { testPrisma, setupExternalMocks, createTestUser, createTestCustomer } from './testSetup';

// Use shared test setup
setupExternalMocks();

describe('EnhancedCustomerService (Integration)', () => {
  let enhancedCustomerService: EnhancedCustomerService;
  let testAdmin: any;
  let testCustomer: any;

  beforeEach(async () => {
    console.log('\n👥 Setting up EnhancedCustomerService integration test');
    
    enhancedCustomerService = new EnhancedCustomerService();
    testAdmin = await createTestUser('admin');
    testCustomer = await createTestCustomer({
      name: 'Enhanced Test Customer',
      email: 'enhanced@test.com'
    });
    
    console.log('✅ EnhancedCustomerService test setup complete');
  });

  describe('👤 Enhanced Customer Profiles', () => {
    it('should create comprehensive customer profile', async () => {
      console.log('\n📋 Testing comprehensive customer profile creation');
      
      const profile = await enhancedCustomerService.getComprehensiveProfile(testCustomer.id);

      expect(profile).toBeDefined();
      expect(profile.basicInfo).toBeDefined();
      expect(profile.statistics).toBeDefined();
      expect(profile.preferences).toBeDefined();
      expect(profile.history).toBeDefined();
      expect(profile.insights).toBeDefined();

      console.log('✅ Comprehensive customer profile created successfully');
    });

    it('should calculate customer lifetime value', async () => {
      console.log('\n💰 Testing customer lifetime value calculation');
      
      const clv = await enhancedCustomerService.calculateCustomerLifetimeValue(testCustomer.id);

      expect(clv).toBeDefined();
      expect(clv.currentValue).toBeTypeOf('number');
      expect(clv.predictedValue).toBeTypeOf('number');
      expect(clv.averageOrderValue).toBeTypeOf('number');

      console.log('✅ Customer lifetime value calculated successfully');
    });
  });

  describe('🎯 Customer Segmentation', () => {
    it('should segment customers intelligently', async () => {
      console.log('\n📊 Testing intelligent customer segmentation');
      
      const segmentation = await enhancedCustomerService.getCustomerSegmentation();

      expect(segmentation).toBeDefined();
      expect(Array.isArray(segmentation.segments)).toBe(true);
      expect(segmentation.totalCustomers).toBeTypeOf('number');

      console.log('✅ Customer segmentation working correctly');
    });

    it('should provide customer analytics', async () => {
      console.log('\n📈 Testing customer analytics');
      
      const analytics = await enhancedCustomerService.getCustomerAnalytics({
        period: 'month'
      });

      expect(analytics).toBeDefined();
      expect(analytics.overview).toBeDefined();
      expect(analytics.demographics).toBeDefined();
      expect(analytics.behavior).toBeDefined();

      console.log('✅ Customer analytics working correctly');
    });
  });

  describe('🔍 Advanced Search', () => {
    it('should perform advanced customer search', async () => {
      console.log('\n🔍 Testing advanced customer search');
      
      const searchResult = await enhancedCustomerService.searchCustomers({
        query: 'Enhanced',
        sortBy: 'name',
        sortOrder: 'asc'
      });

      expect(searchResult).toBeDefined();
      expect(Array.isArray(searchResult.customers)).toBe(true);
      expect(searchResult.total).toBeTypeOf('number');

      console.log('✅ Advanced customer search working correctly');
    });
  });
}); 
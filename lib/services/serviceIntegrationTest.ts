import { ServiceRegistry } from './serviceRegistry';
import { AnalyticsService } from './analyticsService';
import { NotificationService } from './notificationService';
import { SearchService } from './searchService';
import { CommunicationService } from './communicationService';
import { WorkflowService } from './workflowService';

/**
 * Simple integration test to verify all services are working
 */
export async function testServiceIntegration(): Promise<{
  success: boolean;
  results: Record<string, { status: 'ok' | 'error'; message?: string }>;
}> {
  const results: Record<string, { status: 'ok' | 'error'; message?: string }> = {};

  console.log('🔍 Testing Service Integration...\n');

  // Test ServiceRegistry
  try {
    const registry = ServiceRegistry.getInstance();
    await registry.initialize();
    results.serviceRegistry = { status: 'ok' };
    console.log('✅ ServiceRegistry: OK');
  } catch (error) {
    results.serviceRegistry = { status: 'error', message: error.message };
    console.log('❌ ServiceRegistry: ERROR -', error.message);
  }

  // Test AnalyticsService
  try {
    const analytics = new AnalyticsService();
    const metrics = await analytics.getDashboardMetrics();
    results.analyticsService = { status: 'ok' };
    console.log('✅ AnalyticsService: OK');
  } catch (error) {
    results.analyticsService = { status: 'error', message: error.message };
    console.log('❌ AnalyticsService: ERROR -', error.message);
  }

  // Test NotificationService
  try {
    const notifications = new NotificationService();
    const stats = await notifications.getNotificationStats();
    results.notificationService = { status: 'ok' };
    console.log('✅ NotificationService: OK');
  } catch (error) {
    results.notificationService = { status: 'error', message: error.message };
    console.log('❌ NotificationService: ERROR -', error.message);
  }

  // Test SearchService (this will fail with validation error, which is expected)
  try {
    const search = new SearchService();
    await search.globalSearch('test');
    results.searchService = { status: 'error', message: 'Should have thrown validation error' };
    console.log('❌ SearchService: Unexpected success');
  } catch (error) {
    if (error.message.includes('2 characters')) {
      results.searchService = { status: 'ok' };
      console.log('✅ SearchService: OK (expected validation error)');
    } else {
      results.searchService = { status: 'error', message: error.message };
      console.log('❌ SearchService: ERROR -', error.message);
    }
  }

  // Test CommunicationService
  try {
    const communication = new CommunicationService();
    const stats = await communication.getCommunicationStats();
    results.communicationService = { status: 'ok' };
    console.log('✅ CommunicationService: OK');
  } catch (error) {
    results.communicationService = { status: 'error', message: error.message };
    console.log('❌ CommunicationService: ERROR -', error.message);
  }

  // Test WorkflowService
  try {
    const workflow = new WorkflowService();
    const workflows = await workflow.getActiveWorkflows();
    results.workflowService = { status: 'ok' };
    console.log('✅ WorkflowService: OK');
  } catch (error) {
    results.workflowService = { status: 'error', message: error.message };
    console.log('❌ WorkflowService: ERROR -', error.message);
  }

  // Test service interactions
  try {
    const registry = ServiceRegistry.getInstance();
    
    // Test service retrieval
    const analytics = registry.analyticsService;
    const notifications = registry.notificationService;
    const search = registry.searchService;
    
    if (analytics && notifications && search) {
      results.serviceInteractions = { status: 'ok' };
      console.log('✅ Service Interactions: OK');
    } else {
      results.serviceInteractions = { status: 'error', message: 'Some services not available' };
      console.log('❌ Service Interactions: Some services not available');
    }
  } catch (error) {
    results.serviceInteractions = { status: 'error', message: error.message };
    console.log('❌ Service Interactions: ERROR -', error.message);
  }

  const errorCount = Object.values(results).filter(r => r.status === 'error').length;
  const success = errorCount === 0;

  console.log(`\n🎯 Integration Test Summary:`);
  console.log(`✅ Successful: ${Object.values(results).filter(r => r.status === 'ok').length}`);
  console.log(`❌ Failed: ${errorCount}`);
  console.log(`📊 Overall: ${success ? 'PASS' : 'FAIL'}`);

  return { success, results };
}

// Self-executing test when run directly
if (require.main === module) {
  testServiceIntegration()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Integration test failed:', error);
      process.exit(1);
    });
} 
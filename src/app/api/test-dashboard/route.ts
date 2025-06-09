import { NextResponse } from 'next/server';
import { generateMockDashboardMetrics } from '../../../../lib/services/mockAnalyticsData';

export async function GET() {
  try {
    // Test the mock data generation
    const mockMetrics = generateMockDashboardMetrics();
    
    // Test the cache service import
    let cacheStatus = 'unknown';
    try {
      const { cacheService } = await import('../../../../lib/services/cacheService');
      const testKey = 'test_key';
      cacheService.set(testKey, 'test_value', 10);
      const retrieved = cacheService.get(testKey);
      cacheStatus = retrieved === 'test_value' ? 'working' : 'failed';
    } catch (cacheError) {
      cacheStatus = `error: ${cacheError.message}`;
    }

    // Test the realtime service import
    let realtimeStatus = 'unknown';
    try {
      const { realtimeService } = await import('../../../../lib/services/realtimeService');
      realtimeService.getStats();
      realtimeStatus = 'working';
    } catch (realtimeError) {
      realtimeStatus = `error: ${realtimeError.message}`;
    }

    return NextResponse.json({
      status: 'success',
      message: 'Enhanced dashboard components test',
      timestamp: new Date().toISOString(),
      tests: {
        mockData: {
          status: 'working',
          sampleRevenue: mockMetrics.revenue.today.amount,
          sampleAppointments: mockMetrics.appointments.today.count
        },
        cacheService: {
          status: cacheStatus
        },
        realtimeService: {
          status: realtimeStatus
        }
      },
      endpoints: {
        analytics: '/api/analytics/dashboard',
        events: '/api/events',
        test: '/api/test-dashboard'
      }
    });

  } catch (error) {
    console.error('Dashboard test error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to test dashboard components',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 
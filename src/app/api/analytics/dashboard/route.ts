import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '../../../../../lib/services/analyticsService';
import { cacheService } from '../../../../../lib/services/cacheService';
import { generateMockDashboardMetrics } from '../../../../../lib/services/mockAnalyticsData';

const analyticsService = new AnalyticsService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'current';
    
    // Use cache service to reduce database load
    const cacheKey = `dashboard_analytics_${timeframe}`;
    
    const metrics = await cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          return await analyticsService.getDashboardMetrics(timeframe);
        } catch (error) {
          console.warn('Analytics service failed, using mock data:', error);
          // Return mock data as fallback for development/testing
          return generateMockDashboardMetrics();
        }
      },
      300 // 5 minutes cache
    );

    // Add cache headers for client-side caching
    const response = NextResponse.json(metrics);
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    
    return response;

  } catch (error) {
    console.error('Dashboard analytics API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Force refresh analytics (clear cache)
    const { timeframe } = await request.json();
    const cacheKey = `dashboard_analytics_${timeframe || 'current'}`;
    
    cacheService.delete(cacheKey);
    
    // Fetch fresh data
    const metrics = await analyticsService.getDashboardMetrics(timeframe);
    
    return NextResponse.json({ 
      success: true, 
      metrics,
      message: 'Analytics refreshed successfully'
    });

  } catch (error) {
    console.error('Dashboard analytics refresh error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to refresh dashboard metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
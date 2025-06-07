import { NextRequest, NextResponse } from 'next/server';
import { generateMockDashboardMetrics } from '../../../../../lib/services/mockAnalyticsData';

// The URL of your Fastify backend.
// It's crucial to set this in your frontend's .env.local file.
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

/**
 * This route acts as a proxy to the backend's analytics service.
 * It ensures the frontend does not need direct database access.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'current';

    // Construct the URL to the backend's analytics endpoint
    const backendUrl = `${BACKEND_API_URL}/analytics/dashboard?timeframe=${timeframe}`;
    
    // Fetch data from the backend
    const response = await fetch(backendUrl, {
      // Forward necessary headers if needed, e.g., for authentication
      // headers: { 'Authorization': request.headers.get('Authorization') || '' },
      
      // Use Next.js's powerful caching for performance
      next: {
        revalidate: 300, // Revalidate every 5 minutes
        tags: ['dashboard-analytics'], // Tag for on-demand revalidation
      }
    });

    if (!response.ok) {
      // If the backend returns an error, log it and fall back to mock data
      const errorData = await response.json();
      console.warn(`Backend analytics service failed (status: ${response.status}), using mock data:`, errorData);
      const mockMetrics = generateMockDashboardMetrics();
      return NextResponse.json(mockMetrics);
    }
    
    const metrics = await response.json();

    // The backend's response is passed through to the client.
    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Dashboard analytics API proxy error:', error);
    
    // If the backend is completely unavailable, fall back to mock data
    console.warn('Falling back to mock data due to proxy error.');
    const mockMetrics = generateMockDashboardMetrics();
    return NextResponse.json(mockMetrics);
  }
}

/**
 * Handles on-demand revalidation of the dashboard data.
 */
export async function POST(request: NextRequest) {
  try {
    // This would typically be a protected route
    // You could use NextAuth.js or a webhook signature to secure it.
    
    // Invalidate the cache for the dashboard analytics data
    const { revalidateTag } = await import('next/cache');
    revalidateTag('dashboard-analytics');
    
    return NextResponse.json({ 
      success: true,
      message: 'Dashboard analytics cache invalidated successfully.'
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
import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle incorrect POST requests to /tattooRequest
 * These should be going to /api/tattoo-requests instead
 * This route catches and redirects or returns an appropriate error
 */

export async function POST(request: NextRequest) {
  console.warn('⚠️ Incorrect POST to /api/tattooRequest - should use /api/tattoo-requests');

  // Log details for debugging
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const userAgent = request.headers.get('user-agent');
  const contentType = request.headers.get('content-type');
  const host = request.headers.get('host');

  console.log('Request details:', {
    origin,
    referer,
    userAgent,
    contentType,
    host,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  });

  // Try to get request body for debugging (be careful with sensitive data)
  try {
    const body = await request.text();
    console.log('Request body preview:', body.substring(0, 200));
  } catch (e) {
    console.log('Could not read request body');
  }

  // Check if this is a bot or crawler
  const botPatterns = /bot|crawler|spider|scraper|curl|wget|python|java|ruby|perl/i;
  if (userAgent && botPatterns.test(userAgent)) {
    console.log('🤖 Bot detected, returning 404');
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  // For legitimate requests that are just using the wrong endpoint
  // Return a helpful error message
  return NextResponse.json(
    {
      error: 'Method not allowed. This endpoint does not accept POST requests.',
      message: 'If you are trying to submit a tattoo request, please use the form at /tattooRequest',
      correctEndpoint: '/api/tattoo-requests'
    },
    { status: 405 }
  );
}

export async function GET(request: NextRequest) {
  // Redirect GET requests to the actual form page
  return NextResponse.redirect(new URL('/tattooRequest', request.url));
}
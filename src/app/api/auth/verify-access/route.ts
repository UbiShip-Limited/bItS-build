import { NextRequest, NextResponse } from 'next/server';

// Helper function to extract client IP address from request
function getClientIP(request: NextRequest): string {
  // Try different header sources for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  // Fallback - this won't be available in Vercel edge functions
  return 'unknown IP';
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Production staff access verification - Updated for deployment
export async function POST(request: NextRequest) {
  // Add CORS headers to response
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Parse JSON body with better error handling
    let body;
    try {
      const text = await request.text();
      if (!text) {
        return NextResponse.json(
          { success: false, error: 'Empty request body' }, 
          { status: 400, headers }
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' }, 
        { status: 400, headers }
      );
    }

    const { accessCode } = body;

    // Validate input
    if (!accessCode || typeof accessCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Access code is required and must be a string' }, 
        { status: 400, headers }
      );
    }
    
    // Get the staff access code from environment variables
    const correctAccessCode = process.env.STAFF_ACCESS_CODE;
    
    // If no access code is configured, deny access for security
    if (!correctAccessCode) {
      console.warn('⚠️ STAFF_ACCESS_CODE not configured - denying access');
      return NextResponse.json(
        { success: false, error: 'Access code system not configured' }, 
        { status: 503, headers }
      );
    }
    
    // Verify the access code (case-sensitive comparison)
    const isValid = accessCode === correctAccessCode;
    
    // Get client IP for logging
    const clientIP = getClientIP(request);
    
    // Log the attempt (without exposing the actual codes)
    console.log(`🔐 Staff access attempt: ${isValid ? 'SUCCESS' : 'FAILED'} from ${clientIP}`);
    
    if (isValid) {
      return NextResponse.json(
        { success: true }, 
        { status: 200, headers }
      );
    } else {
      // Add a small delay to prevent rapid brute force attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(
        { success: false, error: 'Invalid access code' }, 
        { status: 401, headers }
      );
    }
    
  } catch (error) {
    console.error('Access code verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during verification' }, 
      { status: 500, headers }
    );
  }
}

// Handle unsupported methods explicitly
export async function GET() {
  return NextResponse.json(
    { error: 'Method GET not allowed. Use POST to verify access code.' }, 
    { 
      status: 405,
      headers: {
        'Allow': 'POST, OPTIONS',
        'Access-Control-Allow-Origin': '*',
      }
    }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method PUT not allowed. Use POST to verify access code.' }, 
    { 
      status: 405,
      headers: {
        'Allow': 'POST, OPTIONS',
        'Access-Control-Allow-Origin': '*',
      }
    }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method DELETE not allowed. Use POST to verify access code.' }, 
    { 
      status: 405,
      headers: {
        'Allow': 'POST, OPTIONS',
        'Access-Control-Allow-Origin': '*',
      }
    }
  );
} 
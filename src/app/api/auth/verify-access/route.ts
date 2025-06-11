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

// Staff access verification endpoint - requires STAFF_ACCESS_CODE environment variable
export async function POST(request: NextRequest) {
  try {
    const { accessCode } = await request.json();
    
    // Get the staff access code from environment variables
    const correctAccessCode = process.env.STAFF_ACCESS_CODE;
    
    // If no access code is configured, deny access for security
    if (!correctAccessCode) {
      console.warn('⚠️ STAFF_ACCESS_CODE not configured - denying access');
      return NextResponse.json(
        { success: false, error: 'Access code system not configured' }, 
        { status: 503 }
      );
    }
    
    // Verify the access code (case-sensitive comparison)
    const isValid = accessCode === correctAccessCode;
    
    // Get client IP for logging
    const clientIP = getClientIP(request);
    
    // Log the attempt (without exposing the actual codes)
    console.log(`🔐 Staff access attempt: ${isValid ? 'SUCCESS' : 'FAILED'} from ${clientIP}`);
    
    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      // Add a small delay to prevent rapid brute force attempts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(
        { success: false, error: 'Invalid access code' }, 
        { status: 401 }
      );
    }
    
  } catch (error) {
    console.error('Access code verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' }, 
      { status: 500 }
    );
  }
} 
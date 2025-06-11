import { NextRequest, NextResponse } from 'next/server';

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
    
    // Log the attempt (without exposing the actual codes)
    console.log(`🔐 Staff access attempt: ${isValid ? 'SUCCESS' : 'FAILED'} from ${request.ip || 'unknown IP'}`);
    
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
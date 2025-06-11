import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🔍 Staff access verification API called');
  
  try {
    // Get the request body
    const body = await request.json();
    console.log('📥 Request body received');
    
    const { accessCode } = body;
    
    // Simple validation
    if (!accessCode) {
      console.log('❌ No access code provided');
      return NextResponse.json({ 
        success: false, 
        error: 'Access code required' 
      });
    }
    
    // Get environment variable
    const correctAccessCode = process.env.STAFF_ACCESS_CODE;
    console.log('🔑 Environment access code configured:', !!correctAccessCode);
    
    if (!correctAccessCode) {
      console.log('❌ STAFF_ACCESS_CODE not configured in environment');
      return NextResponse.json({ 
        success: false, 
        error: 'Access code system not configured' 
      });
    }
    
    // Simple comparison
    const isValid = accessCode === correctAccessCode;
    console.log('🔐 Access code validation result:', isValid);
    
    if (isValid) {
      console.log('✅ Access code verified successfully');
      return NextResponse.json({ success: true });
    } else {
      console.log('❌ Invalid access code provided');
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid access code' 
      });
    }
    
  } catch (error) {
    console.error('💥 API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error' 
    });
  }
}

 
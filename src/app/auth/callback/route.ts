import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('🔄 Auth callback received:', {
    hasCode: !!code,
    error,
    errorCode,
    errorDescription,
    url: requestUrl.toString()
  });

  // Handle Supabase auth errors
  if (error) {
    console.error('❌ Supabase auth error:', { error, errorCode, errorDescription });
    
    const redirectUrl = new URL('/auth/reset-password', requestUrl.origin);
    
    // Handle specific error cases
    if (errorCode === 'otp_expired' || error === 'access_denied') {
      redirectUrl.searchParams.set('error', 'expired');
      redirectUrl.searchParams.set('message', 'The reset link has expired. Please request a new one.');
    } else {
      redirectUrl.searchParams.set('error', 'invalid');
      redirectUrl.searchParams.set('message', 'The reset link is invalid. Please request a new one.');
    }
    
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      console.log('🔄 Exchanging code for session...');
      
      // Exchange the code for a session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('❌ Code exchange failed:', exchangeError);
        
        const redirectUrl = new URL('/auth/reset-password', requestUrl.origin);
        redirectUrl.searchParams.set('error', 'exchange_failed');
        redirectUrl.searchParams.set('message', 'Failed to validate reset link. Please try again.');
        
        return NextResponse.redirect(redirectUrl);
      }

      if (data.session) {
        console.log('✅ Session created successfully for user:', data.session.user.id);
        
        // Check if this is a password recovery session
        const isPasswordRecovery = data.session.user.recovery_sent_at || 
                                   requestUrl.searchParams.get('type') === 'recovery' ||
                                   requestUrl.searchParams.get('type') === 'password_recovery';

        if (isPasswordRecovery) {
          console.log('🔐 Password recovery session detected, redirecting to reset password');
          return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
        } else {
          console.log('✅ Regular auth session, redirecting to dashboard');
          return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
        }
      } else {
        console.warn('⚠️ Code exchange succeeded but no session created');
        
        const redirectUrl = new URL('/auth/reset-password', requestUrl.origin);
        redirectUrl.searchParams.set('error', 'no_session');
        redirectUrl.searchParams.set('message', 'Unable to create session. Please try again.');
        
        return NextResponse.redirect(redirectUrl);
      }
    } catch (err) {
      console.error('❌ Unexpected error during code exchange:', err);
      
      const redirectUrl = new URL('/auth/reset-password', requestUrl.origin);
      redirectUrl.searchParams.set('error', 'unexpected');
      redirectUrl.searchParams.set('message', 'An unexpected error occurred. Please try again.');
      
      return NextResponse.redirect(redirectUrl);
    }
  }

  // No code parameter - invalid callback
  console.warn('⚠️ Auth callback called without code parameter');
  
  const redirectUrl = new URL('/auth/forgot-password', requestUrl.origin);
  redirectUrl.searchParams.set('error', 'invalid_callback');
  redirectUrl.searchParams.set('message', 'Invalid reset link. Please request a new password reset.');
  
  return NextResponse.redirect(redirectUrl);
}
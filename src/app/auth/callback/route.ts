import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next');
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('🔄 Auth callback received:', {
    hasCode: !!code,
    hasTokenHash: !!tokenHash,
    type,
    next,
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

  // Handle PKCE flow with token_hash (modern Supabase auth)
  if (tokenHash && type) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      console.log('🔄 Verifying OTP with token_hash (PKCE flow)...');
      
      // Use verifyOtp for PKCE flow
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as any, // 'recovery' for password reset
      });
      
      if (verifyError) {
        console.error('❌ Token verification failed:', verifyError);
        
        const redirectUrl = new URL('/auth/reset-password', requestUrl.origin);
        
        // Handle specific PKCE errors
        if (verifyError.message?.includes('expired') || verifyError.message?.includes('invalid')) {
          redirectUrl.searchParams.set('error', 'expired');
          redirectUrl.searchParams.set('message', 'The reset link has expired or is invalid. Please request a new one.');
        } else {
          redirectUrl.searchParams.set('error', 'verification_failed');
          redirectUrl.searchParams.set('message', 'Failed to validate reset link. Please try again.');
        }
        
        return NextResponse.redirect(redirectUrl);
      }

      if (data.session) {
        console.log('✅ PKCE session created successfully for user:', data.session.user.id);
        
        // For recovery type, redirect to update-password (Supabase's expected endpoint)
        if (type === 'recovery') {
          console.log('🔐 Password recovery session detected, redirecting to update-password');
          return NextResponse.redirect(new URL('/auth/update-password', requestUrl.origin));
        } else {
          console.log('✅ Other auth type, redirecting to dashboard');
          return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
        }
      } else {
        console.warn('⚠️ Token verification succeeded but no session created');
        
        const redirectUrl = new URL('/auth/reset-password', requestUrl.origin);
        redirectUrl.searchParams.set('error', 'no_session');
        redirectUrl.searchParams.set('message', 'Unable to create session. Please try again.');
        
        return NextResponse.redirect(redirectUrl);
      }
    } catch (err) {
      console.error('❌ Unexpected error during token verification:', err);
      
      const redirectUrl = new URL('/auth/reset-password', requestUrl.origin);
      redirectUrl.searchParams.set('error', 'unexpected');
      redirectUrl.searchParams.set('message', 'An unexpected error occurred. Please try again.');
      
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Handle legacy flow with code (for backwards compatibility)
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      console.log('🔄 Exchanging code for session (legacy flow)...');
      
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
        console.log('✅ Legacy session created successfully for user:', data.session.user.id);
        
        // Check if this is a password recovery session
        const isPasswordRecovery = data.session.user.recovery_sent_at || 
                                   type === 'recovery' ||
                                   type === 'password_recovery';

        if (isPasswordRecovery) {
          console.log('🔐 Password recovery session detected, redirecting to update-password');
          return NextResponse.redirect(new URL('/auth/update-password', requestUrl.origin));
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

  // No valid parameters - invalid callback
  console.warn('⚠️ Auth callback called without valid parameters (no code or token_hash)');
  
  const redirectUrl = new URL('/auth/forgot-password', requestUrl.origin);
  redirectUrl.searchParams.set('error', 'invalid_callback');
  redirectUrl.searchParams.set('message', 'Invalid reset link. Please request a new password reset.');
  
  return NextResponse.redirect(redirectUrl);
}
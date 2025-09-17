import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/src/utils/supabase/server';

// Force dynamic rendering for auth callback route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
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
      url: requestUrl.toString(),
      origin: requestUrl.origin,
      expectedDomain: process.env.NEXT_PUBLIC_SITE_URL || 'not set'
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
    const supabase = await createClient();

    try {
      console.log('🔄 Verifying OTP with token_hash (PKCE flow)...');
      console.log('🔍 Type from URL:', type);
      
      // Pass the type parameter as-is from the URL per Supabase documentation
      // This allows both 'recovery' for password resets and other types to work correctly
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType, // Use the actual type from URL
      });
      
      if (verifyError) {
        console.error('❌ Token verification failed:', verifyError);
        console.error('Error details:', {
          message: verifyError.message,
          status: (verifyError as any).status,
          code: (verifyError as any).code,
          possibleCause: 'This may occur if the redirect URL domain does not match exactly what is configured in Supabase',
          currentOrigin: requestUrl.origin,
          tokenHash: tokenHash?.substring(0, 20) + '...'
        });
        
        const redirectUrl = new URL('/auth/reset-password', requestUrl.origin);
        
        // Handle rate limiting errors
        if (verifyError.message?.includes('rate') || 
            verifyError.message?.includes('too many') ||
            (verifyError as any).status === 429) {
          redirectUrl.searchParams.set('error', 'rate_limit');
          redirectUrl.searchParams.set('message', 'Too many attempts. Please wait a few minutes and try again.');
        }
        // Handle expired or invalid tokens (including domain mismatch)
        else if (verifyError.message?.includes('expired') ||
                 verifyError.message?.includes('invalid') ||
                 verifyError.message?.includes('not found') ||
                 (verifyError as any).code === 'otp_expired') {
          redirectUrl.searchParams.set('error', 'expired');
          redirectUrl.searchParams.set('message', 'The reset link has expired or is invalid. This may happen if you clicked the link from a different domain (with or without www). Please request a new password reset.');
        }
        // Handle OTP/token specific errors
        else if (verifyError.message?.includes('otp') || 
                 verifyError.message?.includes('token')) {
          redirectUrl.searchParams.set('error', 'invalid_token');
          redirectUrl.searchParams.set('message', 'The reset link is invalid. Please request a new password reset.');
        }
        // Generic error fallback
        else {
          redirectUrl.searchParams.set('error', 'verification_failed');
          redirectUrl.searchParams.set('message', 'Failed to validate reset link. Please try again or contact support.');
        }
        
        return NextResponse.redirect(redirectUrl);
      }

      if (data.session) {
        console.log('✅ PKCE session created successfully for user:', data.session.user.id);
        console.log('📊 Session details:', {
          userId: data.session.user.id,
          email: data.session.user.email,
          expiresAt: data.session.expires_at,
        });
        
        // For password recovery, always redirect to update-password page
        // Check both the URL type parameter and the session's recovery indicators
        const isPasswordRecovery = type === 'recovery' || 
                                   type === 'magiclink' ||
                                   data.session.user.recovery_sent_at;
                                   
        if (isPasswordRecovery) {
          console.log('🔐 Password recovery session detected, redirecting to update-password');
          return NextResponse.redirect(new URL('/auth/update-password', requestUrl.origin));
        } else {
          console.log('✅ Regular auth session, redirecting to dashboard');
          return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
        }
      } else {
        console.warn('⚠️ Token verification succeeded but no session created');
        console.warn('Verification response:', JSON.stringify(data, null, 2));
        
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
    const supabase = await createClient();

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
  } catch (error) {
    // Catch any unhandled errors to prevent 500 errors
    console.error('❌ Unhandled error in auth callback:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    // Redirect to error page with a generic message
    const requestUrl = new URL(request.url);
    const redirectUrl = new URL('/auth/reset-password', requestUrl.origin);
    redirectUrl.searchParams.set('error', 'server_error');
    redirectUrl.searchParams.set('message', 'An unexpected error occurred. Please try again or contact support.');
    
    return NextResponse.redirect(redirectUrl);
  }
}
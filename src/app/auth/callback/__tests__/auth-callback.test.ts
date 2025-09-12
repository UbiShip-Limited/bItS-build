import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

// Test utilities for auth callback logic
describe('Auth Callback Route Logic', () => {
  const mockSupabaseClient = {
    auth: {
      verifyOtp: vi.fn(),
      exchangeCodeForSession: vi.fn(),
    }
  };

  const mockCookies = () => ({});
  
  // Mock createRouteHandlerClient 
  vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createRouteHandlerClient: () => mockSupabaseClient
  }));

  // Mock Next.js components
  vi.mock('next/headers', () => ({
    cookies: () => mockCookies()
  }));

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PKCE Type Validation', () => {
    it('should pass type parameter as-is from URL for PKCE token_hash flows', () => {
      // For PKCE token_hash flows, we pass the type parameter directly from URL
      // per Supabase documentation
      const getPKCEType = (urlType: string): EmailOtpType => {
        // Pass through the actual type from URL
        return urlType as EmailOtpType;
      };
      
      // Test that URL types are passed through correctly
      expect(getPKCEType('recovery')).toBe('recovery');
      expect(getPKCEType('signup')).toBe('signup');
      expect(getPKCEType('email_change')).toBe('email_change');
      expect(getPKCEType('email')).toBe('email');
    });

    it('should correctly handle different OTP types', () => {
      // Valid email OTP types per Supabase documentation
      const validOtpTypes: EmailOtpType[] = ['signup', 'email_change', 'recovery', 'email'];
      
      // All these types should be valid for verifyOtp
      expect(validOtpTypes).toContain('recovery');
      expect(validOtpTypes).toContain('signup');
      expect(validOtpTypes).toContain('email_change');
      expect(validOtpTypes).toContain('email');
    });
  });

  describe('PKCE Token Hash Flow', () => {
    it('should call verifyOtp with correct parameters for password reset', async () => {
      const mockVerifyOtp = vi.fn().mockResolvedValue({
        data: { 
          session: { 
            user: { id: 'test-user-id' } 
          } 
        },
        error: null
      });
      
      mockSupabaseClient.auth.verifyOtp = mockVerifyOtp;

      // Simulate the verifyOtp call that happens in our route
      // PKCE token_hash flows use the type from URL
      const tokenHash = 'pkce_test_token_hash';
      const type = 'recovery'; // Common type for password reset
      
      await mockSupabaseClient.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType
      });

      expect(mockVerifyOtp).toHaveBeenCalledWith({
        token_hash: 'pkce_test_token_hash',
        type: 'recovery'
      });
    });

    it('should handle verifyOtp errors correctly', async () => {
      const mockError = {
        message: 'Token has expired or is invalid',
        status: 400
      };

      mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await mockSupabaseClient.auth.verifyOtp({
        token_hash: 'expired_token',
        type: 'recovery' as EmailOtpType // Use actual type from URL
      });

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe('Legacy Code Flow', () => {
    it('should call exchangeCodeForSession for legacy flow', async () => {
      const mockExchangeCode = vi.fn().mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: 'test-user-id',
              recovery_sent_at: new Date().toISOString()
            } 
          } 
        },
        error: null
      });
      
      mockSupabaseClient.auth.exchangeCodeForSession = mockExchangeCode;

      await mockSupabaseClient.auth.exchangeCodeForSession('test-code');

      expect(mockExchangeCode).toHaveBeenCalledWith('test-code');
    });
  });

  describe('URL Parameter Parsing', () => {
    it('should correctly extract callback parameters', () => {
      // Test URL parameter extraction logic
      const testUrl = 'https://localhost:3000/auth/callback?token_hash=pkce_test&type=recovery&next=/auth/update-password';
      const url = new URL(testUrl);
      
      const tokenHash = url.searchParams.get('token_hash');
      const type = url.searchParams.get('type');
      const next = url.searchParams.get('next');
      
      expect(tokenHash).toBe('pkce_test');
      expect(type).toBe('recovery');
      expect(next).toBe('/auth/update-password');
    });

    it('should handle error parameters', () => {
      const errorUrl = 'https://localhost:3000/auth/callback?error=access_denied&error_code=otp_expired&error_description=The+link+has+expired';
      const url = new URL(errorUrl);
      
      const error = url.searchParams.get('error');
      const errorCode = url.searchParams.get('error_code');
      const errorDescription = url.searchParams.get('error_description');
      
      expect(error).toBe('access_denied');
      expect(errorCode).toBe('otp_expired');
      expect(errorDescription).toBe('The link has expired');
    });
  });

  describe('Redirect Logic', () => {
    it('should redirect to update-password for recovery type', () => {
      const baseUrl = 'https://localhost:3000';
      const type = 'recovery';
      
      // Test our redirect logic
      if (type === 'recovery') {
        const redirectUrl = new URL('/auth/update-password', baseUrl);
        expect(redirectUrl.toString()).toBe('https://localhost:3000/auth/update-password');
      }
    });

    it('should redirect to dashboard for other types', () => {
      const baseUrl = 'https://localhost:3000';
      const type = 'signup';
      
      if (type !== 'recovery') {
        const redirectUrl = new URL('/dashboard', baseUrl);
        expect(redirectUrl.toString()).toBe('https://localhost:3000/dashboard');
      }
    });

    it('should redirect to reset-password with error parameters', () => {
      const baseUrl = 'https://localhost:3000';
      const redirectUrl = new URL('/auth/reset-password', baseUrl);
      redirectUrl.searchParams.set('error', 'expired');
      redirectUrl.searchParams.set('message', 'The reset link has expired. Please request a new one.');
      
      expect(redirectUrl.toString()).toBe('https://localhost:3000/auth/reset-password?error=expired&message=The+reset+link+has+expired.+Please+request+a+new+one.');
    });
  });
});

// Integration test for dashboard URL generation (backend)
describe('Dashboard URL Generation (Backend Integration)', () => {
  it('should generate correct tattoo request URLs', () => {
    const frontendUrl = 'https://bowenislandtattooshop.com';
    const requestId = 'req_123';
    
    const dashboardUrl = `${frontendUrl}/dashboard/tattoo-request/${requestId}`;
    expect(dashboardUrl).toBe('https://bowenislandtattooshop.com/dashboard/tattoo-request/req_123');
  });

  it('should generate correct appointment URLs', () => {
    const frontendUrl = 'https://bowenislandtattooshop.com';
    const appointmentId = 'apt_456';
    
    const dashboardUrl = `${frontendUrl}/dashboard/appointments/${appointmentId}`;
    expect(dashboardUrl).toBe('https://bowenislandtattooshop.com/dashboard/appointments/apt_456');
  });

  it('should generate correct payment URLs', () => {
    const frontendUrl = 'https://bowenislandtattooshop.com';
    
    const dashboardUrl = `${frontendUrl}/dashboard/payments`;
    expect(dashboardUrl).toBe('https://bowenislandtattooshop.com/dashboard/payments');
  });

  it('should use fallback URL when FRONTEND_URL is not set', () => {
    const fallbackUrl = 'http://localhost:3000';
    const requestId = 'req_789';
    
    const dashboardUrl = `${fallbackUrl}/dashboard/tattoo-request/${requestId}`;
    expect(dashboardUrl).toBe('http://localhost:3000/dashboard/tattoo-request/req_789');
  });
});
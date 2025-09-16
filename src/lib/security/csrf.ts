/**
 * CSRF Protection utilities
 * Generates and validates CSRF tokens for form submissions
 */

import crypto from 'crypto';

const TOKEN_LENGTH = 32;
const TOKEN_HEADER = 'X-CSRF-Token';

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Store token in session/cookie
 */
export function storeCSRFToken(token: string): void {
  if (typeof window !== 'undefined') {
    // Store in sessionStorage for client-side usage
    sessionStorage.setItem('csrf_token', token);
  }
}

/**
 * Get stored CSRF token
 */
export function getStoredCSRFToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('csrf_token');
  }
  return null;
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(requestToken: string, storedToken: string): boolean {
  if (!requestToken || !storedToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(requestToken),
    Buffer.from(storedToken)
  );
}

/**
 * Add CSRF token to fetch headers
 */
export function addCSRFHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getStoredCSRFToken();

  if (token) {
    return {
      ...headers,
      [TOKEN_HEADER]: token
    };
  }

  return headers;
}

/**
 * Hook to initialize CSRF protection
 */
export function useCSRFProtection() {
  if (typeof window !== 'undefined') {
    // Check if token exists, generate if not
    if (!getStoredCSRFToken()) {
      const newToken = generateCSRFToken();
      storeCSRFToken(newToken);
    }
  }
}

/**
 * Middleware helper for API routes to validate CSRF
 */
export function requireCSRFToken(request: Request): boolean {
  const token = request.headers.get(TOKEN_HEADER);
  const storedToken = getStoredCSRFToken();

  if (!token || !storedToken) {
    return false;
  }

  return validateCSRFToken(token, storedToken);
}
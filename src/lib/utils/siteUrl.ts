/**
 * Get the correct site URL for redirects and callbacks
 * Handles both development and production environments
 * IMPORTANT: This must match exactly what's configured in Supabase Dashboard
 */
export function getSiteURL(): string {
  // In production, use the actual domain
  if (typeof window !== 'undefined') {
    // Browser environment - use current origin
    const url = window.location.origin;

    // Normalize production URLs to include www subdomain for consistency
    // This ensures the URL matches what Supabase expects
    if (url === 'https://bowenislandtattooshop.com') {
      return 'https://www.bowenislandtattooshop.com';
    }

    // Only use localhost in development
    if (url.includes('localhost') && process.env.NODE_ENV === 'production') {
      // Fallback to a production URL if we're in production but somehow got localhost
      // This should be set via environment variable
      const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bowenislandtattooshop.com';
      // Ensure www subdomain in production
      return configuredUrl.replace('https://bowenislandtattooshop.com', 'https://www.bowenislandtattooshop.com');
    }

    return url;
  }

  // Server-side or during build
  // Check for various environment variables that might contain the URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
    // Ensure www subdomain in production for consistency
    if (configuredUrl === 'https://bowenislandtattooshop.com') {
      return 'https://www.bowenislandtattooshop.com';
    }
    return configuredUrl;
  }

  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Railway deployment
  if (process.env.RAILWAY_STATIC_URL) {
    return `https://${process.env.RAILWAY_STATIC_URL}`;
  }

  // Fallback to localhost ONLY in development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  // In production, we should always have a proper URL
  console.warn('No production URL configured! Set NEXT_PUBLIC_SITE_URL environment variable.');
  // Use www subdomain as the canonical URL
  return 'https://www.bowenislandtattooshop.com';
}
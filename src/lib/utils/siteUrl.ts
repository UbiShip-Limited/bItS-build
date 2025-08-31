/**
 * Get the correct site URL for redirects and callbacks
 * Handles both development and production environments
 */
export function getSiteURL(): string {
  // In production, use the actual domain
  if (typeof window !== 'undefined') {
    // Browser environment - use current origin
    const url = window.location.origin;
    // Only use localhost in development
    if (url.includes('localhost') && process.env.NODE_ENV === 'production') {
      // Fallback to a production URL if we're in production but somehow got localhost
      return 'https://bowenislandtattoo.com'; // Replace with your actual domain
    }
    return url;
  }
  
  // Server-side or during build
  // Check for various environment variables that might contain the URL
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000';
}
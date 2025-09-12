/**
 * Cache busting utilities for production deployments
 */

// Generate a cache buster query parameter
export const getCacheBuster = (): string => {
  // Use build time or deployment time as cache buster
  // Force rebuild: 2025-09-12-fix-next-module-error-v2
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || Date.now().toString();
  return `v=${buildTime}`;
};

// Force mobile styles by adding inline styles as fallback
export const getMobileStyleOverrides = () => ({
  footer: {
    backgroundColor: '#080808 !important',
    background: '#080808 !important',
  },
  faqAccordion: {
    color: 'white !important',
  },
  verticalSplitLines: {
    opacity: '0.3 !important',
    borderColor: 'rgba(184, 149, 106, 0.3) !important',
  }
});

// Add cache-busting meta tag
export const addCacheBustingMeta = () => {
  if (typeof window !== 'undefined') {
    const meta = document.createElement('meta');
    meta.name = 'cache-control';
    meta.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(meta);
    
    const pragma = document.createElement('meta');
    pragma.httpEquiv = 'pragma';
    pragma.content = 'no-cache';
    document.head.appendChild(pragma);
    
    const expires = document.createElement('meta');
    expires.httpEquiv = 'expires';
    expires.content = '0';
    document.head.appendChild(expires);
  }
};
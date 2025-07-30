/**
 * Smooth scroll to element with offset for fixed header
 */
export const smoothScrollTo = (elementId: string, offset: number = 80) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};

/**
 * Handle navigation click for both hash and regular links
 */
export const handleNavClick = (
  e: React.MouseEvent<HTMLAnchorElement>, 
  path: string,
  onComplete?: () => void
) => {
  // Check if it's a hash link
  if (path.startsWith('#')) {
    e.preventDefault();
    const elementId = path.substring(1);
    smoothScrollTo(elementId);
    
    // Update URL without triggering navigation
    window.history.pushState(null, '', path);
    
    // Call onComplete callback if provided (useful for closing mobile menu)
    if (onComplete) {
      onComplete();
    }
  }
  // Let regular links proceed normally
};
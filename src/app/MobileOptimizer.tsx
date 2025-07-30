"use client";

import { useEffect } from "react";

export default function MobileOptimizer() {
  useEffect(() => {
    // Add mobile-specific optimizations after hydration
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.documentElement.classList.add('touch-device');
    }
    
    // Force mobile styling overrides for production cache issues
    const forceMobileStyles = () => {
      // Force footer background on mobile
      const footers = document.querySelectorAll('footer');
      footers.forEach(footer => {
        if (window.innerWidth <= 768) {
          (footer as HTMLElement).style.backgroundColor = '#080808';
          (footer as HTMLElement).style.background = '#080808';
        }
      });
      
      // Force dark mode text colors
      const faqElements = document.querySelectorAll('#faq');
      faqElements.forEach(faq => {
        (faq as HTMLElement).style.color = 'white';
      });
      
      // Enhance gold lines visibility
      const goldLines = document.querySelectorAll('[class*="gold-500"]');
      goldLines.forEach(line => {
        const lineElement = line as HTMLElement;
        if (window.innerWidth <= 768 && lineElement.style.opacity) {
          const currentOpacity = parseFloat(lineElement.style.opacity) || 0.1;
          if (currentOpacity < 0.2) {
            lineElement.style.opacity = '0.3';
          }
        }
      });
    };
    
    // Apply immediately and on resize
    forceMobileStyles();
    window.addEventListener('resize', forceMobileStyles);
    
    // Also apply after a short delay to catch dynamically loaded content
    setTimeout(forceMobileStyles, 1000);
    
    
    // Improve mobile scroll performance with passive listeners
    const addPassiveListeners = () => {
      window.addEventListener('touchstart', () => {}, { passive: true });
      window.addEventListener('touchmove', () => {}, { passive: true });
    };

    // Prevent horizontal scrolling on mobile
    const preventHorizontalScroll = () => {
      // Ensure viewport meta tag is correct
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        document.head.appendChild(viewport);
      }
      viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover');
      
      // Add overflow control to prevent horizontal scroll
      document.documentElement.style.overflowX = 'hidden';
      document.body.style.overflowX = 'hidden';
      document.body.style.width = '100%';
      document.body.style.maxWidth = '100%';
    };
    
    addPassiveListeners();
    preventHorizontalScroll();
    
    // Cleanup function
    return () => {
      window.removeEventListener('resize', forceMobileStyles);
    };
  }, []);

  // This component doesn't render anything, it just handles side effects
  return null;
} 
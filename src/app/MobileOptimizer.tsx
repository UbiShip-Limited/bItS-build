"use client";

import { useEffect } from "react";

export default function MobileOptimizer() {
  useEffect(() => {
    // Add mobile-specific optimizations after hydration
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.documentElement.classList.add('touch-device');
    }
    
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
      // Remove listeners if needed (though passive listeners are generally fine to leave)
    };
  }, []);

  // This component doesn't render anything, it just handles side effects
  return null;
} 
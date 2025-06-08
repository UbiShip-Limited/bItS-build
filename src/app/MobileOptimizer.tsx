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
    
    addPassiveListeners();
    
    // Cleanup function
    return () => {
      // Remove listeners if needed (though passive listeners are generally fine to leave)
    };
  }, []);

  // This component doesn't render anything, it just handles side effects
  return null;
} 
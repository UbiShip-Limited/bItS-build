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
      // Force footer background consistency on mobile using CSS variables
      const footers = document.querySelectorAll('footer');
      footers.forEach(footer => {
        if (window.innerWidth <= 768) {
          (footer as HTMLElement).style.setProperty('background-color', 'var(--obsidian, #0A0A0A)', 'important');
        }
      });
      
      // Ensure FAQ text visibility using CSS variables
      const faqElements = document.querySelectorAll('#faq');
      faqElements.forEach(faq => {
        (faq as HTMLElement).style.setProperty('color', 'var(--foreground, #FAFAF9)', 'important');
      });
      
      // Enhance decorative elements visibility on mobile
      const decorativeLines = document.querySelectorAll('[class*="border-gold-500"]');
      decorativeLines.forEach(line => {
        const lineElement = line as HTMLElement;
        if (window.innerWidth <= 768) {
          lineElement.style.setProperty('border-opacity', '0.3', 'important');
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
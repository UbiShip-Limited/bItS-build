// Standardized animation configuration for consistent UX
export const animations = {
  // Timing constants
  timing: {
    fast: 0.3,        // Quick interactions (hover, small transitions)
    normal: 0.6,      // Standard transitions
    slow: 0.8,        // Major page transitions
    verySlow: 1.2     // Hero animations
  },
  
  // Easing curves
  easing: {
    default: [0.4, 0, 0.2, 1],      // Smooth ease-out
    bounce: [0.68, -0.55, 0.265, 1.55],
    sharp: [0.4, 0, 0.6, 1]
  },
  
  // Common animation variants
  variants: {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
      }
    },
    
    fadeInUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
      }
    },
    
    fadeInDown: {
      hidden: { opacity: 0, y: -20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
      }
    },
    
    scaleIn: {
      hidden: { scale: 0.9, opacity: 0 },
      visible: { 
        scale: 1, 
        opacity: 1,
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
      }
    },
    
    staggerContainer: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.08,
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1]
        }
      }
    }
  },
  
  // Viewport settings for scroll-triggered animations
  viewport: {
    once: true,
    margin: "-100px"
  },
  
  // Hover animations
  hover: {
    scale: 1.05,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
  },
  
  // Tap animations
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  }
}
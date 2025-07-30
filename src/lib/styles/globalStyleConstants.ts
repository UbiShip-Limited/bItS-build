// Global Style Constants for Bowen Island Tattoo Shop
// This file ensures consistent styling across all components

export const spacing = {
  // Base 8px grid system for Apple-like precision
  '0': '0',           // 0px
  '1': '0.5rem',      // 8px
  '2': '1rem',        // 16px
  '3': '1.5rem',      // 24px
  '4': '2rem',        // 32px
  '6': '3rem',        // 48px
  '8': '4rem',        // 64px
  '12': '6rem',       // 96px
  '16': '8rem',       // 128px
} as const;

export const typography = {
  // Simplified font system - Inter for everything except brand
  fontBrand: 'font-heading',        // Cinzel only for brand name
  fontUI: 'font-body',              // Lora for all UI text
  
  // Typography scale with 1.25 ratio
  textXs: 'text-xs',      // 12px
  textSm: 'text-sm',      // 14px
  textBase: 'text-base',  // 16px
  textLg: 'text-lg',      // 18px
  textXl: 'text-xl',      // 20px
  text2xl: 'text-2xl',    // 24px
  text3xl: 'text-3xl',    // 30px
  text4xl: 'text-4xl',    // 36px
  text5xl: 'text-5xl',    // 48px
  text6xl: 'text-6xl',    // 60px
  
  // Line heights
  leadingTight: 'leading-tight',      // 1.2 for headers
  leadingNormal: 'leading-normal',    // 1.5 for body
  leadingRelaxed: 'leading-relaxed',  // 1.625 for readability
  
  // Letter spacing (limited options)
  trackingTight: 'tracking-[-0.02em]',
  trackingNormal: 'tracking-[0]',
  trackingWide: 'tracking-[0.02em]',
  
  // Font weights
  fontLight: 'font-light',      // 300
  fontNormal: 'font-normal',    // 400
  fontMedium: 'font-medium',    // 500
  fontSemibold: 'font-semibold', // 600
  
  // Heading hierarchy - using sentence case
  h1: 'font-body text-5xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight tracking-[-0.02em]',
  h2: 'font-body text-4xl sm:text-4xl md:text-5xl font-semibold leading-tight tracking-[-0.02em]',
  h3: 'font-body text-3xl sm:text-3xl md:text-4xl font-medium leading-tight tracking-normal',
  h4: 'font-body text-2xl sm:text-2xl md:text-3xl font-medium leading-tight tracking-normal',
  
  // Paragraph styles
  paragraph: 'font-body text-lg leading-relaxed tracking-normal',
  paragraphLarge: 'font-body text-xl sm:text-2xl leading-relaxed tracking-normal',
  paragraphSmall: 'font-body text-base leading-normal tracking-normal'
} as const;

export const colors = {
  // Standardized opacity scale
  opacity: {
    full: '100',
    prominent: '90', 
    secondary: '70',
    muted: '50',
    subtle: '30',
    hint: '10',
  },
  
  // Text colors with consistent opacity
  textPrimary: 'text-white',
  textProminent: 'text-white/90',
  textSecondary: 'text-white/70',
  textMuted: 'text-white/50',
  textSubtle: 'text-white/30',
  
  // Accent colors
  textAccent: 'text-gold-500',
  textAccentProminent: 'text-gold-500/90',
  textAccentSecondary: 'text-gold-500/70',
  textAccentMuted: 'text-gold-500/50',
  
  // Backgrounds
  bgPrimary: 'bg-obsidian',
  bgSecondary: 'bg-obsidian/95',
  bgAccent: 'bg-gold-500',
  
  // Borders
  borderDefault: 'border-gold-500/30',
  borderHover: 'border-gold-500/50',
  borderSubtle: 'border-gold-500/10',
} as const;

export const effects = {
  // Simplified shadow system
  shadowLight: 'shadow-[0_1px_3px_rgba(0,0,0,0.1)]',
  shadowMedium: 'shadow-[0_4px_12px_rgba(0,0,0,0.1)]',
  shadowHeavy: 'shadow-[0_8px_24px_rgba(0,0,0,0.1)]',
  
  // Consistent transitions
  transitionFast: 'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
  transitionNormal: 'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
  transitionSlow: 'transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]',
  
  // Hover states
  hoverLift: 'hover:-translate-y-0.5',
  hoverGlow: 'hover:shadow-[0_0_20px_rgba(184,149,106,0.3)]',
} as const;

export const layout = {
  // Container widths
  containerSm: 'max-w-2xl',
  containerMd: 'max-w-4xl',
  containerLg: 'max-w-6xl',
  containerXl: 'max-w-7xl',
  
  // Consistent padding based on 8px grid
  padding: {
    mobile: 'px-4',      // 16px
    tablet: 'sm:px-6',   // 24px
    desktop: 'lg:px-8',  // 32px
  },
  
  // Section spacing
  sectionY: {
    small: 'py-8 md:py-12',   // 64px / 96px
    medium: 'py-12 md:py-16', // 96px / 128px
    large: 'py-16 md:py-24',  // 128px / 192px
  },
} as const;

export const components = {
  // Button styles - refined
  button: {
    base: 'font-body font-medium tracking-[0.02em] relative overflow-hidden inline-flex items-center justify-center rounded-lg',
    sizes: {
      small: 'px-4 py-2 text-sm',     // 32px height
      medium: 'px-6 py-3 text-base',  // 44px height  
      large: 'px-8 py-4 text-lg',     // 56px height
    },
    variants: {
      primary: `bg-gold-500 text-obsidian hover:bg-gold-400 ${effects.transitionNormal}`,
      secondary: `bg-transparent border ${colors.borderDefault} ${colors.textPrimary} hover:bg-gold-500/10 ${colors.borderHover} ${effects.transitionNormal}`,
      ghost: `bg-transparent ${colors.textSecondary} hover:${colors.textPrimary} ${effects.transitionNormal}`,
    }
  },
  
  // Input styles
  input: `w-full px-4 py-3 bg-white/5 border ${colors.borderSubtle} rounded-lg text-white placeholder-white/50 focus:outline-none focus:${colors.borderDefault} ${effects.transitionNormal}`,
  
  // Card styles
  card: `bg-obsidian/95 backdrop-blur-sm rounded-2xl border ${colors.borderSubtle} ${effects.shadowLight}`,
  
  // Ornamental elements - standardized
  ornament: {
    dot: 'w-2 h-2 bg-gold-500/30 rounded-full',
    line: 'h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent',
    lineShort: 'w-16 h-px bg-gradient-to-r from-gold-500/30 to-transparent',
    lineLong: 'w-32 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent',
  },
  
  // Border radius system
  radius: {
    small: 'rounded-lg',    // 8px
    medium: 'rounded-2xl',  // 16px
    large: 'rounded-3xl',   // 24px
  }
} as const;

// Utility function to combine classes
export const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};
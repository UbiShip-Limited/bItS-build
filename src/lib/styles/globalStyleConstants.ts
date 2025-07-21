// Global Style Constants for Bowen Island Tattoo Shop
// This file ensures consistent styling across all components

export const spacing = {
  // Base spacing scale (rem-based for accessibility)
  xs: '0.5rem',    // 8px
  sm: '1rem',      // 16px
  md: '1.5rem',    // 24px
  lg: '2rem',      // 32px
  xl: '3rem',      // 48px
  xxl: '4rem',     // 64px
  xxxl: '6rem',    // 96px
} as const;

export const typography = {
  // Font families
  fontHeading: 'font-heading',
  fontBody: 'font-body',
  
  // Letter spacing
  trackingTight: 'tracking-tight',
  trackingNormal: 'tracking-normal',
  trackingWide: 'tracking-wide',
  trackingWider: 'tracking-[0.15em]',
  trackingWidest: 'tracking-[0.2em]',
  
  // Font sizes with consistent scale
  textXs: 'text-xs',
  textSm: 'text-sm',
  textBase: 'text-base',
  textLg: 'text-lg',
  textXl: 'text-xl',
  text2xl: 'text-2xl',
  text3xl: 'text-3xl',
  text4xl: 'text-4xl',
  text5xl: 'text-5xl',
  text6xl: 'text-6xl',
  
  // Heading sizes responsive
  headingSm: 'text-2xl md:text-3xl',
  headingMd: 'text-3xl md:text-4xl lg:text-5xl',
  headingLg: 'text-4xl md:text-5xl lg:text-6xl',
} as const;

export const colors = {
  // Primary palette
  gold: 'gold',
  obsidian: 'obsidian',
  white: 'white',
  slate: 'slate',
  
  // Common color combinations
  textPrimary: 'text-white',
  textSecondary: 'text-white/80',
  textMuted: 'text-white/60',
  textAccent: 'text-gold',
  textAccentMuted: 'text-gold/80',
  
  bgPrimary: 'bg-obsidian',
  bgSecondary: 'bg-obsidian/95',
  bgAccent: 'bg-gold',
  
  borderDefault: 'border-gold/30',
  borderHover: 'border-gold',
  borderSubtle: 'border-gold/10',
} as const;

export const effects = {
  // Shadows
  shadowSubtle: 'shadow-subtle',
  shadowElegant: 'shadow-elegant',
  shadowSmoke: 'shadow-smoke',
  shadowSmokeLg: 'shadow-smoke-lg',
  
  // Transitions
  transitionAll: 'transition-all duration-300',
  transitionColors: 'transition-colors duration-300',
  transitionOpacity: 'transition-opacity duration-300',
  transitionTransform: 'transition-transform duration-300',
  
  // Hover states
  hoverScale: 'hover:scale-105',
  hoverScaleSubtle: 'hover:scale-102',
  hoverOpacity: 'hover:opacity-80',
  hoverBrightness: 'hover:brightness-110',
} as const;

export const layout = {
  // Container widths
  containerSm: 'max-w-2xl',
  containerMd: 'max-w-4xl',
  containerLg: 'max-w-6xl',
  containerXl: 'max-w-7xl',
  
  // Standard padding
  paddingMobile: 'px-6',
  paddingTablet: 'sm:px-8',
  paddingDesktop: 'md:px-12 lg:px-20',
  
  // Section spacing
  sectionPaddingY: 'py-16 md:py-24',
  sectionPaddingYLg: 'py-20 md:py-32',
} as const;

export const components = {
  // Button base styles
  buttonBase: `font-body uppercase ${typography.trackingWider} ${effects.transitionAll} relative overflow-hidden inline-flex items-center justify-center`,
  
  // Input styles
  inputBase: `w-full px-4 py-3 bg-white/5 border ${colors.borderDefault} rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-gold ${effects.transitionAll}`,
  
  // Card styles
  cardBase: `bg-obsidian/95 backdrop-blur-sm rounded-lg border ${colors.borderDefault} ${effects.shadowElegant}`,
  
  // Ornamental divider
  dividerHorizontal: 'h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent',
  dividerVertical: 'w-px bg-gradient-to-b from-transparent via-gold/60 to-transparent',
} as const;

// Utility function to combine classes
export const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};
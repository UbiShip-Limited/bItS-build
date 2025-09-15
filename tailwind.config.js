/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Refined base colors
        obsidian: "#0A0A0A", // Softened from pure black
        white: "#FAFAF9",    // Warm white, softer than pure white
        
        // Refined gold palette with subtle variations
        gold: {
          DEFAULT: "#B8956A", // Muted from #C9A449
          50: "#FAF7F2",      // Lightest gold tint
          100: "#F3EBDD",     // Soft champagne
          200: "#E6D4BB",     // Light gold
          300: "#D4B896",     // Soft gold
          400: "#C49E73",     // Medium gold
          500: "#B8956A",     // Default - refined gold
          600: "#9A7A54",     // Deep gold
          700: "#7D6243",     // Dark gold
          800: "#5C4831",     // Deepest gold
          900: "#3D2F20",     // Near black gold
        },
        
        // Refined neutral palette
        slate: {
          DEFAULT: "#4A4A48", // Warmed up from #444444
          50: "#F8F8F7",
          100: "#EFEFED",
          200: "#E2E2DF",
          300: "#CCCCC7",
          400: "#A8A8A2",
          500: "#7A7A74",
          600: "#5A5A56",
          700: "#4A4A48",
          800: "#3A3A38",
          900: "#2A2A28",
        },
        
        // Existing smoke palette (good as is)
        'smoke': {
          50: '#F7F8FA',   // Misty White - main background
          100: '#E8EAED',  // Smokey Light - card backgrounds
          200: '#DADCE0',  // Platinum - borders
          300: '#D2D4D7',  // Medium - inputs
          400: '#9AA0A6',  // Ash Grey - muted elements
          500: '#5F6368',  // Storm Grey - secondary text
          600: '#4A4D52',  // Graphite - interactive
          700: '#3C4043',  // Charcoal Smoke - primary text
          800: '#202124',  // Deep Smoke - sidebar
          900: '#171717',  // Obsidian - highest contrast
        }
      },
      fontFamily: {
        heading: ['"Cinzel"', 'serif'],
        body: ['"Lora"', 'serif'],
      },
      fontSize: {
        // Refined type scale for better hierarchy
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
      },
      fontWeight: {
        // More nuanced weight scale
        'thin': '100',
        'extralight': '200',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      boxShadow: {
        // Refined shadow system with multiple layers
        'elegant': '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.04)',
        'subtle': '0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.02)',
        'soft': '0 2px 4px rgba(0, 0, 0, 0.02), 0 4px 8px rgba(0, 0, 0, 0.02), 0 8px 16px rgba(0, 0, 0, 0.02)',
        'medium': '0 2px 4px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.04), 0 16px 32px rgba(0, 0, 0, 0.04)',
        'large': '0 4px 8px rgba(0, 0, 0, 0.04), 0 16px 32px rgba(0, 0, 0, 0.06), 0 24px 48px rgba(0, 0, 0, 0.08)',
        'gold-glow': '0 0 20px rgba(184, 149, 106, 0.1), 0 0 40px rgba(184, 149, 106, 0.05)',
        'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
        // Add missing shadows used in components
        'refined': '0 2px 8px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.08)',
        'refined-lg': '0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.1)',
        // Keep existing for backward compatibility
        'smoke': '0 2px 12px rgba(32, 33, 36, 0.08)',
        'smoke-lg': '0 8px 24px rgba(32, 33, 36, 0.12)',
        'smoke-xl': '0 12px 32px rgba(32, 33, 36, 0.16)',
      },
      borderRadius: {
        // Refined border radius scale
        'none': '0',
        'sm': '0.25rem',   // 4px
        'DEFAULT': '0.5rem', // 8px
        'md': '0.75rem',   // 12px
        'lg': '1rem',      // 16px
        'xl': '1.25rem',   // 20px
        '2xl': '1.5rem',   // 24px
        '3xl': '2rem',     // 32px
      },
      spacing: {
        // Consistent spacing rhythm
        '18': '4.5rem',
        '22': '5.5rem',
      },
      animation: {
        'fadeIn': 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'slideIn': 'slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'scaleIn': 'scaleIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'smooth-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'smooth-in': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      backgroundImage: {
        // Subtle gradient utilities
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-radial-soft': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'gold-shimmer': 'linear-gradient(90deg, transparent, rgba(184, 149, 106, 0.1), transparent)',
      },
    },
  },
  safelist: [
    // Status colors that might be dynamically generated
    'bg-gold-500/20',
    'text-gold-500',
    'border-gold-500/30',
    'bg-blue-500/20',
    'text-blue-400',
    'border-blue-500/30',
    'bg-green-500/20',
    'text-green-400',
    'border-green-500/30',
    'bg-red-500/20',
    'text-red-400',
    'border-red-500/30',
    'bg-orange-500/20',
    'text-orange-400',
    'border-orange-500/30',
    'bg-gray-500/20',
    'text-gray-400',
    'border-gray-500/30',
    'bg-white/10',
    'text-white/70',
    'border-gold-500/10',
    // Hover states
    'hover:text-gold-400',
    'hover:text-gold-500/90',
    'hover:bg-gold-400',
    'hover:border-gold-500/30',
    'hover:border-gold-500/50',
    'hover:text-white',
    'hover:bg-blue-500/30',
    'hover:bg-green-500/30',
    'hover:bg-red-500/30',
    'hover:bg-orange-500/30',
    'hover:bg-gray-500/30',
    'hover:text-white',
    // Common utility classes
    'text-white',
    'text-white/50',
    'text-white/90',
    'text-obsidian',
    'bg-obsidian/95',
    'font-body',
    'font-heading',
    'tracking-wide',
    'leading-tight',
    'leading-relaxed',
    'transition-all',
    'duration-300',
    'ease-[cubic-bezier(0.4,0,0.2,1)]',
    // Typography classes from globalStyleConstants
    'text-5xl',
    'text-6xl',
    'text-7xl',
    'text-4xl',
    'text-3xl',
    'text-2xl',
    'text-xl',
    'text-lg',
    'text-base',
    'sm:text-5xl',
    'sm:text-4xl',
    'sm:text-3xl',
    'sm:text-2xl',
    'md:text-7xl',
    'md:text-6xl',
    'md:text-5xl',
    'md:text-4xl',
    'md:text-3xl',
    'md:text-2xl',
    'md:text-xl',
    'md:text-lg',
    'lg:text-7xl',
    'font-light',
    'font-normal',
    'font-medium',
    'font-semibold',
    // Layout classes
    'max-w-2xl',
    'max-w-4xl',
    'max-w-6xl',
    'max-w-7xl',
    'px-4',
    'px-6',
    'px-8',
    'sm:px-6',
    'lg:px-8',
    'py-8',
    'py-12',
    'py-16',
    'py-24',
    'md:py-12',
    'md:py-16',
    'md:py-20',
    'md:py-24',
    'md:px-8',
    'md:px-10',
    // Component-specific classes
    'text-obsidian/60',
    'text-obsidian/70',
    'text-obsidian/90',
    'text-white/60',
    'text-white/70',
    'text-white/80',
    'bg-gold-500/5',
    'bg-gold-500/3',
    'bg-gold-500/10',
    'border-gold-500/5',
    'border-gold-500/20',
    'from-gold-500/10',
    'to-gold-500/5',
    'hover:border-gold-500/10',
    'hover:bg-gold-500/3',
    'dark:text-white',
    'dark:text-white/70',
    'dark:text-white/90',
    // Grid and flex classes
    'grid-cols-1',
    'sm:grid-cols-2',
    'md:grid-cols-2',
    'lg:grid-cols-3',
    'xl:grid-cols-4',
    'gap-6',
    'gap-8',
    'md:gap-8',
    'md:gap-12',
    'space-y-4',
    'md:space-y-5',
    // Mobile-specific classes
    'mb-4',
    'mb-6',
    'mb-8',
    'mb-16',
    'md:mb-20',
    'mt-4',
    'mt-16',
    'mr-3',
    'md:mr-4',
    'mx-5',
    'mx-6',
    'mx-auto',
    'md:mx-0',
    'max-w-md',
    'max-w-3xl',
    'max-w-4xl',
    // Shadows
    'shadow-soft',
    'shadow-subtle',
    'shadow-refined',
    'shadow-refined-lg',
    'hover:shadow-soft',
    'hover:shadow-refined-lg',
    // Text alignment
    'text-center',
    'md:text-left',
    // Opacity and transition classes
    'opacity-0',
    'opacity-100',
    'group-hover:opacity-50',
    'group-hover:opacity-100',
    'group-hover:bg-gold-500/10',
    'group-hover:bg-gold-500/8',
    'transition-opacity',
    'duration-600',
    'duration-800',
    'ease-smooth',
    // Position classes
    'relative',
    'absolute',
    'top-0',
    'right-0',
    'bottom-0',
    'left-0',
    'top-3',
    'left-3',
    'bottom-3',
    'right-3',
    'top-4',
    'left-4',
    'bottom-4',
    'right-4',
    // Transform classes
    'rotate-90',
    'rotate-0',
    'scale-0',
    'scale-100',
    'scale-[2]',
    // Background and border utilities
    'backdrop-blur-sm',
    'backdrop-blur-md',
    'bg-gradient-to-br',
    'bg-gradient-to-r',
    'bg-gradient-to-t',
    'from-obsidian/90',
    'to-obsidian/80',
    'from-transparent',
    'via-transparent',
    'to-transparent',
    'rounded-lg',
    'rounded-xl',
    'rounded-2xl',
    'rounded-3xl',
    'rounded-tl-lg',
    'rounded-tl-xl',
    'rounded-br-lg',
    'rounded-br-xl',
    // Width and height
    'w-2',
    'h-2',
    'w-4',
    'h-4',
    'w-5',
    'h-5',
    'w-6',
    'h-6',
    'w-16',
    'w-32',
    'w-40',
    'h-32',
    'h-40',
    'md:h-6',
    'md:w-6',
    // Padding classes for mobile
    'p-8',
    'p-10',
    'md:p-10',
    // Border widths
    'border',
    'border-t-2',
    'border-l-2',
    'border-b-2',
    'border-r-2',
    // Z-index
    'z-10',
    // Pointer events
    'pointer-events-none',
    // Cursor
    'cursor-pointer',
    // Overflow
    'overflow-hidden',
    // Flex utilities
    'flex',
    'flex-1',
    'flex-shrink-0',
    'items-start',
    'items-center',
    'justify-center',
    'md:justify-start',
    // Blur utilities
    'blur-sm',
    'blur-2xl',
    'blur-3xl',
    // Line heights
    'leading-tight',
    'leading-relaxed',
    // Inset
    'inset-0',
    // Specific component classes
    '-top-12',
    '-right-12'
  ],
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        bowen: {
          "primary": "#C9A449",
          "secondary": "#444444",
          "accent": "#080808",
          "neutral": "#FFFFFF",
          "base-100": "#FFFFFF",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        smokey: {
          "primary": "#5F6368",      // Storm Grey
          "primary-content": "#F7F8FA",
          "secondary": "#3C4043",    // Charcoal Smoke
          "secondary-content": "#F7F8FA",
          "accent": "#9AA0A6",       // Ash Grey
          "accent-content": "#171717",
          "neutral": "#202124",      // Deep Smoke
          "neutral-content": "#F7F8FA",
          "base-100": "#F7F8FA",     // Misty White (main bg)
          "base-200": "#E8EAED",     // Smokey Light (cards)
          "base-300": "#D2D4D7",     // Medium (inputs)
          "base-content": "#3C4043", // Primary text
          "info": "#3abff8",
          "info-content": "#002B3D",
          "success": "#36d399",
          "success-content": "#003320",
          "warning": "#fbbd23",
          "warning-content": "#382800",
          "error": "#f87272",
          "error-content": "#470000",
        }
      },
    ],
  },
};
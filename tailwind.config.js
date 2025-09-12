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
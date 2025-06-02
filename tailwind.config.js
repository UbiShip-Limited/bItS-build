/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: "#080808", // Primary text, nav, footer
        white: "#FFFFFF",    // Background, form cards, layout
        gold: "#C9A449",     // Accent text, buttons, icons
        slate: "#444444",    // Borders, muted text, secondary
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
        body: ['"Lora"', 'sans-serif'],
      },
      boxShadow: {
        'elegant': '0 4px 12px rgba(8, 8, 8, 0.08)',
        'subtle': '0 2px 4px rgba(8, 8, 8, 0.04)',
        'smoke': '0 2px 12px rgba(32, 33, 36, 0.08)',
        'smoke-lg': '0 8px 24px rgba(32, 33, 36, 0.12)',
        'smoke-xl': '0 12px 32px rgba(32, 33, 36, 0.16)',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'slideIn': 'slideIn 0.3s ease-out',
        'scaleIn': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
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
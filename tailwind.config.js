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
      },
      fontFamily: {
        heading: ['"Cinzel"', 'serif'],
        body: ['"Lora"', 'sans-serif'],
      },
      boxShadow: {
        'elegant': '0 4px 12px rgba(8, 8, 8, 0.08)',
        'subtle': '0 2px 4px rgba(8, 8, 8, 0.04)',
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
      },
    ],
  },
}; 
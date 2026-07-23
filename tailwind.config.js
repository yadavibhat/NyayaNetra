/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        "error": "#ba1a1a",
        "primary": "#00152f",
        "primary-container": "#0f2a4a",
        "primary-fixed": "#d4e3ff",
        "on-primary": "#ffffff",
        "on-primary-container": "#7a92b7",
        "secondary": "#7d5700",
        "secondary-container": "#ffc55f",
        "secondary-fixed": "#ffdeaa",
        "on-secondary-container": "#755100",
        "tertiary": "#0e1621",
        "tertiary-container": "#232a36",
        "surface": "#faf9fc",
        "surface-container": "#efedf0",
        "surface-container-low": "#f4f3f6",
        "surface-container-high": "#e9e7eb",
        "surface-container-highest": "#e3e2e5",
        "surface-container-lowest": "#ffffff",
        "on-surface": "#1a1c1e",
        "on-surface-variant": "#43474e",
        "outline": "#74777f",
        "outline-variant": "#c4c6cf",
        "gold-accent": "#D9A441",
        "navy-deep": "#0F2A4A",
        "brand-gray": "#6B7280"
      },
      width: {
        "88": "22rem",
        "sidebar-width": "280px"
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "xs": "0 1px 2px 0 rgb(0 0 0 / 0.05)"
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "gutter": "20px",
        "sm": "12px",
        "lg": "24px",
        "xs": "8px",
        "xl": "32px",
        "md": "16px",
        "base": "4px",
        "sidebar-width": "280px"
      },
      fontFamily: {
        "sans": ["Inter", "Noto Sans Kannada", "sans-serif"]
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1fbf4",
          100: "#def7e5",
          200: "#bfedcc",
          300: "#8fdea8",
          400: "#57c77d",
          500: "#2fab5c",
          600: "#218c4a",
          700: "#1d6f3d",
          800: "#1b5834",
          900: "#17482c",
        },
        /* Warm market editorial palette */
        cream: {
          50: "#fdfbf6",
          100: "#faf6ee",
          200: "#f5eee0",
          300: "#efe4d0",
          400: "#e5d5b8",
        },
        ink: {
          500: "#5a6b5f",
          600: "#3f4f44",
          700: "#2d3a31",
          800: "#1f2a24",
          900: "#161e19",
        },
        accent: {
          300: "#f2c879",
          400: "#e8a33d",
          500: "#d98c26",
          600: "#b9741d",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        sticker: "0 2px 0 rgba(0,0,0,0.12), 0 6px 14px -4px rgba(0,0,0,0.15)",
        arch: "0 12px 28px -12px rgba(31,42,36,0.25)",
      },
    },
  },
  plugins: [],
};

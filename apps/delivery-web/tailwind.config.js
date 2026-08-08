/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
        "card-hover": "0 10px 25px -8px rgb(33 140 74 / 0.25)",
      },
    },
  },
  plugins: [],
}

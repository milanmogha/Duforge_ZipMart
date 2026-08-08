/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefaf1",
          100: "#d7f3df",
          200: "#b1e7c4",
          300: "#82d6a1",
          400: "#4ac76f",
          500: "#2fae57",
          600: "#238c45",
          700: "#1f7039",
          800: "#1d5930",
          900: "#194929",
        },
        surface: {
          DEFAULT: "#f7f8fa",
          card: "#ffffff",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)",
        "card-hover":
          "0 8px 24px rgba(16, 24, 40, 0.1), 0 2px 6px rgba(16, 24, 40, 0.05)",
      },
      screens: {
        // Desktop/mobile split for the shopkeeper portal sidebar
        // (previously handled by a JS window.innerWidth check at 900px)
        "md-portal": "900px",
      },
    },
  },
  plugins: [],
};

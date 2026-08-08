/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#E9FBEF",
          100: "#C8F5D5",
          200: "#93E9AC",
          300: "#5AD980",
          400: "#27C258",
          500: "#0C831F",
          600: "#0A6E1A",
          700: "#085815",
          800: "#064310",
          900: "#04300B",
        },
        accent: "#FFD100",
        danger: "#E11D48",
        ink: "#111827",
        muted: "#6B7280",
        line: "#E5E7EB",
        surface: "#F6F7F9",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: "#f0faf4",
          100: "#d1f2e0",
          200: "#a3e4c1",
          300: "#6dd09d",
          400: "#3ab878",
          500: "#1d9e5e",
          600: "#0f6e42",
          700: "#0d5c38",
          800: "#0b4a2d",
          900: "#083b24",
        },
        sand: {
          50: "#faf8f4",
          100: "#f2efe8",
          200: "#e8e4d8",
          300: "#d4cfc0",
          400: "#b8b2a3",
          500: "#9c9588",
        },
        coral: { 400: "#E24B4A", 500: "#c43a39" },
        amber: { 400: "#EF9F27", 500: "#d48b1a" },
      },
      fontFamily: {
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

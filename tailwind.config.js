/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Adding Book Antiqua with standard serif fallbacks
        antiqua: ['"Book Antiqua"', 'Palatino', '"Palatino Linotype"', '"Palatino LT STD"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pulse: {
          dark: '#0B0F19',
          card: '#131B2E',
          accent: '#3B82F6',
          online: '#10B981',
          offline: '#EF4444'
        }
      }
    },
  },
  plugins: [],
}

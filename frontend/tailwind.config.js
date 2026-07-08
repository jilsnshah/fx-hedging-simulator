/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        card: 'rgba(30, 41, 59, 0.7)',
        primary: '#3b82f6',
        accent: '#8b5cf6',
        success: '#10b981',
        danger: '#ef4444',
      }
    },
  },
  plugins: [],
}

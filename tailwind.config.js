/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#FF7A18',
          dark: '#AF002D',
        },
        indigo: {
          500: '#4F46E5',
        },
      },
      boxShadow: {
        card: '0 8px 24px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: '0.8' },
          '70%, 100%': { transform: 'scale(1.4)', opacity: '0' },
        },
      },
      animation: {
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
} 
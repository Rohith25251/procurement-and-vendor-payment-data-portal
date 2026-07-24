/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0284C7',
          600: '#0369A3', // Primary Procurement Blue
          700: '#035384',
          800: '#07466E',
          900: '#0C3A5A',
        },
        secondary: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#22C55E',
          600: '#18A303', // Secondary Success Green
          700: '#15803D',
        },
        slate: {
          850: '#1E293B',
          900: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'glow': '0 0 15px rgba(3, 105, 163, 0.15)',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Add custom animation keyframes
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        }
      },
      // Add custom animation classes
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'pulse-subtle': 'pulse-subtle 2s infinite',
      },
      // Add custom colors
      colors: {
        'primary': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      // Add custom box shadow
      boxShadow: {
        'card': '0 2px 4px rgba(0,0,0,0.05), 0 4px 8px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 8px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
};
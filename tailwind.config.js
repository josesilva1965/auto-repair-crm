/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        primary: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          500: '#F97316',
          600: '#EA580C',
          900: '#7C2D12',
          DEFAULT: '#F97316',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          500: '#737373',
          900: '#171717',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.1)',
        float: '0 10px 15px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

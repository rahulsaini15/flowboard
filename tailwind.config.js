/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        panel: '1rem',
      },
      boxShadow: {
        panel: '0 12px 32px -20px rgba(20, 30, 60, 0.3)',
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6258e8',
          600: '#5145d6',
          700: '#4035b9',
        },
        ink: {
          900: '#20223a',
          700: '#555971',
          500: '#85899e',
          300: '#dfe1eb',
          100: '#f3f4f8',
        },
      },
    },
  },
  plugins: [],
}

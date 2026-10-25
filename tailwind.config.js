/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        // Calm, Islamic-inspired but modern palette
        sage: {
          50: '#f3f6f4',
          100: '#e2ebe5',
          200: '#c6d8cc',
          300: '#9ebcaa',
          400: '#6f9a82',
          500: '#4e7d63',
          600: '#3b644e',
          700: '#315040',
          800: '#294135',
          900: '#23362d',
        },
        gold: {
          400: '#d4b483',
          500: '#c79a52',
        },
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        fadein: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        grow: {
          '0%': { width: '0%' },
        },
        pop: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        fadein: 'fadein 0.35s ease-out',
        pop: 'pop 0.25s ease-out',
      },
    },
  },
  plugins: [],
}

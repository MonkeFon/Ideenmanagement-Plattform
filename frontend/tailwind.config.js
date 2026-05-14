/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef4ff',
          100: '#dbe7ff',
          200: '#bfd2ff',
          300: '#92b4ff',
          400: '#618cff',
          500: '#3a66ff',
          600: '#2748f5',
          700: '#1f37c8',
          800: '#1d319f',
          900: '#1c2f7e',
        },
        surface: {
          DEFAULT: '#fafbfc',
          subtle:  '#f3f5f7',
          border:  '#e3e6ea',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.04), 0 4px 12px rgba(16,24,40,0.06)',
      },
    },
  },
  plugins: [],
}

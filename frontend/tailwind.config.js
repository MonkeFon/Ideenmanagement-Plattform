/** @type {import('tailwindcss').Config} */
// Linear/Vercel-inspired token set: brand is just slate (no saturated accent),
// shadows are virtually absent, one default radius.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // `brand-*` is kept as an alias for slate so legacy class names continue to work
        // without saturated colour creeping back in.
        brand: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#0f172a',
          700: '#0f172a',
          800: '#020617',
          900: '#020617',
        },
        surface: {
          DEFAULT: '#ffffff',
          subtle:  '#f8fafc',
          border:  '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      boxShadow: {
        // Only used on the mobile drawer overlay; cards/buttons have no shadow.
        overlay: '0 8px 32px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
}

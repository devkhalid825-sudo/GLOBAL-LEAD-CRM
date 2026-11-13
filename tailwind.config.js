/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas: 'var(--canvas)',
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
        },
        border: {
          DEFAULT: 'var(--border)',
          hairline: 'var(--hairline)',
        },
        tx: {
          DEFAULT: 'var(--text)',
          muted: 'var(--muted)',
          subtle: 'var(--subtle)',
        },
        row: {
          hover: 'var(--row-hover)',
        },
        btn: {
          DEFAULT: 'var(--btn)',
          text: 'var(--btn-text)',
        },
        mono: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          850: '#1A1A1A',
          900: '#121212',
          950: '#0A0A0A',
          black: '#000000',
          white: '#FFFFFF',
        },
      },
      boxShadow: {
        luxury: 'var(--shadow)',
      },
      borderRadius: {
        btn: '12px',
        card: '20px',
        modal: '28px',
        pill: '9999px',
      },
      letterSpacing: {
        tightest: '-0.02em',
      },
    },
  },
  plugins: [],
};

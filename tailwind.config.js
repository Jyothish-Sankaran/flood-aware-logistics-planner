/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        safe: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          bg: '#064e3b',
          border: '#059669',
          text: '#34d399',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          bg: '#78350f',
          border: '#d97706',
          text: '#fbbf24',
        },
        critical: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          bg: '#7f1d1d',
          border: '#dc2626',
          text: '#f87171',
        },
        info: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          bg: '#0c4a6e',
          border: '#0284c7',
          text: '#38bdf8',
        },
        command: {
          950: '#090d16',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

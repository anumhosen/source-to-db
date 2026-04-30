/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: { gray: { 850: '#1a1b2e', 950: '#030712' } },
      fontSize: { '2xs': ['0.625rem', { lineHeight: '0.75rem' }] },
      spacing: { 18: '4.5rem' },
      animation: { 'spin-slow': 'spin 3s linear infinite' },
      typography: { DEFAULT: { css: { maxWidth: 'none' } } },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

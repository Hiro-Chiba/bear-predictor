import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './src/app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans JP"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          50: '#f2f6f8',
          100: '#d9e6ee',
          200: '#b4cddc',
          300: '#8fb4ca',
          400: '#6a9bb8',
          500: '#4a82a3',
          600: '#386684',
          700: '#284a63',
          800: '#1a2f42',
          900: '#0d1724',
        },
      },
    },
  },
  plugins: [],
};

export default config;

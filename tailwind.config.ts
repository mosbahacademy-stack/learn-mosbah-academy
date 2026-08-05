import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/features/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0f4f8c',
          foreground: '#ffffff'
        },
        'brand-deep': '#0b1f48',
        accent: '#f58220',
        surface: '#f7f9fc',
        ink: '#0b1533'
      },
      fontFamily: {
        sans: ['var(--font-cairo)', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        glow: '0 26px 90px rgba(11, 31, 72, 0.33)'
      },
      backgroundImage: {
        'brand-radial': 'radial-gradient(circle at top right, rgba(15,79,140,0.22), transparent 40%), radial-gradient(circle at bottom left, rgba(245,130,32,0.16), transparent 35%)'
      }
    }
  },
  plugins: [animate]
};

export default config;
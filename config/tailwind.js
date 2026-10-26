import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Tokens from the "Ratio New Design — Admin panel" design system (ratio-website/src/app/globals.css, exact values).
 * The kit reads only these. Feature code never uses raw hex, px or arbitrary values (lint).
 * Semantic names (bg, ink, accent, critical…) map onto the design's palette so every existing class picks up the look.
 */
export default {
  content: [path.join(root, 'index.html'), path.join(root, 'src/**/*.{ts,tsx}')],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      // semantic
      bg: '#F7F9FB',
      surface: '#FFFFFF',
      ink: '#131927',
      muted: '#545969',
      faint: '#667691',
      line: '#ECF1F6',
      accent: { DEFAULT: '#3F53FE', ink: '#2E40E3', soft: '#DDE0FF' },
      critical: { DEFAULT: '#B42318', soft: '#FEF3F2', line: '#FDA29B' },
      warning: { DEFAULT: '#E88B00', ink: '#B26A00', soft: '#FFF3E2', line: '#F7A62D' },
      success: { DEFAULT: '#217005', soft: '#EAFCDD', line: '#A8F170' },
      neutral: { DEFAULT: '#3C4F69', soft: '#ECF1F6' },
      // design-system scale (exact names, for the kit)
      a: {
        blue: { DEFAULT: '#3F53FE', 700: '#2E40E3', 100: '#DDE0FF' },
        ink: { 900: '#131927', 800: '#1A2C44', 700: '#273951', 600: '#344054', 550: '#3C4F69', 500: '#545969', 450: '#667691' },
        line: { 100: '#ECF1F6', 150: '#DDE5EE', 200: '#E5E7EA', 250: '#E8E8E8', 300: '#E3E9F0' },
        page: '#F7F9FB',
        ok: { DEFAULT: '#217005', bg: '#EAFCDD', line: '#A8F170' },
        warn: { DEFAULT: '#E88B00', bg: '#FFF3E2', line: '#F7A62D' },
        danger: { DEFAULT: '#B42318', bg: '#FEF3F2', line: '#FDA29B' },
        arya: { DEFAULT: '#D9468F', ink: '#C2417F', soft: '#FFF4F7', line: '#F5C6D8' },
        green: '#36A800',
        google: '#1A0DAB',
      },
    },
    fontSize: {
      '2xs': ['11px', { lineHeight: '16px' }],
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['13px', { lineHeight: '18px' }],
      base: ['14px', { lineHeight: '20px' }],
      md: ['16px', { lineHeight: '24px' }],
      lg: ['18px', { lineHeight: '24px' }],
      xl: ['20px', { lineHeight: '28px' }],
      '2xl': ['22px', { lineHeight: '32px', letterSpacing: '-0.4px' }],
      '3xl': ['26px', { lineHeight: '32px', letterSpacing: '-0.4px' }],
      '4xl': ['28px', { lineHeight: '36px', letterSpacing: '-0.4px' }],
      '5xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.6px' }],
    },
    borderRadius: { none: '0', xs: '3px', sm: '4px', DEFAULT: '6px', md: '8px', lg: '10px', xl: '16px', '2xl': '24px', full: '999px' },
    boxShadow: {
      none: 'none',
      ring: 'inset 0 0 0 1px #ECF1F6, 0 0 0 1px #ECF1F6',
      'ring-focus': 'inset 0 0 0 1px #3F53FE, 0 0 0 1px #3F53FE',
      'ring-accent': 'inset 0 0 0 1px #3F53FE, 0 0 0 1px #3F53FE',
      'ring-line': 'inset 0 0 0 1px #DDE5EE',
      'ring-soft': 'inset 0 0 0 1px #E8E8E8',
      'ring-critical': 'inset 0 0 0 1px #FDA29B',
      'ring-arya': 'inset 0 0 0 1px #F5C6D8',
      'ring-ok': 'inset 0 0 0 1px #A8F170',
      'ring-warn': 'inset 0 0 0 1px #F7A62D',
      card: '0 0 0 1px #E3E9F0',
      hairline: '0 1px 0 #ECF1F6',
      menu: '0 0 0 1px #E3E9F0, 0 12px 32px -12px rgba(19,25,39,0.18)',
      pop: '0 0 0 1px #E3E9F0, 0 16px 40px -12px rgba(19,25,39,0.22)',
      modal: '0 0 0 1px #E3E9F0, 0 24px 48px -16px rgba(19,25,39,0.3)',
      lift: '0 0 0 1px #DDE5EE, 0 8px 20px -12px rgba(19,25,39,0.3)',
      bar: '0 12px 32px -12px rgba(19,25,39,0.28), 0 0 0 1px #E3E9F0',
      composer: '0 0 0 1px #E3E9F0, 0 24px 48px -24px rgba(124,92,240,0.35)',
      thumb: '0 0 0 1px #ECF1F6',
      lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    },
    extend: {
      fontFamily: { sans: ['Inter', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'], mono: ['ui-monospace', 'Menlo', 'monospace'] },
      spacing: { 4.5: '18px', 7.5: '30px', 13: '52px', 15: '60px', 60: '240px', 100: '400px' },
      maxWidth: { page: '1180px', hero: '760px', sheet: '760px', 'sheet-wide': '1100px', login: '400px', guide: '320px', mock: '280px', note: '360px' },
      minHeight: { hero: 'min(520px, calc(100vh - 220px))', card: '360px' },
      height: { 18: '72px' },
      letterSpacing: { label: '0.4px' },
      keyframes: {
        'a-pagein': { from: { opacity: '0' }, to: { opacity: '1' } },
        'a-up': { from: { opacity: '0', transform: 'translateY(6px)' }, to: { opacity: '1', transform: 'none' } },
        'a-dd': { from: { opacity: '0', transform: 'translateY(-4px)' }, to: { opacity: '1', transform: 'none' } },
        'a-spin': { to: { transform: 'rotate(360deg)' } },
        'a-sweep': { '0%': { backgroundPosition: '120% 0' }, '100%': { backgroundPosition: '-80% 0' } },
        'a-grow': { '0%, 100%': { transform: 'scaleY(0.15)' }, '50%': { transform: 'scaleY(1)' } },
        'a-fill': { '0%': { transform: 'translateX(-105%)' }, '55%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(105%)' } },
      },
      animation: {
        pagein: 'a-pagein 240ms ease-out',
        up: 'a-up 160ms ease-out',
        dd: 'a-dd 120ms ease-out',
        'spin-slow': 'a-spin 1.2s linear infinite',
        'spin-fast': 'a-spin 0.7s linear infinite',
        sweep: 'a-sweep 1.3s linear infinite',
      },
      transitionDuration: { 120: '120ms' },
    },
  },
  plugins: [],
};

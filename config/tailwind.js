import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Tokens live here; the kit reads only these. Feature code never uses raw hex (lint). */
export default {
  content: [path.join(root, 'index.html'), path.join(root, 'src/**/*.{ts,tsx}')],
  theme: {
    colors: {
      transparent: 'transparent',
      bg: '#F7F8F6',
      surface: '#FFFFFF',
      ink: '#1B2430',
      muted: '#5C6673',
      line: '#DDE2E0',
      accent: { DEFAULT: '#0E6B57', ink: '#0A4A3D', soft: '#E3F0EB' },
      critical: { DEFAULT: '#A83A3A', soft: '#FBECEC' },
      warning: { DEFAULT: '#8A5A00', soft: '#FFF6E0' },
      success: { DEFAULT: '#0E6B57', soft: '#E3F0EB' },
      neutral: { DEFAULT: '#5C6673', soft: '#EEF1EE' },
    },
    borderRadius: { none: '0', sm: '4px', DEFAULT: '8px', lg: '12px', full: '999px' },
    extend: { fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['ui-monospace', 'Menlo', 'monospace'] } },
  },
  plugins: [],
};

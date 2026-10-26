import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** All tool config lives in config/. Paths resolve from this file; the project root (index.html, src/) stays the cwd. */
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

export default defineConfig({
  root,
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(root, 'src') } },
  css: { postcss: here }, // config/postcss.config.js
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0') },
  server: { port: 5173 },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(here, 'vitest.setup.ts')],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});

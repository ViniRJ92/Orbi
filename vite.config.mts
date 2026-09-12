/**
 * Build do renderer (interface React) via Vite. O processo principal
 * (src/main) é empacotado separadamente pelo esbuild (scripts/build-main.mjs).
 * O CSS passa pelo PostCSS com Tailwind v3 (ver tailwind.config.cjs), que usa
 * exatamente os tokens do design system do Stitch.
 *
 * Orbi — Criado por Vinicius Braga
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const rootDir = import.meta.dirname;

export default defineConfig({
  root: resolve(rootDir, 'src/renderer'),
  base: './',
  plugins: [react()],
  css: {
    postcss: resolve(rootDir, 'postcss.config.cjs'),
  },
  build: {
    outDir: resolve(rootDir, 'dist/renderer'),
    emptyOutDir: true,
  },
});

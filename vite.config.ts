import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  // the plugin is served from a folder on GitHub Pages, so every path is relative
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  test: { environment: 'jsdom', include: ['src/**/*.spec.ts'] },
});

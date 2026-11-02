import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // npm scripts run from the repo root; root resolves relative to it.
  root: 'webui',
  plugins: [react(), tailwindcss()],
  build: { outDir: '../dist/webui', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
});

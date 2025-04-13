import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // open: true,
    // host: '0.0.0.0',
    port: 3000
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        game: './game.html'
      }
    },
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game.html'),
        // --- Minigame iframe entries ---
        boatGrow: resolve(__dirname, 'src/gamification/game-overlays/boatGrow/boatGrow.html'),
        fishPunch: resolve(__dirname, 'src/gamification/game-overlays/fishPunch/fishPunch.html'),
        fishBounce: resolve(__dirname, 'src/gamification/game-overlays/fishBounce/fishBounce.html'),
        safehouse: resolve(__dirname, 'src/gamification/game-overlays/safehouse/safehouse.html'),
        shopFisher: resolve(__dirname, 'src/gamification/game-overlays/shopFisher/shopFisher.html'),
        tutorial: resolve(__dirname, 'src/gamification/game-overlays/tutorial.html'),
        inventory: resolve(__dirname, 'src/gamification/game-overlays/inventory.html')
      }
    }
  }
})
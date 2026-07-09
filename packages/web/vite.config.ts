import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import imagemin from 'vite-plugin-imagemin';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    imagemin({
      verbose: false,
      mozjpeg: { quality: 80 },
      optipng: { optimizationLevel: 3 },
      webp: {
        quality: 80,
        method: 6,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@mbt/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});

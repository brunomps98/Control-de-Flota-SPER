// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // ¡Añade esta sección "server"!
  server: {
    proxy: {
      // Cualquier petición que empiece con /api...
      '/api': {
        target: 'http://localhost:8080', // ...será redirigida a tu backend
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'public/dist',
    manifest: true,
    rollupOptions: {
      input: 'src/react/main.jsx',
    },
  },
});
// Archivo de configuración de Vite

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Configuramos un "túne2 para conectar con el Backend (localhost:8080) 
  // Evitando así errores de cors mientras programamos en local 
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  // Al compilar, el resultado va a la carpeta dist
  build: {
    outDir: 'dist',
    manifest: true,
  },
});
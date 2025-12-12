// Archivo de configuración de Vite
// Configura el servidor de desarrollo y la compilación del proyecto

// Importamos las funciones necesarias desde Vite y el plugin de React
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Exportamos la configuración de Vite
export default defineConfig({
  plugins: [react()],

  // Configuramos un proxy para redirigir las peticiones del frontend
  // que empiezan con /api hacia el backend (localhost:8080)
  // Esto evita errores de CORS en desarrollo. 
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
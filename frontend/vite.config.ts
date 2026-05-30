import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // En desarrollo: redirige /api → backend Express local
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  define: {
    // En producción (Vercel): la API está en el mismo dominio → string vacío
    // En desarrollo: usa el proxy de arriba → string vacío también
    'import.meta.env.VITE_API_BASE': JSON.stringify(''),
  },
})


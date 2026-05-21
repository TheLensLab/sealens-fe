import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: 'all',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    proxy: {
      '/api': 'http://localhost:5001',
      '/files': 'http://localhost:5001',
      '/stream': 'http://localhost:5001',
      '/check_progress': 'http://localhost:5001',
      '/upload': 'http://localhost:5001',
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: 'all',
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
})

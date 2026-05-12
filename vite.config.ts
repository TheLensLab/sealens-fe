import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5001',
      '/files': 'http://localhost:5001',
      '/stream': 'http://localhost:5001',
      '/check_progress': 'http://localhost:5001',
      '/upload': 'http://localhost:5001',
    },
  },
})

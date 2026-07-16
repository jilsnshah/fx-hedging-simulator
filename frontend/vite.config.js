import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Routes are declared with the /api prefix, so pass the path through
      // unchanged — the backend matches it verbatim, same as on Vercel.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})

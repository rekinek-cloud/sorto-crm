import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 3000,
    strictPort: false, // If port 3000 is busy, try next available
  },
  preview: {
    host: '0.0.0.0', // Allow external connections for preview
    port: 4173,
    strictPort: false,
  }
})

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Sends /api requests to the Laravel server during development
  server: { proxy: { '/api': 'http://localhost:8000' } },
})
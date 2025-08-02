import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 允许外部访问
    port: 5173,
    allowedHosts: true, // 允许所有域名访问
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001', // 改回localhost，因为前后端在同一台机器
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})

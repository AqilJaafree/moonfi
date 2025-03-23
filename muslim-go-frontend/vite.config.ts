import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      // Use this if behind a proxy or having issues with WebSockets
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173, // Add this to avoid WebSocket mismatches
    },
    watch: {
      usePolling: true, // Enable this if file changes aren't detected
    },
  },
})
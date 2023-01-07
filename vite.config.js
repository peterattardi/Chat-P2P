import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Chat-P2P/',
  server: {
    port: 3000
  },
  optimizeDeps: {
    exclude: ['firebase', 'firebase/app', 'firebase/firestore']
  }
})

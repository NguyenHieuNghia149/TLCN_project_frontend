import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('monaco-editor') || id.includes('@monaco-editor')) {
              return 'vendor-monaco'
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer'
            }
            if (id.includes('recharts') || id.includes('chart.js')) {
              return 'vendor-charts'
            }
            if (id.includes('@tinymce')) {
              return 'vendor-tinymce'
            }
            if (
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('@remix-run')
            ) {
              return 'vendor-react'
            }
            if (id.includes('@reduxjs') || id.includes('react-redux')) {
              return 'vendor-redux'
            }
            if (id.includes('mammoth')) {
              return 'vendor-mammoth'
            }
          }
        },
      },
    },
  },
})

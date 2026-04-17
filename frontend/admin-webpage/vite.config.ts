import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          const modulePath = id.split('node_modules/')[1]
          if (!modulePath) return 'vendor-misc'

          const parts = modulePath.split('/')
          const packageName = parts[0].startsWith('@')
            ? `${parts[0]}/${parts[1]}`
            : parts[0]

          if (['react', 'react-dom', 'scheduler'].includes(packageName)) {
            return 'react-vendor'
          }

          if (
            packageName.startsWith('@mui/') ||
            packageName.startsWith('@emotion/') ||
            packageName === '@popperjs/core'
          ) {
            return 'mui-vendor'
          }

          if (
            packageName.startsWith('@radix-ui/') ||
            ['cmdk', 'sonner', 'vaul'].includes(packageName)
          ) {
            return 'ui-vendor'
          }

          if (['recharts', 'date-fns'].includes(packageName)) {
            return 'charts-vendor'
          }

          return 'vendor-misc'
        },
      },
    },
  },
})

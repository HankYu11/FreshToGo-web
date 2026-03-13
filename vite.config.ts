import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildHash = Date.now().toString(36)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'favicon-cache-bust',
      transformIndexHtml(html) {
        return html.replaceAll('__BUILD_HASH__', buildHash)
      },
    },
  ],
})

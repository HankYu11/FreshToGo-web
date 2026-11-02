import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildHash = Date.now().toString(36)

// The dev API allows https origins only (MysteryBox-ktor `configureCors` passes
// `schemes = listOf("https")`), so a browser on http://localhost is refused by CORS no matter
// which host is on the allow-list. The dev server proxies /api there instead, and
// `__DEV_API_PROXY__` tells the client to use same-origin URLs while that proxy is in front of it.
// Override with VITE_API_PROXY_TARGET to point the dev server at a backend running locally.
const DEV_API_TARGET = process.env.VITE_API_PROXY_TARGET || 'https://dev-api.handyla.co'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => ({
  plugins: [
    react(),
    {
      name: 'favicon-cache-bust',
      transformIndexHtml(html) {
        return html.replaceAll('__BUILD_HASH__', buildHash)
      },
    },
    {
      // Production invites crawlers and points them at the sitemap; the dev deploy keeps them out.
      name: 'robots-txt',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'robots.txt',
          source:
            mode === 'development'
              ? 'User-agent: *\nDisallow: /\n'
              : 'User-agent: *\nAllow: /\n\nSitemap: https://handyla.co/sitemap.xml\n',
        })
      },
    },
  ],
  define: {
    __DEV_API_PROXY__: JSON.stringify(command === 'serve'),
  },
  server: {
    proxy: {
      '/api': {
        target: DEV_API_TARGET,
        changeOrigin: true,
      },
      // Listing photos can come back as server-relative paths (/uploads/images/...).
      '/uploads': {
        target: DEV_API_TARGET,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: mode === 'development' ? 'dist/dev' : 'dist/prod',
  },
}))

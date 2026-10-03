import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildHash = Date.now().toString(36)

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
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
  build: {
    outDir: mode === 'development' ? 'dist/dev' : 'dist/prod',
  },
}))

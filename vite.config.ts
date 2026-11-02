import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = dirname(fileURLToPath(import.meta.url))

const buildHash = Date.now().toString(36)

// The dev API allows https origins only (MysteryBox-ktor `configureCors` passes
// `schemes = listOf("https")`), so a browser on http://localhost is refused by CORS no matter
// which host is on the allow-list. The dev server proxies /api there instead, and
// `__DEV_API_PROXY__` tells the client to use same-origin URLs while that proxy is in front of it.
// Override with VITE_API_PROXY_TARGET to point the dev server at a backend running locally.
const DEV_API_TARGET = process.env.VITE_API_PROXY_TARGET || 'https://dev-api.handyla.co'

/**
 * Drop the browser's Origin before the request leaves the proxy.
 *
 * The backend runs Ktor's CORS plugin, which answers 403 to an Origin it does not allow — and
 * the allow-list is https hosts, so every proxied request arrived stamped http://localhost and
 * was refused. Between the dev server and the API there is no origin to speak of, so the header
 * has no business being forwarded at all.
 */
const stripBrowserOrigin: NonNullable<ProxyOptions['configure']> = (proxy) => {
  proxy.on('proxyReq', (proxyReq) => {
    proxyReq.removeHeader('origin')
  })
}

function entryPoints(mode: string): Record<string, string> {
  const entries: Record<string, string> = { main: resolve(__dirname, 'index.html') }
  if (mode === 'development') {
    entries.easywallet = resolve(__dirname, 'easywallet.html')
  }
  return entries
}

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
      // The webview is served from its own HTML entry (see easywallet.html). Vite's dev server
      // only knows the file by its real name, so map the routes onto it the way Firebase
      // Hosting's rewrite does in a deploy.
      name: 'easywallet-dev-entry',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const path = req.url?.split('?')[0]
          if (path === '/easywallet' || path?.startsWith('/easywallet/')) {
            req.url = '/easywallet.html'
          }
          next()
        })
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
        configure: stripBrowserOrigin,
      },
      // Listing photos can come back as server-relative paths (/uploads/images/...).
      '/uploads': {
        target: DEV_API_TARGET,
        changeOrigin: true,
        configure: stripBrowserOrigin,
      },
    },
  },
  build: {
    outDir: mode === 'development' ? 'dist/dev' : 'dist/prod',
    rollupOptions: {
      // The webview demo ships only in the dev build, so its document is only an entry there.
      input: entryPoints(mode),
    },
  },
}))

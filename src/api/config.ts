/**
 * Replaced at build time by Vite: true only while `vite dev` is serving, where /api is
 * proxied to the dev backend. See the note in vite.config.ts.
 */
declare const __DEV_API_PROXY__: boolean

/**
 * Where API requests go.
 *
 * Empty behind the dev server's proxy, so requests stay same-origin; otherwise the absolute
 * host from VITE_API_URL (.env.development for the dev deploy, .env.production for prod).
 */
export const BASE_URL = __DEV_API_PROXY__
  ? ''
  : import.meta.env.VITE_API_URL || 'https://api.handyla.co'

/**
 * Replaced at build time by Vite: true only while `vite dev` is serving, where /api is
 * proxied to the dev backend. See the note in vite.config.ts.
 */
declare const __DEV_API_PROXY__: boolean

const PROD_API = 'https://api.handyla.co'
const DEV_API = 'https://dev-api.handyla.co'

/**
 * Where API requests go.
 *
 * Empty behind the dev server's proxy, so requests stay same-origin. Otherwise the absolute
 * host from VITE_API_URL — .env.production for a production build, .env.development for the
 * dev deploy.
 *
 * The fallback is per mode rather than a single constant on purpose: a build that somehow
 * loses VITE_API_URL used to fall through to the production API whatever it was built for,
 * which means a dev or preview build quietly writing to production data. A build that is not
 * production now falls back to the dev API instead, so a misconfiguration costs a confusing
 * dev session rather than a reservation on a real customer's account.
 */
export const BASE_URL = __DEV_API_PROXY__
  ? ''
  : import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === 'production' ? PROD_API : DEV_API)

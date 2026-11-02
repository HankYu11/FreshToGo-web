import { api, setAuthToken, ApiError } from './client'
import type { components } from '../types/api-schema'

type SessionInfo = components['schemas']['SessionInfo']

interface ApiResponse<T> {
  success: boolean
  data: T
}

/**
 * The dev backend's demo-login escape hatch. `AuthService` short-circuits these exact strings
 * instead of calling LINE, and only when `KTOR_DEVELOPMENT=true` — production never mounts the
 * branch, so neither can authenticate anything real.
 *
 * We mint a FRESH member rather than reusing the shared demo consumer. That consumer is also
 * the Android E2E suite's, so its order history is full of fixtures — `E2E-CancelTarget`,
 * `E2E eligibility history` — and the orders screen would show them to whoever is being shown
 * this. A new member is both cleaner and a truer picture of the thing being proposed: someone
 * opening this from their wallet for the first time, with nothing to set up.
 *
 * It also sidesteps two traps the shared account carries: one active reservation per pack per
 * consumer (so a rehearsal makes the real run fail with 409), and a three-strike no-show block.
 *
 * Swap to SHARED_CONSUMER to demo against that account's accumulated history instead.
 */
const FRESH_CONSUMER = 'DEMO_NEW_USER_ACCESS_TOKEN'
const SHARED_CONSUMER = 'DEMO_ACCESS_TOKEN'
void SHARED_CONSUMER

/**
 * Display names the dev backend gives its stand-in accounts. The host app would supply the
 * member's real name; showing the backend's test placeholder instead just looks like leaked
 * test data, so the UI falls back to its own label.
 */
const PLACEHOLDER_NAMES = new Set(['E2E User', 'E2E Tester', 'Demo User'])

const STORAGE_KEY = 'freshtogo.ew.session'

export interface Session {
  accessToken: string
  displayName: string
}

/**
 * SIMULATED host-app identity.
 *
 * In the real integration the wallet host hands the webview a signed identity and no
 * sign-in screen is ever shown. There is no such handshake yet, so the demo stands in for it
 * with the dev backend's demo consumer: same shape (a session already exists when the page
 * opens, the user never authenticates), real reservations against the dev database. The UI
 * says so on screen — see `HostIdentityNote`.
 */
let current: Session | null = null

/**
 * The login in flight, if any.
 *
 * Without this, StrictMode's double-mount — or two screens loading at once — each see a null
 * session and fire their own POST to verify-token. Two auth handshakes side by side in the
 * network panel is the first thing a reviewer notices.
 */
let pendingLogin: Promise<Session> | null = null

function readStored(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const { accessToken, displayName } = parsed as Partial<Session>
    if (typeof accessToken !== 'string' || !accessToken) return null
    return { accessToken, displayName: typeof displayName === 'string' ? displayName : '' }
  } catch {
    // Private mode, or a webview with storage disabled — fall back to logging in again.
    return null
  }
}

function store(session: Session | null) {
  try {
    if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage is a convenience here; the in-memory session still works for this page view.
  }
}

function login(): Promise<Session> {
  pendingLogin ??= (async () => {
    const res = await api.post<ApiResponse<SessionInfo>>('/api/user/line/verify-token', {
      lineAccessToken: FRESH_CONSUMER,
    })
    const accessToken = res.data?.accessToken
    if (!accessToken) throw new ApiError(502, 'Session response carried no access token')

    const name = res.data?.user?.displayName ?? ''
    const session: Session = {
      accessToken,
      displayName: PLACEHOLDER_NAMES.has(name) ? '' : name,
    }
    current = session
    setAuthToken(accessToken)
    store(session)
    return session
  })().finally(() => {
    pendingLogin = null
  })

  return pendingLogin
}

/** Restore a session from this tab's storage, or open a new one. */
export async function ensureSession(): Promise<Session> {
  if (current) return current

  const stored = readStored()
  if (stored) {
    current = stored
    setAuthToken(stored.accessToken)
    return stored
  }

  return login()
}

/**
 * Open a session if one can be opened, and say whether there is one.
 *
 * For the eligibility-aware public endpoints: `GET /api/boxes` and `GET /api/boxes/{id}` take a
 * consumer token when there is one and filter the listings to what that consumer may buy, but
 * never 401. Browsing must not break just because the session could not be opened, so a failure
 * here is swallowed and the request goes out anonymous.
 */
export async function ensureSessionQuietly(): Promise<boolean> {
  try {
    await ensureSession()
    return true
  } catch {
    return false
  }
}

/**
 * Run an authenticated call, re-opening the session once if the token has expired.
 *
 * The access token lives an hour and there is no refresh flow here on purpose: the host app
 * will own token lifetime in the real integration, and a demo that silently re-opens a
 * session is the closest honest stand-in.
 */
export async function withSession<T>(call: () => Promise<T>): Promise<T> {
  await ensureSession()
  try {
    return await call()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      current = null
      store(null)
      setAuthToken(null)
      await login()
      return call()
    }
    throw error
  }
}

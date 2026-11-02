import { api, setAuthToken, ApiError } from './client'
import type { components } from '../types/api-schema'

type SessionInfo = components['schemas']['SessionInfo']

interface ApiResponse<T> {
  success: boolean
  data: T
}

/**
 * The dev backend's demo-login escape hatch. `AuthService` short-circuits this exact string
 * to a shared demo consumer instead of calling LINE, and only when `KTOR_DEVELOPMENT=true`
 * — production never mounts it, so this cannot authenticate anything real.
 */
const DEMO_ACCESS_TOKEN = 'DEMO_ACCESS_TOKEN'

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
      lineAccessToken: DEMO_ACCESS_TOKEN,
    })
    const accessToken = res.data?.accessToken
    if (!accessToken) throw new ApiError(502, 'Session response carried no access token')

    const session: Session = {
      accessToken,
      displayName: res.data?.user?.displayName ?? '',
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

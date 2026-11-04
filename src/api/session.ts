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
 * this. It also sidesteps two traps that account carries: one active reservation per pack per
 * consumer, and a three-strike no-show block.
 *
 * Swap to SHARED_CONSUMER to demo against that account's accumulated history instead.
 */
const FRESH_CONSUMER = 'DEMO_NEW_USER_ACCESS_TOKEN'
const SHARED_CONSUMER = 'DEMO_ACCESS_TOKEN'
void SHARED_CONSUMER

/**
 * Display names the dev backend gives its stand-in accounts.
 *
 * `provisionEphemeralUser` names every member it mints "E2E User", so that is the real
 * customerName on these rows — not a bug, but it reads as leaked test data wherever it is
 * shown, so both sides of the demo put their own label in its place. The host app would supply
 * the member's real name here.
 */
const PLACEHOLDER_NAMES = new Set(['E2E User', 'E2E Tester', 'Demo User'])

/** Whether a display name is one the dev backend made up rather than a member's own. */
export function isPlaceholderName(name: string | null | undefined) {
  return !name || PLACEHOLDER_NAMES.has(name)
}

/**
 * localStorage, not sessionStorage.
 *
 * A wallet host can tear its webview down and rebuild it whenever it likes — switching apps,
 * memory pressure, the user going back and returning. With a per-tab session that recreates the
 * member, and the order placed a minute ago vanishes from 訂單 along with it. In front of
 * somebody deciding whether this team can ship, that is the worst thirty seconds available.
 *
 * A real member persists, so this one does too: the refresh token is kept and spent on expiry,
 * and a new member is minted only when there is genuinely nothing left to restore.
 */
const STORAGE_KEY = 'freshtogo.ew.session'

export interface Session {
  accessToken: string
  refreshToken: string
  displayName: string
}

let current: Session | null = null

/**
 * The login in flight, if any.
 *
 * Without this, StrictMode's double-mount — or two screens loading at once — each see a null
 * session and fire their own POST to verify-token. Two auth handshakes side by side in the
 * network panel is the first thing a reviewer notices.
 */
let pendingLogin: Promise<Session> | null = null

/**
 * The refresh in flight, if any.
 *
 * Deduplicated for a harder reason than the login is. The backend consumes a refresh token on
 * use, so two screens that hit a 401 in the same moment — the ticket and the orders list both
 * re-read on resume — would spend the same token twice: one gets a session, the other is
 * refused and falls through to minting a NEW member, and the orders the first one just
 * restored belong to somebody else.
 */
let pendingRefresh: Promise<Session | null> | null = null

function readStored(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const { accessToken, refreshToken, displayName } = parsed as Partial<Session>
    if (typeof accessToken !== 'string' || !accessToken) return null
    return {
      accessToken,
      refreshToken: typeof refreshToken === 'string' ? refreshToken : '',
      displayName: typeof displayName === 'string' ? displayName : '',
    }
  } catch {
    // Private mode, or a webview with storage disabled — fall back to logging in again.
    return null
  }
}

function store(session: Session | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage is a convenience here; the in-memory session still works for this page view.
  }
}

function adopt(session: Session) {
  current = session
  setAuthToken(session.accessToken)
  store(session)
  return session
}

function login(): Promise<Session> {
  pendingLogin ??= (async () => {
    const res = await api.post<ApiResponse<SessionInfo>>('/api/user/line/verify-token', {
      lineAccessToken: FRESH_CONSUMER,
    })
    const accessToken = res.data?.accessToken
    if (!accessToken) throw new ApiError(502, 'Session response carried no access token')

    const name = res.data?.user?.displayName ?? ''
    return adopt({
      accessToken,
      refreshToken: res.data?.refreshToken ?? '',
      displayName: PLACEHOLDER_NAMES.has(name) ? '' : name,
    })
  })().finally(() => {
    pendingLogin = null
  })

  return pendingLogin
}

/**
 * Spend the refresh token for a new access token, keeping the same member.
 *
 * Returns null when there is nothing to spend or the backend refuses it, which is the caller's
 * signal to start a new member rather than leave the screen stuck.
 */
function refresh(): Promise<Session | null> {
  pendingRefresh ??= spendRefreshToken().finally(() => {
    pendingRefresh = null
  })
  return pendingRefresh
}

async function spendRefreshToken(): Promise<Session | null> {
  const token = current?.refreshToken || readStored()?.refreshToken
  if (!token) return null

  try {
    const res = await api.post<ApiResponse<{ accessToken?: string }>>('/api/user/refresh', {
      refreshToken: token,
    })
    const accessToken = res.data?.accessToken
    if (!accessToken) return null
    return adopt({
      accessToken,
      refreshToken: token,
      displayName: current?.displayName ?? readStored()?.displayName ?? '',
    })
  } catch {
    return null
  }
}

/** Restore a session from storage, or open a new one. */
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
 * Run an authenticated call, restoring the session once if the token has expired.
 *
 * The access token lives an hour. Refresh first, because that keeps the member — and with them
 * their orders. Only when there is no refresh token, or the backend will not honour it, does
 * this fall back to a new member, which is a worse outcome and never the first move.
 */
export async function withSession<T>(call: () => Promise<T>): Promise<T> {
  await ensureSession()
  try {
    return await call()
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error

    if (await refresh()) return call()

    current = null
    store(null)
    setAuthToken(null)
    await login()
    return call()
  }
}

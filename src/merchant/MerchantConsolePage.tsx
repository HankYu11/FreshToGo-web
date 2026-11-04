import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, apiErrorMessage, type Box, type ProductCategory } from '../api'
import {
  createListing,
  merchantBoxes,
  merchantLogin,
  placeStore,
  todayLocalDate,
  type MerchantSession,
} from '../api/merchant'
import { seedDemoListings, type SeedResult } from '../api/devSeed'
import RedeemPanel from './RedeemPanel'
import { PLACEMENTS } from './stationPlacement'
import { SEED_PAYLOAD } from './seedPayload'
import { CATEGORY_OPTIONS } from './categories'
import { nearestStation } from './nearestStation'
import './console.css'

const SESSION_KEY = 'freshtogo.merchant.session'

function readSession(): MerchantSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as MerchantSession) : null
  } catch {
    return null
  }
}

function storeSession(session: MerchantSession | null) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // The console still works for this page view.
  }
}

function errorText(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.isOffline) return '沒有網路連線，請確認後再試。'
  if (error instanceof ApiError && error.status === 401) return '帳號或密碼不正確。'
  if (error instanceof ApiError && error.code === 'MERCHANT_NOT_FOUND') {
    return '後端找不到這個 email 的店家。'
  }
  // Named here because the backend answers in English and the remedy is not in its message:
  // the subscription lives on the merchant record, so only dev-admin can put it back.
  if (error instanceof ApiError && error.code === 'MERCHANT_SUBSCRIPTION_EXPIRED') {
    return '這個店家帳號的訂閱已到期，後端不讓它上架。請到 dev-admin 把 subscriptionEndDate 改到未來，或改用別的店家帳號。'
  }
  return apiErrorMessage(error) ?? (error instanceof Error ? error.message : fallback)
}

/**
 * 店家後台（開發環境）— list a pack for today from a browser.
 *
 * The app's merchant side can do this and the web could not, which is why the demo kept running
 * out of data: every listing is for one day, and nobody could put one up without the Android
 * app or a seeding script. This is the same two calls the app makes — sign in, then
 * POST /api/merchant/boxes — with the sale window filled in correctly so the pack is reservable
 * the moment it exists.
 *
 * Dev build only. It talks to whatever VITE_API_URL points at, which in this build is the dev
 * backend, and it is never part of a production bundle.
 */
export default function MerchantConsolePage() {
  const [session, setSession] = useState<MerchantSession | null>(readSession)

  if (!session) {
    return (
      <SignIn
        onSignedIn={(next) => {
          storeSession(next)
          setSession(next)
        }}
      />
    )
  }

  return (
    <Console
      session={session}
      onSignOut={() => {
        storeSession(null)
        setSession(null)
      }}
    />
  )
}

/**
 * One tap, no credentials: ask the dev backend to create the demo's stores and today's packs.
 *
 * It sits on the sign-in screen because that is where somebody arrives when the demo has no
 * data, and because the endpoint behind it needs no account — making people find a password
 * first is the problem this solves, not a step on the way to it.
 */
function SeedPanel() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<SeedResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    if (busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    try {
      setResult(await seedDemoListings(SEED_PAYLOAD))
    } catch (seedError) {
      const missingRoute =
        seedError instanceof ApiError && seedError.status === 404 && !seedError.code
      setError(
        missingRoute
          ? '這個後端沒有 POST /api/test/demo/listings — 它只在 KTOR_DEVELOPMENT=true 的環境掛載。'
          : errorText(seedError, '建立示範資料失敗。'),
      )
    } finally {
      setBusy(false)
    }
  }

  const created = result?.stores.flatMap((s) => s.listings).filter((l) => l.outcome === 'created')
  const reused = result?.stores.flatMap((s) => s.listings).filter((l) => l.outcome === 'reused')
  const failed = result?.stores.flatMap((s) => s.listings).filter((l) => l.outcome === 'failed')

  return (
    <div className="mc-card">
      <h2 className="mc-h2">一鍵建立今天的示範資料</h2>
      <p className="mc-sub">
        在龍山寺、西門、台北車站附近建立 {SEED_PAYLOAD.length} 家示範店家與當天的鮮款包。不需要帳號密碼，重複執行不會重複建立。
      </p>
      <button className="mc-button" type="button" onClick={run} disabled={busy}>
        {busy ? '建立中…' : '建立示範資料'}
      </button>

      {error && (
        <p className="mc-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div role="status">
          <p className="mc-done">
            {result.saleDate}：新建 {created?.length ?? 0} 款、沿用 {reused?.length ?? 0} 款
            {failed && failed.length > 0 ? `、失敗 ${failed.length} 款` : ''}。
          </p>
          {failed && failed.length > 0 && (
            <ul className="mc-list" style={{ marginTop: 10 }}>
              {failed.map((listing) => (
                <li key={listing.name} className="mc-listitem">
                  <span>
                    <strong>{listing.name}</strong>
                    <span className="mc-meta">{listing.reason ?? '未知原因'}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mc-hint">
            完成後打開 /easywallet 就會看到真實資料；示意型錄只有在後端當天沒有上架時才會接手。
          </p>
        </div>
      )}
    </div>
  )
}

function SignIn({ onSignedIn }: { onSignedIn: (session: MerchantSession) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      onSignedIn(await merchantLogin(email.trim(), password))
    } catch (loginError) {
      setError(errorText(loginError, '登入失敗，請再試一次。'))
      setBusy(false)
    }
  }

  return (
    <main className="mc-page">
      <div className="mc-card mc-signin">
        <p className="mc-env">開發環境</p>
        <h1 className="mc-title">店家後台</h1>
        <p className="mc-sub">用店家帳號登入，上架今天的鮮款包。</p>
        <form onSubmit={submit}>
          <label className="mc-label" htmlFor="mc-email">
            Email
          </label>
          <input
            id="mc-email"
            className="mc-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="mc-label" htmlFor="mc-password">
            密碼
          </label>
          <input
            id="mc-password"
            className="mc-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && (
            <p className="mc-error" role="alert">
              {error}
            </p>
          )}
          <button className="mc-button" type="submit" disabled={busy}>
            {busy ? '登入中…' : '登入'}
          </button>
        </form>
      </div>
      <SeedPanel />
    </main>
  )
}

const DEFAULT_LISTING = {
  name: '',
  description: '',
  category: 'GENERAL' as ProductCategory,
  originalPrice: '200',
  discountedPrice: '75',
  quantity: '5',
  pickupTimeStart: '17:00',
  pickupTimeEnd: '21:00',
}

function Console({
  session: initialSession,
  onSignOut,
}: {
  session: MerchantSession
  onSignOut: () => void
}) {
  const [session, setSession] = useState(initialSession)
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState<string | null>(null)

  async function place(index: number) {
    const target = PLACEMENTS[index]
    if (placing) return
    setPlacing(true)
    setPlaceError(null)
    try {
      const moved = await placeStore(
        session.email,
        target.address,
        target.latitude,
        target.longitude,
      )
      const next = { ...session, ...moved }
      setSession(next)
      storeSession(next)
    } catch (error) {
      // Now that the endpoint is live, a 404 means two different things. The route answers
      // MERCHANT_NOT_FOUND with a code; a backend that predates it answers a bare 404 with no
      // body at all, so the code is what tells them apart.
      const missingRoute = error instanceof ApiError && error.status === 404 && !error.code
      setPlaceError(
        missingRoute
          ? '這個後端沒有 POST /api/test/merchants/location — 它只在 KTOR_DEVELOPMENT=true 的環境掛載。'
          : errorText(error, '搬移店家失敗。'),
      )
    } finally {
      setPlacing(false)
    }
  }

  const [boxes, setBoxes] = useState<Box[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [form, setForm] = useState(DEFAULT_LISTING)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setBoxes(await merchantBoxes(session.token))
      setLoadError(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return onSignOut()
      setLoadError(errorText(error, '讀不到上架清單。'))
    }
  }, [session.token, onSignOut])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const station = nearestStation(session.storeLatitude, session.storeLongitude)
  // Local date parts, matching exactly what createListing sends as saleDate. toISOString() is
  // UTC, so between midnight and 08:00 in Taipei this label named yesterday — on the heading
  // of a form whose whole point is "today".
  const today = todayLocalDate()
  // Everything filed under today, expired or not. Filtering on status instead meant a pack
  // listed after its own pickup window had closed answered 已上架 and then was missing from the
  // list directly below it, which reads as the listing having failed.
  const todays = (boxes ?? []).filter((box) => box.saleDate === today)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (busy) return

    const original = Number(form.originalPrice)
    const discounted = Number(form.discountedPrice)
    const quantity = Number(form.quantity)

    if (!(original > 0 && discounted > 0 && quantity > 0)) {
      return setFormError('價格與份數都必須大於 0。')
    }
    if (discounted > original) return setFormError('優惠價不能高於原價。')
    if (form.pickupTimeStart >= form.pickupTimeEnd) {
      return setFormError('取貨結束時間必須晚於開始時間。')
    }

    setBusy(true)
    setFormError(null)
    setDone(null)
    try {
      const created = await createListing(session.token, {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        originalPrice: original,
        discountedPrice: discounted,
        quantity,
        pickupTimeStart: form.pickupTimeStart,
        pickupTimeEnd: form.pickupTimeEnd,
      })
      setDone(`已上架：${created?.name ?? form.name}`)
      setForm({ ...DEFAULT_LISTING, category: form.category })
      await refresh()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return onSignOut()
      setFormError(errorText(error, '上架失敗，請再試一次。'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mc-page">
      <header className="mc-header">
        <div>
          <p className="mc-env">開發環境・{today}</p>
          <h1 className="mc-title">{session.storeName}</h1>
          <p className="mc-sub">{session.storeAddress}</p>
        </div>
        <button className="mc-link" type="button" onClick={onSignOut}>
          登出
        </button>
      </header>

      {/* The one thing the consumer demo needs and nothing else tells you. */}
      <div className={`mc-banner ${station ? 'mc-banner-ok' : 'mc-banner-warn'}`}>
        {station
          ? `這家店在${station.station.fullName}附近（約 ${station.meters} 公尺），上架後會出現在 /easywallet 的${station.station.fullName}清單裡。`
          : '這家店不在龍山寺、西門或台北車站的 700 公尺範圍內，所以上架後不會出現在 /easywallet 的清單裡。店家座標目前只能由管理後台設定。'}
      </div>

      <section className="mc-card">
        <h2 className="mc-h2">店家位置（開發環境）</h2>
        <p className="mc-sub">
          把這家店搬到某一站附近，上架的鮮款包才會出現在 /easywallet 的清單裡。只影響開發環境。
        </p>
        <div className="mc-row" style={{ marginTop: 12 }}>
          {PLACEMENTS.map((placement, index) => (
            <button
              key={placement.station.id}
              type="button"
              className="mc-button mc-button-quiet"
              disabled={placing}
              onClick={() => place(index)}
            >
              {placement.station.fullName}
            </button>
          ))}
        </div>
        {placeError && (
          <p className="mc-error" role="alert">
            {placeError}
          </p>
        )}
      </section>

      <RedeemPanel session={session} />

      <section className="mc-card">
        <h2 className="mc-h2">上架今天的鮮款包</h2>
        <form onSubmit={submit}>
          <label className="mc-label" htmlFor="mc-name">
            品項名稱
          </label>
          <input
            id="mc-name"
            className="mc-input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="例如：今日主菜便當包"
            required
          />

          <label className="mc-label" htmlFor="mc-desc">
            說明（選填）
          </label>
          <textarea
            id="mc-desc"
            className="mc-input mc-textarea"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="當日現做的主菜便當，口味由店家依剩餘品項決定。"
          />

          <label className="mc-label" htmlFor="mc-category">
            品類
          </label>
          <select
            id="mc-category"
            className="mc-input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as ProductCategory })}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="mc-row">
            <div>
              <label className="mc-label" htmlFor="mc-original">
                原價
              </label>
              <input
                id="mc-original"
                className="mc-input"
                type="number"
                min="1"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mc-label" htmlFor="mc-price">
                優惠價
              </label>
              <input
                id="mc-price"
                className="mc-input"
                type="number"
                min="1"
                value={form.discountedPrice}
                onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mc-label" htmlFor="mc-qty">
                份數
              </label>
              <input
                id="mc-qty"
                className="mc-input"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="mc-row">
            <div>
              <label className="mc-label" htmlFor="mc-from">
                取貨開始
              </label>
              <input
                id="mc-from"
                className="mc-input"
                type="time"
                value={form.pickupTimeStart}
                onChange={(e) => setForm({ ...form, pickupTimeStart: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mc-label" htmlFor="mc-to">
                取貨結束
              </label>
              <input
                id="mc-to"
                className="mc-input"
                type="time"
                value={form.pickupTimeEnd}
                onChange={(e) => setForm({ ...form, pickupTimeEnd: e.target.value })}
                required
              />
            </div>
          </div>

          <p className="mc-hint">
            開賣時段自動設為 00:00 到取貨結束時間，所以上架後馬上就能預約。後端不允許開賣時間晚於取貨結束時間。
          </p>

          {formError && (
            <p className="mc-error" role="alert">
              {formError}
            </p>
          )}
          {done && (
            <p className="mc-done" role="status">
              {done}
            </p>
          )}

          <button className="mc-button" type="submit" disabled={busy}>
            {busy ? '上架中…' : '上架'}
          </button>
        </form>
      </section>

      <section className="mc-card">
        <h2 className="mc-h2">目前上架中（{todays.length}）</h2>
        {loadError ? (
          <p className="mc-error">{loadError}</p>
        ) : boxes === null ? (
          <p className="mc-sub">載入中…</p>
        ) : todays.length === 0 ? (
          <p className="mc-sub">今天還沒有上架任何鮮款包。</p>
        ) : (
          <ul className="mc-list">
            {todays.map((box) => (
              <li key={box.id} className="mc-listitem">
                <span>
                  <strong>{box.name}</strong>
                  <span className="mc-meta">
                    {box.saleDate} 取貨 {box.pickupTimeStart}–{box.pickupTimeEnd}・剩{' '}
                    {box.remainingCount}/{box.quantity}
                  </span>
                </span>
                <span className="mc-status">{box.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, apiErrorMessage } from '../api'
import {
  merchantReservations,
  redeemByCode,
  redeemById,
  type MerchantOrder,
  type MerchantSession,
  type Redemption,
} from '../api/merchant'
import { formatPickupWindowUtc } from '../webview/format'
import { useRefreshWhenVisible } from '../webview/useRefreshWhenVisible'

/**
 * Why a redemption was refused, in the merchant app's own words.
 *
 * The codes come from the endpoint's contract; the Chinese comes from the app's string
 * resources, so a merchant who has used both reads the same sentence twice rather than two
 * descriptions of one thing.
 */
/** How often a console left open on the counter re-reads the pending list. */
const PENDING_POLL_MS = 15_000

function redemptionError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isOffline) return '沒有網路連線，請確認後再試。'
    if (error.status === 401) return '登入已過期，請重新登入。'
    if (error.status === 403) return '這筆預約不是這家店的。'
    if (error.status === 404) return '無效的取餐碼'
    switch (error.code) {
      case 'ALREADY_REDEEMED':
        return '此訂單已核銷'
      case 'REDEMPTION_CODE_INVALID':
        return '無效的取餐碼'
      case 'RESERVATION_CANCELLED':
        return '這筆預約已經取消。'
      case 'PICKUP_EXPIRED':
        return '取貨時段已過，這筆預約已記為未到店。'
      case 'NOT_PICKUP_DATE':
        return '今天不是這筆預約的取貨日。'
      case 'NOT_IN_PICKUP_WINDOW':
        return '現在不在這筆預約的取貨時段內。'
    }
  }
  return apiErrorMessage(error) ?? '核銷失敗，請再試一次'
}

/** A row the counter can still act on. The backend may return written-off ones; they are not. */
function stillOwed(order: MerchantOrder) {
  return (
    !order.isPickedUp &&
    !order.isCancelled &&
    order.status !== 'NO_SHOW' &&
    order.status !== 'EXPIRED'
  )
}

function byPickupEnd(a: MerchantOrder, b: MerchantOrder) {
  return (a.pickupWindowEndUtc ?? '').localeCompare(b.pickupWindowEndUtc ?? '')
}

/**
 * 核銷 — the counter half of the flow, as the app's merchant dashboard does it.
 *
 * Two ways in, and they are the app's two: a list of what is still owed with 核銷 on each row,
 * and the customer's six-character code typed in when they are standing there with it. Both
 * hit the same endpoints the merchant app hits, so a reservation made in /easywallet is
 * redeemed here and the customer's own ticket says 已完成取貨 the next time it reads the server.
 *
 * Dev console only — but the calls are not a dev thing, which is the point.
 */
export default function RedeemPanel({ session }: { session: MerchantSession }) {
  const [orders, setOrders] = useState<MerchantOrder[] | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [done, setDone] = useState<Redemption | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setListError(null)
    try {
      const rows = await merchantReservations(session.token, {
        pickedUp: false,
        cancelled: false,
      })
      setOrders(rows.filter(stillOwed).sort(byPickupEnd))
    } catch (cause) {
      setOrders([])
      setListError(redemptionError(cause))
    }
  }, [session.token])

  useEffect(() => {
    void load()
  }, [load])

  /*
   * The counter's screen has to notice a customer arriving.
   *
   * A reservation is made on the customer's phone, not here, so a list fetched once when the
   * console opened is a list of who had already ordered when the merchant sat down. Both halves
   * matter: the poll is for a console left open on the counter, and the visibility refresh is
   * for the merchant who switched to something else and came back — a tab in the background
   * gets its timers throttled, so the poll alone would land late.
   */
  useEffect(() => {
    const timer = window.setInterval(() => void load(), PENDING_POLL_MS)
    return () => window.clearInterval(timer)
  }, [load])

  useRefreshWhenVisible(() => void load(), true)

  async function finish(run: () => Promise<Redemption>, key: string) {
    if (busy) return
    setBusy(key)
    setError(null)
    setDone(null)
    try {
      const redemption = await run()
      setDone(redemption)
      setCode('')
      // The row has to leave the list, which is also the check that the list's `id` and the
      // redemption's `reservationId` are the same thing.
      await load()
    } catch (cause) {
      setError(redemptionError(cause))
    } finally {
      setBusy(null)
    }
  }

  function submitCode(event: FormEvent) {
    event.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return
    void finish(() => redeemByCode(session.token, trimmed), 'code')
  }

  return (
    <section className="mc-card">
      <h2 className="mc-h2">核銷</h2>
      <p className="mc-sub">
        客人在 /easywallet 預約後會拿到一組取貨碼。掃碼機之外，這裡是同樣的兩條路：從待取貨清單核銷，或請客人報出取貨碼。
      </p>

      <form onSubmit={submitCode} style={{ marginTop: 16 }}>
        <label className="mc-label" htmlFor="mc-code">
          輸入核銷碼
        </label>
        <div className="mc-redeemrow">
          <input
            id="mc-code"
            className="mc-input"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="六碼，例如 2X8S2Z"
            maxLength={6}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="mc-button"
            disabled={busy !== null || code.trim().length === 0}
          >
            {busy === 'code' ? '核銷中…' : '核銷'}
          </button>
        </div>
      </form>

      {done && (
        <p className="mc-done" role="status">
          核銷成功・{done.itemName} ×{done.quantity}・NT${done.totalAmount}
        </p>
      )}
      {error && (
        <p className="mc-error" role="alert">
          {error}
        </p>
      )}

      <h3 className="mc-h2" style={{ marginTop: 24 }}>
        待取貨
      </h3>
      {listError && (
        <p className="mc-error" role="alert">
          {listError}
        </p>
      )}
      {orders === null ? (
        <p className="mc-sub">讀取中…</p>
      ) : orders.length === 0 ? (
        <p className="mc-sub">
          現在沒有待取貨的訂單。到 /easywallet 預約一包，這裡就會出現，核銷後客人的取貨券會變成「已完成取貨」。
        </p>
      ) : (
        <div className="mc-list">
          {orders.map((order) => {
            const window = formatPickupWindowUtc(
              order.pickupWindowStartUtc,
              order.pickupWindowEndUtc,
              order.merchantTimezone,
            )
            return (
              <div key={order.id} className="mc-listitem">
                <div>
                  {order.customerName || '客人'} <span className="mc-status">{order.orderId}</span>
                  <span className="mc-meta">
                    {order.itemDescription}
                    {window && `・取貨 ${window}`}・NT${order.totalPrice}
                  </span>
                </div>
                <button
                  type="button"
                  className="mc-button mc-button-quiet mc-rowbutton"
                  disabled={busy !== null}
                  onClick={() => void finish(() => redeemById(session.token, order.id), order.id)}
                >
                  {busy === order.id ? '核銷中…' : '核銷'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

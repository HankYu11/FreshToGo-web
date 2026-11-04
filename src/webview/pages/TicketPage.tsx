import { useLocation, useParams } from 'react-router-dom'
import type { Reservation } from '../../api'
import { loadReservation } from '../catalog'
import QrCode from '../components/QrCode'
import Screen from '../components/Screen'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { isMissing } from '../errors'
import { formatPickupDate, formatPickupWindow, formatPickupWindowUtc, formatPrice } from '../format'
import { describeWalk } from '../nearby'
import { currentStation } from '../stationPreference'
import { useAsync } from '../useAsync'
import { useRefreshWhenVisible } from '../useRefreshWhenVisible'
import { useWebviewNavigation } from '../useWebviewNavigation'

/**
 * How the ticket presents itself, by the reservation's server-side state.
 *
 * A collected or cancelled order must not keep showing 「預約成功」 over a live QR code: the
 * merchant app can redeem or cancel it while this screen is open, and a reviewer who does
 * exactly that and reloads is checking whether the client trusts the server.
 */
function presentation(reservation: Reservation) {
  if (reservation.isCancelled) {
    const byMerchant = reservation.cancelledBy === 'merchant'
    return {
      kicker: '這筆預約已取消',
      live: false,
      note:
        byMerchant && reservation.cancellationReason
          ? `店家取消了這筆預約：${reservation.cancellationReason}`
          : byMerchant
            ? '店家取消了這筆預約。'
            : '這筆預約已經取消，取貨碼不再有效。',
    }
  }
  if (reservation.isPickedUp || reservation.status === 'PICKED_UP') {
    return { kicker: '已完成取貨', live: false, note: '這一包已經取走了，感謝你少浪費一份食物。' }
  }
  if (reservation.status === 'NO_SHOW') {
    return { kicker: '未在時段內取貨', live: false, note: '取貨時段已過，這筆預約記為未到店。' }
  }
  if (reservation.status === 'EXPIRED') {
    return { kicker: '這筆預約已過期', live: false, note: '取貨時段已經結束。' }
  }
  return {
    kicker: '預約成功・取貨碼',
    live: true,
    note: '取貨時出示這個畫面，由店員掃描或輸入取貨碼。',
  }
}

/**
 * Step five: the thing the commuter shows at the counter.
 *
 * Loaded by id from the server rather than handed over in router state, so a reload — or the
 * host app restoring the webview — still shows a usable ticket.
 */
export default function TicketPage() {
  const { reservationId = '' } = useParams()
  const { goBackBy } = useWebviewNavigation()
  const { state } = useLocation()
  const station = currentStation()

  const {
    data: reservation,
    error,
    loading,
    reload,
  } = useAsync((signal) => loadReservation(reservationId, signal), [reservationId])

  // The counter redeems on its own screen, so this one asks again whenever the phone comes
  // back — but only while there is still an answer to get.
  useRefreshWhenVisible(reload, !reservation || presentation(reservation).live)

  /**
   * How far back the way out is depends on how the ticket was reached.
   *
   * From checkout it is two: checkout was replaced by this ticket, and the pack's detail screen
   * sits under that. From the orders list it is one, and popping two would overshoot the list
   * entirely — out of the flow, and out of the webview when the list was the first screen.
   * A ticket opened by a deep link has nothing to pop and falls back to the home feed.
   */
  const cameFromCheckout = (state as { from?: string } | null)?.from === 'checkout'
  const done = () => goBackBy(cameFromCheckout ? 2 : 1, '/easywallet')

  if (loading && !reservation) {
    return (
      <Screen title="取貨券" onBack={done}>
        <LoadingState label="正在取得取貨碼…" />
      </Screen>
    )
  }

  if (!reservation) {
    if (error && !isMissing(error)) {
      return (
        <Screen title="取貨券" onBack={done}>
          <ErrorState error={error} onRetry={reload} />
        </Screen>
      )
    }
    return (
      <Screen title="取貨券" onBack={done}>
        <EmptyState title="找不到這張取貨券" body="這筆預約可能已經不存在了。">
          <button type="button" className="ew-button" onClick={done}>
            回到列表
          </button>
        </EmptyState>
      </Screen>
    )
  }

  const { box } = reservation
  const view = presentation(reservation)
  const timeZone = reservation.merchantTimezone
  const window =
    formatPickupWindowUtc(
      reservation.pickupWindowStartUtc,
      reservation.pickupWindowEndUtc,
      timeZone,
    ) || (box ? formatPickupWindow(box.pickupTimeStart, box.pickupTimeEnd) : '')
  const date = formatPickupDate(reservation.pickupWindowStartUtc, timeZone)
  const walk = box ? describeWalk(station, box.storeLatitude, box.storeLongitude) : null

  return (
    <Screen
      title="取貨券"
      onBack={done}
      footer={
        <button type="button" className="ew-button ew-button-secondary" onClick={done}>
          回到列表
        </button>
      }
    >
      <div className={`ew-ticket ${view.live ? '' : 'ew-ticket-spent'}`}>
        <p className="ew-ticket-kicker">{view.kicker}</p>
        <p className="ew-ticket-code">{reservation.redemptionCode || '—'}</p>
        {view.live && reservation.redemptionCode && <QrCode value={reservation.redemptionCode} />}
        <p className="ew-ticket-hint">{view.note}</p>
        {reservation.orderId && <p className="ew-ticket-order">訂單編號 {reservation.orderId}</p>}
      </div>

      <section className="ew-panel">
        <p className="ew-panel-title">取貨資訊</p>
        {box && (
          <>
            <div className="ew-inforow">
              <span className="ew-inforow-label">店家</span>
              <span className="ew-inforow-value ew-inforow-strong">{box.storeName}</span>
            </div>
            <div className="ew-inforow">
              <span className="ew-inforow-label">品項</span>
              <span className="ew-inforow-value">{box.name}</span>
            </div>
            <div className="ew-inforow">
              <span className="ew-inforow-label">地址</span>
              <span className="ew-inforow-value">{box.storeAddress || '請洽店家'}</span>
            </div>
          </>
        )}
        <div className="ew-inforow">
          <span className="ew-inforow-label">時段</span>
          <span className="ew-inforow-value ew-inforow-strong">
            {[date, window].filter(Boolean).join(' ') || '請洽店家'}
          </span>
        </div>
        {walk && (
          <div className="ew-inforow">
            <span className="ew-inforow-label">出站後</span>
            <span className="ew-inforow-value">
              {station.fullName}往{walk.direction}約 {walk.meters} 公尺，步行約 {walk.minutes} 分
              <span className="ew-note" style={{ marginTop: 2 }}>
                步行時間為直線距離估算，實際路線以地圖為準。
              </span>
            </span>
          </div>
        )}
        <div className="ew-inforow">
          <span className="ew-inforow-label">金額</span>
          <span className="ew-inforow-value">
            {formatPrice(reservation.price)}
            {view.live && (
              <span className="ew-note" style={{ marginTop: 2 }}>
                已由悠遊付付款（模擬）：取貨時只需出示取貨碼，不需再付款。
              </span>
            )}
          </span>
        </div>
      </section>

      {view.live && <p className="ew-note">請在取貨時段內到店，逾時未取將計為未到店。</p>}
    </Screen>
  )
}

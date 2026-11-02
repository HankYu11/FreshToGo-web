import type { Reservation } from '../../api'
import { loadReservations } from '../catalog'
import Screen from '../components/Screen'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { ChevronRightIcon, ClockIcon, StoreIcon } from '../components/icons'
import { formatPickupDate, formatPickupWindowUtc, formatPrice } from '../format'
import { useAsync } from '../useAsync'
import { useWebviewNavigation } from '../useWebviewNavigation'

/** What the row says this order is, and whether it is still worth showing a code for. */
function statusLabel(reservation: Reservation): { label: string; tone: string } {
  if (reservation.isCancelled) return { label: '已取消', tone: 'ew-orderstatus-off' }
  if (reservation.isPickedUp || reservation.status === 'PICKED_UP') {
    return { label: '已取貨', tone: 'ew-orderstatus-done' }
  }
  if (reservation.status === 'NO_SHOW') return { label: '未到店', tone: 'ew-orderstatus-off' }
  if (reservation.status === 'EXPIRED') return { label: '已過期', tone: 'ew-orderstatus-off' }
  return { label: '待取貨', tone: 'ew-orderstatus-live' }
}

function OrderRow({ reservation, onOpen }: { reservation: Reservation; onOpen: () => void }) {
  const { box } = reservation
  const status = statusLabel(reservation)
  const window = formatPickupWindowUtc(
    reservation.pickupWindowStartUtc,
    reservation.pickupWindowEndUtc,
    reservation.merchantTimezone,
  )
  const date = formatPickupDate(reservation.pickupWindowStartUtc, reservation.merchantTimezone)

  return (
    <button type="button" className="ew-orderrow" onClick={onOpen}>
      <span className="ew-orderrow-main">
        <span className="ew-orderrow-top">
          <span className={`ew-orderstatus ${status.tone}`}>{status.label}</span>
          {reservation.orderId && <span className="ew-orderrow-id">{reservation.orderId}</span>}
        </span>
        <span className="ew-orderrow-store">
          <StoreIcon />
          {box?.storeName ?? '店家'}
        </span>
        <span className="ew-orderrow-name">{box?.name ?? '鮮款包'}</span>
        <span className="ew-orderrow-meta">
          <ClockIcon />
          {[date, window].filter(Boolean).join(' ') || '取貨時段請洽店家'}
        </span>
      </span>
      <span className="ew-orderrow-right">
        <span className="ew-orderrow-price">{formatPrice(reservation.price)}</span>
        <ChevronRightIcon size={18} className="ew-chevron" />
      </span>
    </button>
  )
}

/**
 * Every order this member holds, still collectable first.
 *
 * The flow had no way back to a ticket once you left it, which is the kind of gap that reads as
 * a prototype — and it bites in a demo too: the same member cannot reserve a pack twice, so a
 * rehearsal left the pitch with a 409 and nowhere to show the code it already had.
 */
export default function OrdersPage() {
  const { goTo, replaceTo } = useWebviewNavigation()
  const {
    data: orders,
    error,
    loading,
    reload,
  } = useAsync((signal) => loadReservations(signal), [])

  const live = (orders ?? []).filter((o) => statusLabel(o).tone === 'ew-orderstatus-live')
  const past = (orders ?? []).filter((o) => statusLabel(o).tone !== 'ew-orderstatus-live')

  return (
    <Screen title="我的訂單" tab>
      {loading && !orders ? (
        <LoadingState label="正在取得訂單…" />
      ) : error && !orders ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (orders ?? []).length === 0 ? (
        <EmptyState title="還沒有訂單" body="在「今日」挑一包，預約後取貨碼就會出現在這裡。">
          {/* Going to the 今日 tab, so it replaces rather than stacking a tab on a tab. */}
          <button type="button" className="ew-button" onClick={() => replaceTo('/easywallet')}>
            去看今天有什麼
          </button>
        </EmptyState>
      ) : (
        <>
          {live.length > 0 && (
            <section>
              <h2 className="ew-sectiontitle">待取貨</h2>
              <div className="ew-orderlist">
                {live.map((order) => (
                  <OrderRow
                    key={order.id}
                    reservation={order}
                    onOpen={() => goTo(`/easywallet/ticket/${order.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section className={live.length > 0 ? 'ew-section' : undefined}>
              <h2 className="ew-sectiontitle">歷史訂單</h2>
              <div className="ew-orderlist">
                {past.map((order) => (
                  <OrderRow
                    key={order.id}
                    reservation={order}
                    onOpen={() => goTo(`/easywallet/ticket/${order.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </Screen>
  )
}

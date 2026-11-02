import { useNavigate, useParams } from 'react-router-dom'
import { getReservation } from '../../api/reservations'
import { withSession } from '../../api/session'
import QrCode from '../components/QrCode'
import Screen from '../components/Screen'
import { ErrorState, LoadingState } from '../components/StateViews'
import { formatPickupDate, formatPickupWindow, formatPickupWindowUtc, formatPrice } from '../format'
import { readStationPreference } from '../stationPreference'
import { compassDirection, distanceMeters, findStation, walkingMinutes } from '../stations'
import { useAsync } from '../useAsync'

/**
 * Step five: the thing the commuter shows at the counter.
 *
 * Loaded by id from the server rather than handed over in router state, so a reload — or the
 * host app restoring the webview — still shows a usable ticket.
 */
export default function TicketPage() {
  const navigate = useNavigate()
  const { reservationId = '' } = useParams()
  const station = findStation(readStationPreference())

  const {
    data: reservation,
    error,
    loading,
    reload,
  } = useAsync((signal) => withSession(() => getReservation(reservationId, signal)), [reservationId])

  function done() {
    if (station) navigate(`/easywallet/station/${station.id}`)
    else navigate('/easywallet')
  }

  if (loading && !reservation) {
    return (
      <Screen title="取貨券" onBack={done}>
        <LoadingState label="正在取得取貨碼…" />
      </Screen>
    )
  }

  if (error && !reservation) {
    return (
      <Screen title="取貨券" onBack={done}>
        <ErrorState error={error} onRetry={reload} />
      </Screen>
    )
  }

  if (!reservation) {
    return (
      <Screen title="取貨券" onBack={done}>
        <ErrorState error={null} onRetry={reload} />
      </Screen>
    )
  }

  const { box } = reservation
  const timeZone = reservation.merchantTimezone
  const window =
    formatPickupWindowUtc(
      reservation.pickupWindowStartUtc,
      reservation.pickupWindowEndUtc,
      timeZone,
    ) || (box ? formatPickupWindow(box.pickupTimeStart, box.pickupTimeEnd) : '')
  const date = formatPickupDate(reservation.pickupWindowStartUtc, timeZone)

  const walk =
    station && box && box.storeLatitude !== null && box.storeLongitude !== null
      ? describeWalk(station, box.storeLatitude, box.storeLongitude)
      : null

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
      <div className="ew-ticket">
        <p className="ew-ticket-kicker">預約成功・取貨碼</p>
        <p className="ew-ticket-code">{reservation.redemptionCode || '—'}</p>
        {reservation.redemptionCode && <QrCode value={reservation.redemptionCode} />}
        <p className="ew-ticket-hint">取貨時出示這個畫面，由店員掃描或輸入取貨碼。</p>
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
        {walk && station && (
          <div className="ew-inforow">
            <span className="ew-inforow-label">出站後</span>
            <span className="ew-inforow-value">
              {station.name}站往{walk.direction}約 {walk.meters} 公尺，步行約 {walk.minutes} 分
              <span className="ew-note" style={{ marginTop: 2 }}>
                步行時間為直線距離估算，實際路線以地圖為準。
              </span>
            </span>
          </div>
        )}
        <div className="ew-inforow">
          <span className="ew-inforow-label">金額</span>
          <span className="ew-inforow-value">{formatPrice(reservation.price)}・到店出示取貨碼</span>
        </div>
      </section>

      <p className="ew-note">請在取貨時段內到店，逾時未取將計為未到店。</p>
    </Screen>
  )
}

function describeWalk(
  station: NonNullable<ReturnType<typeof findStation>>,
  latitude: number,
  longitude: number,
) {
  const meters = distanceMeters(station, { latitude, longitude })
  return {
    minutes: walkingMinutes(meters),
    direction: compassDirection(station, { latitude, longitude }),
    meters: Math.round(meters / 10) * 10,
  }
}

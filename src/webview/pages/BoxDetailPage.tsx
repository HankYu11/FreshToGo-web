import { useNavigate, useParams } from 'react-router-dom'
import { getBox, isReservable } from '../../api'
import { StoreMark } from '../components/BoxCard'
import Screen from '../components/Screen'
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews'
import { categoryColors, categoryLabel } from '../categories'
import { formatPickupWindow, formatPrice } from '../format'
import { readStationPreference } from '../stationPreference'
import { compassDirection, distanceMeters, findStation, walkingMinutes } from '../stations'
import { useAsync } from '../useAsync'

/** Labels for the states that stop a pack being reservable. */
const UNAVAILABLE_LABEL: Record<string, string> = {
  SOLD_OUT: '今天已售完',
  BEFORE_SALE: '尚未開賣',
  EXPIRED: '今天已結束',
}

/**
 * Step three: everything a commuter needs before committing — what it is, when and where to
 * collect it, and how far that is from the station they are standing in.
 */
export default function BoxDetailPage() {
  const navigate = useNavigate()
  const { boxId = '' } = useParams()
  const station = findStation(readStationPreference())

  const {
    data: box,
    error,
    loading,
    reload,
  } = useAsync((signal) => getBox(boxId, signal), [boxId])

  function goBack() {
    if (station) navigate(`/easywallet/station/${station.id}`)
    else navigate('/easywallet')
  }

  if (loading && !box) {
    return (
      <Screen title="鮮款包" onBack={goBack}>
        <LoadingState />
      </Screen>
    )
  }

  if (error && !box) {
    return (
      <Screen title="鮮款包" onBack={goBack}>
        <ErrorState error={error} onRetry={reload} />
      </Screen>
    )
  }

  if (!box) {
    return (
      <Screen title="鮮款包" onBack={goBack}>
        <EmptyState title="找不到這個鮮款包" body="它可能已經下架了，回上一頁看看其他款。">
          <button type="button" className="ew-button" onClick={goBack}>
            回到列表
          </button>
        </EmptyState>
      </Screen>
    )
  }

  const colors = categoryColors(box.category)
  const pickup = formatPickupWindow(box.pickupTimeStart, box.pickupTimeEnd)
  const available = isReservable(box.status)

  const walk = describeWalk(station, box.storeLatitude, box.storeLongitude)

  return (
    <Screen
      title={box.storeName}
      onBack={goBack}
      flush
      footer={
        <>
          <div className="ew-footer-price">
            <span className="ew-footer-price-label">到店取貨價</span>
            <span className="ew-pricerow" style={{ marginTop: 0 }}>
              <span className="ew-price">{formatPrice(box.discountedPrice)}</span>
              {box.originalPrice > box.discountedPrice && (
                <span className="ew-price-original">{formatPrice(box.originalPrice)}</span>
              )}
            </span>
          </div>
          <button
            type="button"
            className="ew-button"
            disabled={!available}
            onClick={() => navigate(`/easywallet/checkout/${box.id}`)}
          >
            {available ? '預約這一包' : (UNAVAILABLE_LABEL[box.status] ?? '目前無法預約')}
          </button>
        </>
      }
    >
      <div className="ew-hero">
        {box.imageUrl ? (
          <img src={box.imageUrl} alt="" />
        ) : (
          <div className="ew-card-media-fallback" aria-hidden="true">
            {box.storeName.slice(0, 1)}
          </div>
        )}
      </div>

      <div className="ew-detail">
        <div className="ew-chiprow" style={{ marginTop: 0 }}>
          <span className="ew-chip" style={{ background: colors.bg, color: colors.fg }}>
            {categoryLabel(box.category)}
          </span>
          {box.remainingCount > 0 && available && (
            <span className="ew-chip ew-chip-neutral">剩 {box.remainingCount} 份</span>
          )}
        </div>

        <h2 className="ew-h1" style={{ marginTop: 10 }}>
          {box.name}
        </h2>
        {box.description && <p className="ew-sub">{box.description}</p>}

        <section className="ew-panel">
          <p className="ew-panel-title">取貨</p>
          <div className="ew-inforow">
            <span className="ew-inforow-label">時段</span>
            <span className="ew-inforow-value ew-inforow-strong">
              今天 {pickup || '請洽店家'}
            </span>
          </div>
          <div className="ew-inforow">
            <span className="ew-inforow-label">地點</span>
            <span className="ew-inforow-value">{box.storeAddress || '請洽店家'}</span>
          </div>
          {walk && station && (
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
        </section>

        <section className="ew-panel">
          <p className="ew-panel-title">店家</p>
          <div className="ew-card-store" style={{ marginTop: 10, fontSize: 15, color: 'inherit' }}>
            <StoreMark box={box} />
            <span style={{ fontWeight: 700 }}>{box.storeName}</span>
          </div>
          {box.thumbsUpCount > 0 && (
            <p className="ew-note">已有 {box.thumbsUpCount} 位顧客給這家店好評。</p>
          )}
          <div className="ew-inforow" style={{ marginTop: 8 }}>
            <span className="ew-inforow-label">過敏原</span>
            <span className="ew-inforow-value">
              店家未提供
              <span className="ew-note" style={{ marginTop: 2 }}>
                平台目前未向店家蒐集過敏原欄位，請於取貨時向店員確認。
              </span>
            </span>
          </div>
        </section>

        <p className="ew-note">
          鮮款包的內容由店家依當天剩餘品項搭配，實際品項可能與照片不同。
        </p>
      </div>
    </Screen>
  )
}

/** How far the store is from the chosen station, or null when either end has no coordinates. */
function describeWalk(
  station: ReturnType<typeof findStation>,
  latitude: number | null,
  longitude: number | null,
) {
  if (!station || latitude === null || longitude === null) return null
  const meters = distanceMeters(station, { latitude, longitude })
  return {
    minutes: walkingMinutes(meters),
    direction: compassDirection(station, { latitude, longitude }),
    meters: Math.round(meters / 10) * 10,
  }
}

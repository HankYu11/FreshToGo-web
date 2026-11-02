import { isReservable, type Box } from '../../api'
import { categoryColors, categoryLabel } from '../categories'
import { formatPickupWindow, formatPrice } from '../format'
import type { NearbyBox } from '../nearby'
import { ClockIcon, WalkIcon } from './icons'

/** The store's logo, or its first character when it has none — same fallback as the app. */
export function StoreMark({ box }: { box: Box }) {
  if (box.storeLogoUrl) {
    return <img className="ew-storemark" src={box.storeLogoUrl} alt="" />
  }
  return (
    <span className="ew-storemark ew-storemark-initial" aria-hidden="true">
      {box.storeName.slice(0, 1)}
    </span>
  )
}

function statusPill(box: Box) {
  switch (box.status) {
    case 'SOLD_OUT':
      return { label: '已售完', warn: true }
    case 'BEFORE_SALE':
      return { label: '尚未開賣', warn: false }
    case 'EXPIRED':
      return { label: '已結束', warn: false }
    case 'ALMOST_SOLD_OUT':
      return { label: `僅剩 ${box.remainingCount} 份`, warn: true }
    default:
      return box.remainingCount > 0
        ? { label: `剩 ${box.remainingCount} 份`, warn: false }
        : null
  }
}

/**
 * One pack in the station list.
 *
 * A button rather than a link: the whole flow is driven by taps, never by a swipe, so it
 * cannot fight the system back gesture on either platform. Everything inside is a <span> —
 * a button may only contain phrasing content, so the usual <div>/<p> would be invalid markup.
 */
export default function BoxCard({
  nearby,
  onSelect,
}: {
  nearby: NearbyBox
  onSelect: () => void
}) {
  const { box, walkMinutes, direction } = nearby
  const colors = categoryColors(box.category)
  const pill = statusPill(box)
  const available = isReservable(box.status)
  const pickup = formatPickupWindow(box.pickupTimeStart, box.pickupTimeEnd)

  // The card's text nodes concatenate into one run-on string for a screen reader
  // ("剩 4 份省66%…"), so the button states its own name in the order it would be read.
  const label = [
    box.storeName,
    box.name,
    categoryLabel(box.category),
    formatPrice(box.discountedPrice),
    pickup && `取貨 ${pickup}`,
    `出站往${direction}步行約 ${walkMinutes} 分`,
    pill?.label,
  ]
    .filter(Boolean)
    .join('，')

  return (
    <button
      type="button"
      className={`ew-card ${available ? '' : 'ew-card-unavailable'}`}
      onClick={onSelect}
      aria-label={label}
    >
      <span className="ew-card-media">
        {box.imageUrl ? (
          <img src={box.imageUrl} alt="" loading="lazy" />
        ) : (
          <span className="ew-card-media-fallback" aria-hidden="true">
            {box.storeName.slice(0, 1)}
          </span>
        )}
        {pill && <span className={`ew-pill ${pill.warn ? 'ew-pill-warn' : ''}`}>{pill.label}</span>}
        {box.discountPercent > 0 && (
          <span className="ew-medallion">
            <span className="ew-medallion-unit">省</span>
            <span className="ew-medallion-num">{box.discountPercent}</span>
            <span className="ew-medallion-unit">%</span>
          </span>
        )}
      </span>

      <span className="ew-card-body">
        <span className="ew-card-store">
          <StoreMark box={box} />
          <span>{box.storeName}</span>
        </span>

        <span className="ew-card-name">{box.name}</span>

        <span className="ew-chiprow">
          <span className="ew-chip" style={{ background: colors.bg, color: colors.fg }}>
            {categoryLabel(box.category)}
          </span>
        </span>

        {pickup && (
          <span className="ew-metarow">
            <ClockIcon />
            取貨 {pickup}
          </span>
        )}

        <span className="ew-metarow">
          <WalkIcon />
          出站往{direction}步行約 {walkMinutes} 分
        </span>

        <span className="ew-pricerow">
          <span className="ew-price">{formatPrice(box.discountedPrice)}</span>
          {box.originalPrice > box.discountedPrice && (
            <span className="ew-price-original">{formatPrice(box.originalPrice)}</span>
          )}
        </span>
      </span>
    </button>
  )
}

import { isReservable, type Box } from '../../api'
import { categoryLabel, categoryWash } from '../categories'
import { formatPickupWindow, statusPill } from '../format'
import type { NearbyBox } from '../nearby'
import FoodArt from './FoodArt'
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

/**
 * One pack in the feed, built to the app's listing card.
 *
 * The silhouette is deliberately lopsided and the illustration is torn off along its bottom
 * edge, so the card reads as a clipping rather than a container; the store's mark straddles that
 * tear, and the discount is carried by an oversized numeral in a category-tinted blob — the one
 * element sized to be read across a table. Ported from `MysteryBoxCard` / `ListingCardShape` /
 * `TornEdgeShape` rather than invented, so the webview and the app are recognisably one product.
 *
 * A button, not a link: the whole flow is driven by taps, never a swipe, so it cannot fight the
 * system back gesture. Everything inside is a <span>, because a button may only contain phrasing
 * content.
 */
export default function BoxCard({
  nearby,
  onSelect,
}: {
  nearby: NearbyBox
  onSelect: () => void
}) {
  const { box, walkMinutes, direction } = nearby
  const pill = statusPill(box)
  const available = isReservable(box.status)
  const pickup = formatPickupWindow(box.pickupTimeStart, box.pickupTimeEnd)

  const label = [
    box.storeName,
    box.name,
    categoryLabel(box.category),
    `${box.discountedPrice} 元`,
    pickup && `取貨 ${pickup}`,
    direction && `出站往${direction}步行約 ${walkMinutes} 分`,
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
      <span className="ew-card-media" style={{ background: categoryWash(box.category) }}>
        {box.imageUrl ? (
          <img src={box.imageUrl} alt="" loading="lazy" />
        ) : (
          <FoodArt category={box.category} />
        )}

        <span className="ew-card-kicker">{categoryLabel(box.category)}</span>
        {pill && <span className={`ew-pill ${pill.warn ? 'ew-pill-warn' : ''}`}>{pill.label}</span>}

        {/* The teeth are painted in the card's own surface colour, biting up into the art. */}
        <span className="ew-card-tear" aria-hidden="true" />
      </span>

      <span className="ew-card-body">
        <span className="ew-card-crest">
          <StoreMark box={box} />
        </span>

        {box.discountPercent > 0 && (
          <span className="ew-medallion" style={{ background: categoryWash(box.category) }}>
            −{box.discountPercent}%
          </span>
        )}

        <span className="ew-card-store">{box.storeName}</span>
        <span className="ew-card-name">{box.name}</span>

        <span className="ew-card-meta">
          {pickup && (
            <span className="ew-metaitem">
              <ClockIcon size={15} />
              取貨 {pickup}
            </span>
          )}
          {direction && (
            <span className="ew-metaitem">
              <WalkIcon size={15} />
              出站往{direction} {walkMinutes} 分
            </span>
          )}
        </span>

        <span className="ew-pricerow">
          <span className="ew-price">
            <span className="ew-price-unit">NT$</span>
            {box.discountedPrice}
          </span>
          {box.originalPrice > box.discountedPrice && (
            <span className="ew-price-original">NT${box.originalPrice}</span>
          )}
        </span>
      </span>
    </button>
  )
}

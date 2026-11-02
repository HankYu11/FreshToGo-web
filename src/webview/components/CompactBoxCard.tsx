import { isReservable } from '../../api'
import { categoryLabel, categoryWash } from '../categories'
import { formatPickupWindow } from '../format'
import type { NearbyBox } from '../nearby'
import FoodArt from './FoodArt'
import { WalkIcon } from './icons'

/**
 * A pack as one item in a station's row.
 *
 * Narrow enough that the next one peeks in from the right — the only honest way to say "there
 * is more along here" without a scrollbar a touch screen never draws. Carries the four things
 * that decide whether to tap: what it is, who from, how far, what it costs.
 */
export default function CompactBoxCard({
  nearby,
  onSelect,
}: {
  nearby: NearbyBox
  onSelect: () => void
}) {
  const { box, walkMinutes, direction } = nearby
  const available = isReservable(box.status)
  const pickup = formatPickupWindow(box.pickupTimeStart, box.pickupTimeEnd)

  const label = [
    box.storeName,
    box.name,
    `${box.discountedPrice} 元`,
    pickup && `取貨 ${pickup}`,
    direction && `步行約 ${walkMinutes} 分`,
    !available && '目前無法預約',
  ]
    .filter(Boolean)
    .join('，')

  return (
    <button
      type="button"
      className={`ew-mini ${available ? '' : 'ew-mini-unavailable'}`}
      onClick={onSelect}
      aria-label={label}
    >
      <span className="ew-mini-art" style={{ background: categoryWash(box.category) }}>
        <FoodArt category={box.category} />
        {box.discountPercent > 0 && (
          <span className="ew-mini-off">−{box.discountPercent}%</span>
        )}
      </span>
      <span className="ew-mini-body">
        <span className="ew-mini-cat">{categoryLabel(box.category)}</span>
        <span className="ew-mini-name">{box.name}</span>
        <span className="ew-mini-store">{box.storeName}</span>
        <span className="ew-mini-foot">
          <span className="ew-mini-price">NT${box.discountedPrice}</span>
          {direction && (
            <span className="ew-mini-walk">
              <WalkIcon size={13} />
              {walkMinutes} 分
            </span>
          )}
        </span>
      </span>
    </button>
  )
}

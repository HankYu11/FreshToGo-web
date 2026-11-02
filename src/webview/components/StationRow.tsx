import type { NearbyBox } from '../nearby'
import type { Station } from '../stations'
import CompactBoxCard from './CompactBoxCard'
import { ChevronRightIcon, PinIcon } from './icons'

/**
 * One station's packs, as a row you push sideways.
 *
 * The pilot is a line, not a neighbourhood: a commuter's choice is which stop to get off at, so
 * the feed is organised by stop rather than as one flat list where 台北車站 and 龍山寺 sit
 * shoulder to shoulder with nothing saying they are twenty minutes apart.
 *
 * Horizontal scrolling here is native and vertical scrolling still works, because the row only
 * claims the horizontal axis (touch-action: pan-x). It starts clear of the screen edge, so a
 * drag that begins on a card is never the one the OS wants for its back gesture.
 */
export default function StationRow({
  station,
  packs,
  onSelectStation,
  onSelectPack,
}: {
  station: Station
  packs: NearbyBox[]
  onSelectStation: () => void
  onSelectPack: (boxId: string) => void
}) {
  if (packs.length === 0) return null

  return (
    <section className="ew-stationsection">
      <button type="button" className="ew-stationsection-head" onClick={onSelectStation}>
        <PinIcon size={15} />
        <span className="ew-stationsection-name">{station.fullName}</span>
        <span className="ew-stationsection-count">{packs.length} 款</span>
        <ChevronRightIcon size={17} className="ew-chevron" />
      </button>

      <div className="ew-stationrow">
        {packs.map((item) => (
          <CompactBoxCard
            key={item.box.id}
            nearby={item}
            onSelect={() => onSelectPack(item.box.id)}
          />
        ))}
      </div>
    </section>
  )
}

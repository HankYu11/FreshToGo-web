import { isReservable, type Box, type ProductCategory } from '../api'
import { toNearby, type NearbyBox } from './nearby'
import {
  MINUTES_PER_STOP,
  STATION_RADIUS_M,
  minutesToStation,
  stationsOnRoute,
  type Station,
} from './stations'

/** One pack on the route, with the stop it belongs to and when the rider gets there. */
export interface RoutePack extends NearbyBox {
  station: Station
  /** Minutes from boarding to arriving at that stop. */
  minutesToArrive: number
  /** Clock time the rider could be at the counter: arrival plus the walk. */
  reachableAt: Date
}

/** "HH:mm" on today's date, in the viewer's own clock. */
function atClockTime(time: string): Date | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time)
  if (!match) return null
  const when = new Date()
  when.setHours(Number(match[1]), Number(match[2]), 0, 0)
  return when
}

export function formatClock(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/**
 * The packs a rider could actually collect on this journey, in travel order.
 *
 * Two rules, both from the proposal. A pack counts only if the store is inside the station's
 * catchment, and only if the rider would still be inside its pickup window when they got there
 * — boarding time, plus the ride, plus the walk from the platform. Recommending a pack that
 * closes before the train arrives is the one thing this screen must not do.
 */
export function packsOnRoute(
  boxes: Box[],
  from: Station,
  to: Station,
  boardingAt: Date,
): RoutePack[] {
  const route = stationsOnRoute(from, to)
  const packs: RoutePack[] = []

  for (const station of route) {
    const minutesToArrive = minutesToStation(route, station)

    for (const box of boxes) {
      if (!isReservable(box.status)) continue

      const nearby = toNearby(box, station)
      if (nearby.meters > STATION_RADIUS_M || !nearby.direction) continue

      const reachableAt = new Date(
        boardingAt.getTime() + (minutesToArrive + nearby.walkMinutes) * 60_000,
      )
      const closesAt = atClockTime(box.pickupTimeEnd)
      const opensAt = atClockTime(box.pickupTimeStart)
      if (!closesAt || !opensAt) continue

      // Too late to collect it, or the window has not opened by the time they get there.
      // `opensAt` was computed and then only null-checked, so a pack that opens at 18:00 was
      // offered to someone arriving at 16:03 — with 到站時還拿得到 printed on the card.
      if (reachableAt > closesAt || reachableAt < opensAt) continue

      packs.push({ ...nearby, station, minutesToArrive, reachableAt })
    }
  }

  // One pack can sit inside two stations' catchments; keep it at the first stop reached.
  const seen = new Set<string>()
  return packs.filter((pack) => {
    if (seen.has(pack.box.id)) return false
    seen.add(pack.box.id)
    return true
  })
}

export { MINUTES_PER_STOP }

/** One stop on the journey, with what is waiting there when the rider reaches it. */
export interface RouteStop {
  station: Station
  /** Minutes from boarding to arriving at that stop. */
  minutesToArrive: number
  /** Clock time the train gets there. */
  arriveAt: Date
  packs: RoutePack[]
  /** Distinct stores, since one store can have put out several packs. */
  storeCount: number
  /** Distinct categories, in travel order, for the thumbnails on the route. */
  categories: ProductCategory[]
}

/**
 * The journey as a list of stops rather than a list of packs.
 *
 * Same packs, grouped by where they get collected — which is how a rider reads a line: not
 * "twenty-five packs" but "five at 西門 at 18:13, seven at 龍山寺 at 18:15". Every stop on the
 * route is listed, including the ones with nothing, because a gap in the middle of a line is
 * information too.
 */
export function stopsOnRoute(
  packs: RoutePack[],
  route: Station[],
  boardingAt: Date,
): RouteStop[] {
  return route.map((station) => {
    const minutesToArrive = minutesToStation(route, station)
    const here = packs.filter((pack) => pack.station.id === station.id)
    const categories: ProductCategory[] = []
    const stores = new Set<string>()

    for (const pack of here) {
      stores.add(pack.box.merchantId || pack.box.storeName)
      if (!categories.includes(pack.box.category)) categories.push(pack.box.category)
    }

    return {
      station,
      minutesToArrive,
      arriveAt: new Date(boardingAt.getTime() + minutesToArrive * 60_000),
      packs: here,
      storeCount: stores.size,
      categories,
    }
  })
}

/**
 * A boarding time that would actually have something to show, when the chosen one does not.
 *
 * The rule above is doing its job when it finds nothing at 23:20 — every window has closed. But
 * a screen that only says "nothing" leaves it unclear whether the feature works or the data is
 * missing, so the empty state offers a time that does, picked by trying the evening hours and
 * keeping the one with the most packs.
 */
export function suggestBoardingTime(
  boxes: Box[],
  from: Station,
  to: Station,
): { clock: string; count: number } | null {
  const candidates = ['16:00', '17:00', '18:00', '19:00', '20:00']
  let best: { clock: string; count: number } | null = null

  for (const clock of candidates) {
    const at = atClockTime(clock)
    if (!at) continue
    const count = packsOnRoute(boxes, from, to, at).length
    if (count > 0 && (!best || count > best.count)) best = { clock, count }
  }
  return best
}

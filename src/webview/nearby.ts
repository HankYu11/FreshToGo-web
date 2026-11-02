import { isReservable, type Box } from '../api/boxes'
import {
  STATION_RADIUS_M,
  compassDirection,
  distanceMeters,
  walkingMinutes,
  type Station,
} from './stations'

/** A listing placed relative to the station the commuter gets off at. */
export interface NearbyBox {
  box: Box
  meters: number
  walkMinutes: number
  /** Eight-point compass direction from the station concourse. */
  direction: string
}

/**
 * The listings within walking distance of a station, best first.
 *
 * Nothing on the server knows about stations, so the whole of this is client-side: take
 * today's listings, keep those whose store has coordinates inside [STATION_RADIUS_M], and
 * sort what is still reservable above what is sold out or not yet on sale. A listing whose
 * store has no coordinates cannot be placed and is left out rather than guessed at.
 */
export function boxesNearStation(boxes: Box[], station: Station): NearbyBox[] {
  const nearby: NearbyBox[] = []

  for (const box of boxes) {
    const { storeLatitude: latitude, storeLongitude: longitude } = box
    if (latitude === null || longitude === null) continue

    const meters = distanceMeters(station, { latitude, longitude })
    if (meters > STATION_RADIUS_M) continue

    nearby.push({
      box,
      meters,
      walkMinutes: walkingMinutes(meters),
      direction: compassDirection(station, { latitude, longitude }),
    })
  }

  return nearby.sort((a, b) => {
    const aOpen = isReservable(a.box.status)
    const bOpen = isReservable(b.box.status)
    if (aOpen !== bOpen) return aOpen ? -1 : 1
    return a.meters - b.meters
  })
}

/** How many reservable listings each station has right now, keyed by station id. */
export function countsByStation(boxes: Box[], stations: Station[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const station of stations) {
    counts[station.id] = boxesNearStation(boxes, station).filter((n) =>
      isReservable(n.box.status),
    ).length
  }
  return counts
}

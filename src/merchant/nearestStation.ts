// The pilot's stations live with the consumer flow; the console reads the same list rather than
// keeping a second copy that could drift.
import { STATIONS, STATION_RADIUS_M, distanceMeters, type Station } from '../webview/stations'

/**
 * Which pilot station this store falls under, if any.
 *
 * The console shows it because nothing else does: a listing created by a store outside all
 * three catchments is a perfectly valid listing that simply never appears in the consumer
 * demo, and that is a confusing half-hour to spend.
 */
export function nearestStation(
  latitude: number | null,
  longitude: number | null,
): { station: Station; meters: number } | null {
  if (latitude === null || longitude === null) return null

  let best: { station: Station; meters: number } | null = null
  for (const station of STATIONS) {
    const meters = distanceMeters(station, { latitude, longitude })
    if (meters <= STATION_RADIUS_M && (!best || meters < best.meters)) {
      best = { station, meters: Math.round(meters) }
    }
  }
  return best
}

/**
 * The first three stations of the commuter pilot.
 *
 * Coordinates are the station concourse, accurate to roughly 50 m — enough to sort stores by
 * how far they are and which way to turn, not enough to name an exit. Nothing in the backend
 * models a station, so this list and everything derived from it lives entirely on the client.
 */
export interface Station {
  id: string
  name: string
  /** MRT line colours, for the line pip next to the name. */
  lines: string[]
  latitude: number
  longitude: number
}

export const STATIONS: Station[] = [
  { id: 'longshan', name: '龍山寺', lines: ['BL'], latitude: 25.0353, longitude: 121.4999 },
  { id: 'ximen', name: '西門', lines: ['BL', 'G'], latitude: 25.0421, longitude: 121.508 },
  { id: 'taipei-main', name: '台北車站', lines: ['BL', 'R'], latitude: 25.0462, longitude: 121.517 },
]

export function findStation(id: string | null | undefined): Station | undefined {
  return STATIONS.find((station) => station.id === id)
}

/** How far from a station a store can be and still count as "on the way home", in metres. */
export const STATION_RADIUS_M = 1000

const EARTH_RADIUS_M = 6371000
const toRad = (deg: number) => (deg * Math.PI) / 180

/** Great-circle distance in metres. */
export function distanceMeters(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const dLat = toRad(to.latitude - from.latitude)
  const dLon = toRad(to.longitude - from.longitude)
  const lat1 = toRad(from.latitude)
  const lat2 = toRad(to.latitude)

  const a =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}

/**
 * Minutes on foot, estimated.
 *
 * Straight-line distance stretched by 1.3 for streets that do not run point-to-point, over a
 * 80 m/min walking pace. It is an estimate and the UI labels it as one — there is no routing
 * service behind it.
 */
export function walkingMinutes(meters: number): number {
  return Math.max(1, Math.round((meters * 1.3) / 80))
}

const COMPASS = ['北', '東北', '東', '東南', '南', '西南', '西', '西北'] as const

/** Which way to set off from the station concourse — eight points, from the true bearing. */
export function compassDirection(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): string {
  const lat1 = toRad(from.latitude)
  const lat2 = toRad(to.latitude)
  const dLon = toRad(to.longitude - from.longitude)

  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  const bearing = (Math.atan2(y, x) * 180) / Math.PI

  const index = Math.round(((bearing + 360) % 360) / 45) % 8
  return COMPASS[index]
}

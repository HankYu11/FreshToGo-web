/**
 * The first three stations of the commuter pilot.
 *
 * Coordinates are the station concourse, accurate to roughly 50 m — enough to sort stores by
 * how far they are and which way to turn, not enough to name an exit. Nothing in the backend
 * models a station, so this list and everything derived from it lives entirely on the client.
 */
export interface Station {
  id: string
  /** Short name, for a sentence: 「龍山寺往東步行 4 分」. */
  name: string
  /** What a commuter calls the station. 台北車站 already ends in 站; 龍山寺 does not. */
  fullName: string
  /** MRT line colours, for the line pip next to the name. */
  lines: string[]
  /**
   * Position on the 板南線, west to east: 龍山寺 BL10, 西門 BL11, 台北車站 BL12.
   *
   * The three pilot stations are consecutive, which is what lets 吃 der take a boarding and an
   * alighting station and work out the stops in between.
   */
  sequence: number
  latitude: number
  longitude: number
}

export const STATIONS: Station[] = [
  {
    id: 'longshan',
    sequence: 10,
    name: '龍山寺',
    fullName: '龍山寺站',
    lines: ['BL'],
    latitude: 25.0353,
    longitude: 121.4999,
  },
  {
    id: 'ximen',
    sequence: 11,
    name: '西門',
    fullName: '西門站',
    lines: ['BL', 'G'],
    latitude: 25.0421,
    longitude: 121.508,
  },
  {
    id: 'taipei-main',
    sequence: 12,
    name: '台北車站',
    fullName: '台北車站',
    lines: ['BL', 'R'],
    latitude: 25.0462,
    longitude: 121.517,
  },
]

export function findStation(id: string | null | undefined): Station | undefined {
  return STATIONS.find((station) => station.id === id)
}

/**
 * How far from a station a store can be and still count as "on the way home", in metres.
 *
 * 700, not a round kilometre: 龍山寺 and 西門 are about 1.1 km apart, so a kilometre each way
 * made their catchments overlap heavily and a station's list filled up with stores by the next
 * one along. It also keeps the walk under about 11 minutes, which is as far as "順路" stretches.
 */
export const STATION_RADIUS_M = 700

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

/** Roughly how long the train takes between two adjacent stops on this line. */
export const MINUTES_PER_STOP = 3

/**
 * The stations a rider passes, boarding at one and getting off at the other, in travel order.
 *
 * Inclusive of both ends: 吃 der lists packs at every stop on the way, and the one you board at
 * counts — somebody can collect before they get on as easily as after they get off.
 */
export function stationsOnRoute(from: Station, to: Station): Station[] {
  const low = Math.min(from.sequence, to.sequence)
  const high = Math.max(from.sequence, to.sequence)
  const run = STATIONS.filter((s) => s.sequence >= low && s.sequence <= high)
  return from.sequence <= to.sequence ? run : [...run].reverse()
}

/** Minutes into the journey that the rider reaches a stop, counting from boarding. */
export function minutesToStation(route: Station[], station: Station): number {
  const index = route.findIndex((s) => s.id === station.id)
  return index < 0 ? 0 : index * MINUTES_PER_STOP
}

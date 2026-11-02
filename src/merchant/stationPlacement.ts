import { STATIONS, type Station } from '../webview/stations'

/**
 * A point a short walk from each pilot station, for standing a demo store up on dev.
 *
 * About 150 m out, which the consumer flow turns into a 2–3 minute walk — close enough to be
 * the "順路" the proposal describes, far enough not to look like it is inside the concourse.
 */
export interface Placement {
  station: Station
  latitude: number
  longitude: number
  address: string
}

// ~0.0013° of latitude is ~145 m; the same in longitude is ~130 m at this latitude.
const OFFSETS: Record<string, { dLat: number; dLon: number; address: string }> = {
  longshan: { dLat: 0.0012, dLon: -0.0012, address: '台北市萬華區西園路一段 120 號' },
  ximen: { dLat: 0.001, dLon: -0.0014, address: '台北市萬華區漢中街 50 號' },
  'taipei-main': { dLat: -0.0009, dLon: -0.0014, address: '台北市中正區館前路 8 號' },
}

export const PLACEMENTS: Placement[] = STATIONS.map((station) => {
  const offset = OFFSETS[station.id] ?? { dLat: 0.0012, dLon: 0, address: station.fullName }
  return {
    station,
    latitude: Number((station.latitude + offset.dLat).toFixed(6)),
    longitude: Number((station.longitude + offset.dLon).toFixed(6)),
    address: offset.address,
  }
})

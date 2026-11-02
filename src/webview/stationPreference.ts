const STORAGE_KEY = 'freshtogo.ew.station'

/**
 * The station the commuter last got off at.
 *
 * Kept in sessionStorage, not a route parameter, so that a detail or ticket screen opened
 * directly still knows which station to measure the walk from. Storage can be unavailable in
 * a webview, so every access is guarded and a miss simply means no walking distance is shown.
 */
export function readStationPreference(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeStationPreference(stationId: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, stationId)
  } catch {
    // Nothing to do — the flow carries the station in the URL from here on.
  }
}

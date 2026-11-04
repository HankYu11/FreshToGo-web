import { STATIONS, findStation, type Station } from './stations'

const STORAGE_KEY = 'freshtogo.ew.station'

/**
 * The station the commuter last got off at.
 *
 * Kept in storage rather than a route parameter, so a detail or ticket screen opened directly
 * still knows which station to measure the walk from — and in localStorage, so the choice
 * survives the host rebuilding its webview. Storage can be unavailable there, so every access
 * is guarded and a miss simply falls back to the first pilot station.
 */
export function readStationPreference(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeStationPreference(stationId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, stationId)
  } catch {
    // Nothing to do — the flow carries the station in the URL from here on.
  }
}

/**
 * The station every screen measures from: the stored one, or the first of the pilot.
 *
 * Derived rather than written on first load, so nothing has to mutate storage during a render
 * to make the rest of the app agree with the home screen.
 */
export function currentStation(): Station {
  return findStation(readStationPreference()) ?? STATIONS[0]
}

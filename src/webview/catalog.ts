import {
  createReservation,
  getBox,
  getReservation,
  getStoreProfile,
  listBoxes,
  listReservations,
  withSession,
  type Box,
  type Reservation,
  type StoreProfile,
} from '../api'
import {
  createDemoReservation,
  demoBox,
  demoBoxes,
  demoReservation,
  demoReservations,
  demoStore,
  isDemoId,
} from './demoCatalog'

/**
 * What the screens read, instead of calling the API directly.
 *
 * One rule, in one place: the dev backend is the source of truth, and the stand-in catalogue
 * fills in only when it has nothing listed for today. A seeded dev day never reaches the
 * fixtures; a day nobody seeded still has a demo instead of three empty stations.
 *
 * `usingStandIns` tells the screens which they got, so the feed can say so rather than leaving
 * anyone to guess.
 */

let standingIn = false

/** True when the last listing read fell back to the stand-in catalogue. */
export function usingStandIns() {
  return standingIn
}

export async function loadBoxes(signal?: AbortSignal): Promise<Box[]> {
  const live = await listBoxes(signal)
  standingIn = live.length === 0
  return standingIn ? demoBoxes() : live
}

export async function loadBox(id: string, signal?: AbortSignal): Promise<Box | null> {
  if (isDemoId(id)) return demoBox(id)
  return getBox(id, signal)
}

export async function loadStore(
  merchantId: string,
  signal?: AbortSignal,
): Promise<StoreProfile | null> {
  if (isDemoId(merchantId)) return demoStore(merchantId)
  return getStoreProfile(merchantId, signal)
}

export async function reserve(boxId: string): Promise<{ id: string }> {
  if (isDemoId(boxId)) return createDemoReservation(boxId)
  return withSession(() => createReservation(boxId))
}

export async function loadReservation(
  id: string,
  signal?: AbortSignal,
): Promise<Reservation | null> {
  if (isDemoId(id)) return demoReservation(id)
  return withSession(() => getReservation(id, signal))
}

/**
 * Every order this member holds: the backend's, plus any taken against a stand-in listing.
 *
 * Both can exist at once — the backend had listings when the member reserved this morning and
 * none by the time they came back — so the two are merged rather than chosen between.
 */
export async function loadReservations(signal?: AbortSignal): Promise<Reservation[]> {
  const local = demoReservations()
  try {
    const live = await withSession(() => listReservations({ signal }))
    return [...local, ...live]
  } catch (error) {
    if (local.length > 0) return local
    throw error
  }
}

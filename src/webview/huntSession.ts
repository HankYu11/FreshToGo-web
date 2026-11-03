/**
 * Where the 吃 der run had got to, so leaving the deck and coming back resumes it.
 *
 * Swiping a card up means 預約, and that leaves the screen: detail, checkout, ticket. React
 * Router unmounts the deck on the way out, so without this, Back from the detail page lands on
 * the set-up form with the journey, the position in the deck and everything kept all gone —
 * the history stack is right, the screen it returns to is simply empty.
 *
 * In memory rather than storage, and deliberately: a journey is only meaningful while the rider
 * is on it, and a deck resumed tomorrow would be built from a different day's packs. Losing it
 * when the host rebuilds the webview is the correct outcome, not a gap to paper over.
 */
export interface HuntSession {
  fromId: string
  toId: string
  boardingAt: string
  started: boolean
  index: number
  keptIds: string[]
  /** Packs reserved for real, which the deck must stop offering. */
  takenIds: string[]
}

let session: HuntSession | null = null

export function readHuntSession(): HuntSession | null {
  return session
}

export function writeHuntSession(next: HuntSession) {
  session = next
}

/**
 * A pack was actually reserved.
 *
 * Backing out of the detail page is not a decision — the card has to still be there, or a
 * change of mind would lose it with no way back. Completing the reservation is, so the deck
 * drops that pack and the position the rider returns to is the next one.
 */
export function noteHuntReservation(boxId: string) {
  if (!session || session.takenIds.includes(boxId)) return
  session = { ...session, takenIds: [...session.takenIds, boxId] }
}

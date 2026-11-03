import type { ReactNode } from 'react'

/**
 * Marks a step of the flow that stands in for something not built yet.
 *
 * Two things here are not what they appear: the host-app identity and the payment. Anyone shown
 * this demo has to be able to tell that from the screen rather than from the person holding the
 * phone — the payment above all, since it is the half of the proposal being asked for rather
 * than demonstrated. Used sparingly, and never removed to make a screen look finished.
 *
 * The listings no longer carry one. On the dev deployment the catalogue is whatever dev holds,
 * and the stand-ins that fill an unseeded day name themselves in the store (示範店).
 */
export default function SimulationNote({ children }: { children: ReactNode }) {
  return (
    <div className="ew-simnote">
      <span className="ew-simnote-badge">模擬</span>
      <span>{children}</span>
    </div>
  )
}

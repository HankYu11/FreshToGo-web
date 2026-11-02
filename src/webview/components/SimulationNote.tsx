import type { ReactNode } from 'react'

/**
 * Marks a part of the flow that is standing in for something not built yet.
 *
 * Used sparingly and never removed to make a screen look finished: the payment step and the
 * host-app identity are both simulated, and anyone shown this demo has to be able to tell
 * that from the screen itself rather than from the person holding the phone.
 */
export default function SimulationNote({ children }: { children: ReactNode }) {
  return (
    <div className="ew-simnote">
      <span className="ew-simnote-badge">模擬</span>
      <span>{children}</span>
    </div>
  )
}

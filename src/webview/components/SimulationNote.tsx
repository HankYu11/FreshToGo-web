import type { ReactNode } from 'react'

/**
 * Marks a part of the flow that is standing in for something not built yet, or data that is
 * not real.
 *
 * Used sparingly and never removed to make a screen look finished. Three things here are not
 * what they appear: the host-app identity, the payment, and the stores themselves — and anyone
 * shown this demo has to be able to tell that from the screen rather than from the person
 * holding the phone. The stores matter most: this is shown while proposing a partnership, and
 * a listing read as a signed merchant is a claim nobody made.
 */
export default function SimulationNote({
  children,
  label = '模擬',
}: {
  children: ReactNode
  /** 模擬 for a stand-in step, 示意 for stand-in data. */
  label?: string
}) {
  return (
    <div className="ew-simnote">
      <span className="ew-simnote-badge">{label}</span>
      <span>{children}</span>
    </div>
  )
}

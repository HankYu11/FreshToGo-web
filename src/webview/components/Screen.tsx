import type { ReactNode } from 'react'
import { ChevronLeftIcon } from './icons'

interface ScreenProps {
  title: string
  /** Rendered when the screen can be left by going back. Omitted on the entry screen. */
  onBack?: () => void
  /** A single control on the trailing side of the bar. */
  action?: ReactNode
  children: ReactNode
  /** Pinned above the home indicator — the primary action of the screen. */
  footer?: ReactNode
  /** Let the content run edge to edge (a hero image); the children own their padding. */
  flush?: boolean
}

/**
 * The frame every screen in the flow sits in.
 *
 * Deliberately minimal chrome: one 48×48 back control and a title. There is no bottom tab bar
 * and no brand header, because in the real integration the wallet app's own chrome is directly
 * above this and a second navigation layer would read as a separate app bolted on.
 */
export default function Screen({ title, onBack, action, children, footer, flush }: ScreenProps) {
  return (
    <div className="ew-screen">
      <header className="ew-appbar">
        <div className="ew-appbar-slot">
          {onBack && (
            <button type="button" className="ew-iconbutton" onClick={onBack} aria-label="返回">
              <ChevronLeftIcon />
            </button>
          )}
        </div>
        <h1 className="ew-appbar-title">{title}</h1>
        <div className="ew-appbar-slot">{action}</div>
      </header>

      <main
        className={[
          'ew-body',
          flush ? 'ew-body-flush' : '',
          footer ? 'ew-body-with-footer' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </main>

      {footer && <div className="ew-footer">{footer}</div>}
    </div>
  )
}

import type { ReactNode } from 'react'
import TabBar from './TabBar'
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
  /** A top-level section: carries the bottom navigation instead of a back control. */
  tab?: boolean
  /** A floating action, pinned clear of the bottom navigation and the home indicator. */
  fab?: ReactNode
  /**
   * Let the content spread into whatever height is left.
   *
   * For a screen that is one object rather than a list — the 吃 der deck is a single card above
   * a tall footer, and on a big phone it would otherwise hang under the route with a field of
   * empty page below it.
   */
  centred?: boolean
}

/**
 * The frame every screen in the flow sits in.
 *
 * Deliberately minimal chrome at the top: one 48×48 back control and a title, and no brand
 * header — in the real integration the wallet app's own chrome sits directly above this, and a
 * second header would read as a separate app bolted on. The bottom navigation is a different
 * matter: it is this product's own, carried by the three top-level sections via `tab`.
 */
export default function Screen({
  title,
  onBack,
  action,
  children,
  footer,
  flush,
  tab,
  fab,
  centred,
}: ScreenProps) {
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
          centred ? 'ew-body-centred' : '',
          footer || tab ? 'ew-body-with-footer' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </main>

      {fab && <div className={`ew-fabslot ${tab ? 'ew-fabslot-overtabs' : ''}`}>{fab}</div>}
      {footer && <div className="ew-footer">{footer}</div>}
      {tab && <TabBar />}
    </div>
  )
}

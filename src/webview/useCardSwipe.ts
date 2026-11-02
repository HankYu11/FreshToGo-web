import { useRef, useState } from 'react'

export type SwipeDecision = 'skip' | 'keep' | 'take'

/**
 * Drag-to-decide for the 吃 der card.
 *
 * Swiping inside a webview is fine — what collides with the system is an EDGE swipe. iOS only
 * arms its interactive pop from the left ~20pt (and WKWebView ships with
 * `allowsBackForwardNavigationGestures` off anyway), and Android's predictive back arms from
 * ~24dp of either edge. A drag that starts away from both edges is ours, so the only real rules
 * are: ignore a gesture that begins in the gutter, and tell the browser we are handling the
 * touch so it does not scroll the page underneath.
 *
 * The buttons stay regardless. A gesture nobody can see is not an interface on its own, and a
 * thumb on a crowded train finds a button faster than it finds a drag.
 */

/** Keep clear of both edges, with room to spare over the ~24dp the platforms claim. */
const EDGE_GUTTER = 32
const COMMIT_X = 88
const COMMIT_UP = 112

interface Options {
  onDecide: (decision: SwipeDecision) => void
  enabled?: boolean
}

export function useCardSwipe({ onDecide, enabled = true }: Options) {
  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null)
  const [flyOut, setFlyOut] = useState<SwipeDecision | null>(null)
  const start = useRef<{ x: number; y: number; id: number } | null>(null)

  function reset() {
    start.current = null
    setOffset(null)
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    if (!enabled || flyOut) return
    // A gesture that begins in the edge gutter belongs to the OS, not to us.
    if (event.clientX < EDGE_GUTTER || event.clientX > window.innerWidth - EDGE_GUTTER) return
    start.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
    event.currentTarget.setPointerCapture(event.pointerId)
    setOffset({ x: 0, y: 0 })
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    const from = start.current
    if (!from || from.id !== event.pointerId) return
    setOffset({ x: event.clientX - from.x, y: event.clientY - from.y })
  }

  function onPointerCancel(event: React.PointerEvent<HTMLElement>) {
    // The browser/OS took the gesture over (e.g. a system edge swipe): drop it, never commit it.
    if (start.current?.id === event.pointerId) reset()
  }

  function onPointerUp(event: React.PointerEvent<HTMLElement>) {
    const from = start.current
    if (!from || from.id !== event.pointerId) return

    const dx = event.clientX - from.x
    const dy = event.clientY - from.y
    reset()

    // Up beats sideways: reserving is the decision worth protecting from a sloppy diagonal.
    if (dy < -COMMIT_UP && Math.abs(dy) > Math.abs(dx)) return commit('take')
    if (dx > COMMIT_X) return commit('keep')
    if (dx < -COMMIT_X) return commit('skip')
  }

  function commit(decision: SwipeDecision) {
    setFlyOut(decision)
    window.setTimeout(() => {
      setFlyOut(null)
      onDecide(decision)
    }, 170)
  }

  const dragging = offset !== null && (offset.x !== 0 || offset.y !== 0)

  const style: React.CSSProperties = flyOut
    ? {
        transform:
          flyOut === 'take'
            ? 'translateY(-130%) rotate(-4deg)'
            : `translateX(${flyOut === 'keep' ? '130%' : '-130%'}) rotate(${flyOut === 'keep' ? 14 : -14}deg)`,
        opacity: 0,
        transition: 'transform 0.17s ease-in, opacity 0.17s ease-in',
      }
    : offset
      ? {
          transform: `translate(${offset.x}px, ${Math.min(offset.y, 40)}px) rotate(${offset.x / 22}deg)`,
          transition: dragging ? 'none' : 'transform 0.2s ease-out',
        }
      : { transition: 'transform 0.2s ease-out' }

  /** Which decision the current drag is leaning towards, for the on-card hint. */
  const leaning: SwipeDecision | null = (() => {
    if (!offset) return null
    if (offset.y < -COMMIT_UP / 2 && Math.abs(offset.y) > Math.abs(offset.x)) return 'take'
    if (offset.x > COMMIT_X / 2) return 'keep'
    if (offset.x < -COMMIT_X / 2) return 'skip'
    return null
  })()

  return {
    style,
    leaning,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    /** Drive the same animation from the buttons, so both paths look identical. */
    decideFromButton: commit,
    busy: flyOut !== null,
  }
}

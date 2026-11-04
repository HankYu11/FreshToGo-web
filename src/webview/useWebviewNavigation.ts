import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Navigation that stays in step with the phone's own back gesture.
 *
 * A back control that calls `navigate('/somewhere')` PUSHES a new entry, so the history
 * becomes [picker, list, detail, list] and the next system back-swipe goes *forward* to the
 * detail screen the user just left. On a phone that reads as the page fighting the OS. So the
 * back control pops instead, and only falls back to an explicit destination when there is
 * nothing to pop — which is the case when the screen was opened by a deep link.
 *
 * How far back we can go comes from React Router's own history index, not from the location
 * key. The key only says that navigate() was called at some point — and `replace` mints a new
 * key without adding an entry, so a screen reached by replacing the very first one looked
 * poppable and was not. The ticket pops two entries at the end of its flow; on a stack one
 * deep that walked out of the demo and back to whatever the tab held before it.
 */
function depth() {
  try {
    return (window.history.state as { idx?: number } | null)?.idx ?? 0
  } catch {
    return 0
  }
}

export function useWebviewNavigation() {
  const navigate = useNavigate()
  // Read on every render rather than memoised: the index changes under us on every navigation.
  const location = useLocation()
  void location
  const canPop = depth() > 0

  const goBack = useCallback(
    (fallback: string) => {
      if (canPop) navigate(-1)
      else navigate(fallback, { replace: true })
    },
    [canPop, navigate],
  )

  /** A deliberate move forward — grows the history, as a tap on a card should. */
  const goTo = useCallback((to: string) => navigate(to), [navigate])

  /** Swap the current screen out, so Back skips over it. */
  const replaceTo = useCallback(
    (to: string, state?: unknown) => navigate(to, { replace: true, state }),
    [navigate],
  )

  /**
   * Pop several entries at once, for a screen that ends a flow.
   *
   * Replacing the current entry with the destination would leave everything underneath it in
   * place: from the ticket, a replace back to the station list gives
   * [picker, list, detail, list] — and the next Back goes *down* into the detail screen for the
   * pack just reserved. Popping removes those entries instead, so the stack matches what the
   * screen says it is doing.
   */
  const goBackBy = useCallback(
    (steps: number, fallback: string) => {
      // Never more than the stack holds: popping past the first entry leaves the webview.
      const back = Math.min(Math.abs(steps), depth())
      if (back > 0) navigate(-back)
      else navigate(fallback, { replace: true })
    },
    [navigate],
  )

  return { goBack, goBackBy, goTo, replaceTo }
}

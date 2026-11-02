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
 * React Router gives the first entry of a history session the key `default`; any other key
 * means this screen was navigated to and there is somewhere to go back to.
 */
export function useWebviewNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const canPop = location.key !== 'default'

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
  const replaceTo = useCallback((to: string) => navigate(to, { replace: true }), [navigate])

  return { goBack, goTo, replaceTo }
}

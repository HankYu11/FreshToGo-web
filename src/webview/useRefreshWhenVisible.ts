import { useEffect } from 'react'

/**
 * Ask the server again when the webview comes back to the front.
 *
 * Redemption happens somewhere else — the counter's own screen — so the phone's copy of a
 * reservation goes stale while nobody is looking at it. The customer holds up the code, the
 * merchant scans it, and without this the ticket would still say 預約成功 until something
 * navigated. Coming back to the page is exactly the moment it is worth asking again.
 *
 * Both events, because they fire in different situations: `visibilitychange` covers a tab or
 * app switch, and `pageshow` covers a back-forward cache restore, which does not fire the
 * other one.
 *
 * `enabled` is how a screen says it has nothing left to learn. A collected or cancelled
 * reservation is final; re-fetching it every time the phone wakes is just noise.
 */
export function useRefreshWhenVisible(refresh: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) refresh()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [refresh, enabled])
}

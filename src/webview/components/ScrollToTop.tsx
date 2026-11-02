import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Put every screen at the top when it opens.
 *
 * React Router keeps the window's scroll position across navigations, so tapping the fourth
 * card in a list opens the detail screen already scrolled past its photo and title. `instant`
 * is required rather than merely tidy: the site sets `html { scroll-behavior: smooth }`, and
 * an animated scroll on every transition is what gives away a web page pretending to be a
 * screen. (`EasyWalletApp` also pins `scroll-behavior: auto` while the flow is mounted, for
 * any scrolling it does not start here.)
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

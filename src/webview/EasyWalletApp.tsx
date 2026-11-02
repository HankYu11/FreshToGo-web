import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import BoxDetailPage from './pages/BoxDetailPage'
import CheckoutPage from './pages/CheckoutPage'
import HomePage from './pages/HomePage'
import OrdersPage from './pages/OrdersPage'
import ProfilePage from './pages/ProfilePage'
import StationPage from './pages/StationPage'
import StorePage from './pages/StorePage'
import TicketPage from './pages/TicketPage'
import './EasyWallet.css'

/**
 * The consumer flow as it would run inside a wallet app's webview.
 *
 * Mounted under /easywallet and self-contained: its own stylesheet, its own routes, and no
 * shared chrome with the marketing site. Nothing here links out to an app store or asks anyone
 * to install anything — the whole point of the proposal is that there is nothing to install.
 */
export default function EasyWalletApp() {
  useEffect(() => {
    const previousTitle = document.title
    // Matches easywallet.html's <title>. The flow is also reachable by a client-side link from
    // /demo, where the document still carries the marketing page's title — and dropping the
    // 合作提案展示 suffix there would undo the point of putting it in the markup.
    document.title = '鮮款款｜下班順路帶一包（合作提案展示）'

    // The page background is on .ew-root, but an iOS rubber-band scroll reveals the <body>
    // behind it — which the marketing site leaves white. Match them while the flow is mounted.
    const previousBackground = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#f6f8f7'

    // index.css sets `html { scroll-behavior: smooth }` for the marketing page's anchor links.
    // Inside the flow that animates every screen transition, which reads as a web page.
    const root = document.documentElement
    const previousScrollBehavior = root.style.scrollBehavior
    root.style.scrollBehavior = 'auto'

    return () => {
      document.title = previousTitle
      document.body.style.backgroundColor = previousBackground
      root.style.scrollBehavior = previousScrollBehavior
    }
  }, [])

  return (
    <div className="ew-root">
      <ScrollToTop />
      <Routes>
        {/* The three sections that carry the bottom navigation. */}
        <Route index element={<HomePage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="me" element={<ProfilePage />} />

        {/* Pushed over them, each with a back control instead. */}
        <Route path="stations" element={<StationPage />} />
        <Route path="box/:boxId" element={<BoxDetailPage />} />
        <Route path="store/:merchantId" element={<StorePage />} />
        <Route path="checkout/:boxId" element={<CheckoutPage />} />
        <Route path="ticket/:reservationId" element={<TicketPage />} />

        {/* Older links pointed at a per-station listing; the home feed is that now. */}
        <Route path="station/:stationId" element={<Navigate to="/easywallet" replace />} />
        <Route path="*" element={<Navigate to="/easywallet" replace />} />
      </Routes>
    </div>
  )
}

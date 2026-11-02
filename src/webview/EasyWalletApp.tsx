import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import BoxDetailPage from './pages/BoxDetailPage'
import BoxListPage from './pages/BoxListPage'
import CheckoutPage from './pages/CheckoutPage'
import StationPage from './pages/StationPage'
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
    const previous = document.title
    document.title = '鮮款款｜下班順路帶一包'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <div className="ew-root">
      <Routes>
        <Route index element={<StationPage />} />
        <Route path="station/:stationId" element={<BoxListPage />} />
        <Route path="box/:boxId" element={<BoxDetailPage />} />
        <Route path="checkout/:boxId" element={<CheckoutPage />} />
        <Route path="ticket/:reservationId" element={<TicketPage />} />
        <Route path="*" element={<Navigate to="/easywallet" replace />} />
      </Routes>
    </div>
  )
}

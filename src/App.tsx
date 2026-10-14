import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DownloadPage from './pages/DownloadPage'
import PrivacyPage from './pages/PrivacyPage'
import AccountDeletionPage from './pages/AccountDeletionPage'
import MerchantApplicationPage from './pages/MerchantApplicationPage'
import BoxLinkPage from './pages/BoxLinkPage'
import KnockLinkPage from './pages/KnockLinkPage'
import { DEMO_ENABLED } from './demo/enabled'

// Dev-only demo pages, loaded on demand and left out of the production bundle.
const demoPages = DEMO_ENABLED
  ? { Hub: lazy(() => import('./demo/DemoHubPage')), AiPack: lazy(() => import('./demo/AiPackPage')) }
  : null

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/download" element={<DownloadPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/account-deletion" element={<AccountDeletionPage />} />
      <Route path="/merchant-apply" element={<MerchantApplicationPage />} />
      <Route path="/box/:boxId" element={<BoxLinkPage />} />
      <Route path="/knock/:knockId" element={<KnockLinkPage />} />
      {demoPages && (
        <>
          <Route path="/demo" element={<Suspense fallback={null}><demoPages.Hub /></Suspense>} />
          <Route path="/demo/ai-pack" element={<Suspense fallback={null}><demoPages.AiPack /></Suspense>} />
        </>
      )}
    </Routes>
  )
}

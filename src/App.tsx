import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DownloadPage from './pages/DownloadPage'
import PrivacyPage from './pages/PrivacyPage'
import AccountDeletionPage from './pages/AccountDeletionPage'
import MerchantApplicationPage from './pages/MerchantApplicationPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/download" element={<DownloadPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/account-deletion" element={<AccountDeletionPage />} />
      <Route path="/merchant-apply" element={<MerchantApplicationPage />} />
    </Routes>
  )
}

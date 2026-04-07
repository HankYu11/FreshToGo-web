import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { trackEvent } from '../api'
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '../constants'
import { t } from '../i18n'
import './DownloadPage.css'

type Platform = 'ios' | 'android' | 'web_mobile' | 'web_desktop'

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  if (/Mobi|Mobile/i.test(ua)) return 'web_mobile'
  return 'web_desktop'
}

function getStoreUrl(platform: Platform): string | null {
  if (platform === 'ios') return APP_STORE_URL
  if (platform === 'android') return GOOGLE_PLAY_URL
  return null
}

export default function DownloadPage() {
  const [searchParams] = useSearchParams()
  const platform = detectPlatform()
  const storeUrl = getStoreUrl(platform)
  const [showLanding, setShowLanding] = useState(!storeUrl)
  const lang = /^zh\b/i.test(navigator.language) ? 'zh' : 'en'
  const i = t(lang)

  useEffect(() => {
    // Fire page_visit event (fire-and-forget)
    trackEvent({
      event_type: 'page_visit',
      event_category: 'web',
      platform,
      ref_type: 'page',
      ref_id: '/download',
      source: searchParams.get('source'),
      campaign: searchParams.get('campaign'),
      medium: searchParams.get('medium'),
      event_time: new Date().toISOString(),
    })

    if (storeUrl) {
      // Mobile: attempt redirect, fallback to landing after 2s
      window.location.href = storeUrl
      const timer = setTimeout(() => setShowLanding(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, platform, storeUrl])

  return (
    <div className="download-page">
      {!showLanding ? (
        <div className="download-splash">
          <div className="download-logo">{i.nav.brand}</div>
          <div className="download-spinner" />
          <p className="download-loading">{i.download.loading}</p>
        </div>
      ) : (
        <div className="download-landing">
          <div className="download-logo">{i.nav.brand}</div>
          <h1 className="download-tagline">{i.download.tagline}</h1>
          <p className="download-subtitle">{i.download.subtitle}</p>
          <div className="download-buttons">
            <a
              href={APP_STORE_URL}
              className="download-btn download-btn-appstore"
              rel="noopener noreferrer"
            >
              <span className="download-btn-icon">🍎</span>
              {i.download.appStore}
            </a>
            <a
              href={GOOGLE_PLAY_URL}
              className="download-btn download-btn-google"
              rel="noopener noreferrer"
            >
              <span className="download-btn-icon">▶️</span>
              {i.download.googlePlay}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

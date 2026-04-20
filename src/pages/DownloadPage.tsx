import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { trackEvent } from '../api'
import appStoreIcon from '../assets/appstore-icon.svg'
import googlePlayIcon from '../assets/googleplay-icon.svg'
import { APP_SCHEME, APP_STORE_URL, GOOGLE_PLAY_URL, WEBSITE_URL } from '../constants'
import { t } from '../i18n'
import './DownloadPage.css'

type Platform = 'ios' | 'android' | 'web_mobile' | 'web_desktop'
type PageState = 'loading' | 'fallback'

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  // iPadOS 13+ reports as MacIntel but has touch support
  const isIpad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  if (/iPhone|iPad|iPod/i.test(ua) || isIpad) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  if (/Mobi|Mobile/i.test(ua)) return 'web_mobile'
  return 'web_desktop'
}

const platform = detectPlatform()
const isMobile = platform === 'ios' || platform === 'android'
const lang = /^zh\b/i.test(navigator.language) ? 'zh' : 'en'
const i = t(lang)

export default function DownloadPage() {
  const [searchParams] = useSearchParams()
  const [state, setState] = useState<PageState>(isMobile ? 'loading' : 'fallback')
  const hasFired = useRef(false)

  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true

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

    if (!isMobile) return

    window.location.href = APP_SCHEME

    const showFallback = () => setState('fallback')

    const timer = setTimeout(showFallback, 2000)

    const onVisibilityChange = () => {
      if (!document.hidden) showFallback()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const storeUrl = platform === 'ios' ? APP_STORE_URL : platform === 'android' ? GOOGLE_PLAY_URL : null
  const storeLabel = platform === 'ios' ? i.download.appStore : platform === 'android' ? i.download.googlePlay : null
  const storeIcon = platform === 'ios' ? appStoreIcon : googlePlayIcon
  const storeIconAlt = platform === 'ios' ? 'App Store' : 'Google Play'

  return (
    <div className="download-page">
      {state === 'loading' ? (
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
            {storeUrl ? (
              <a
                href={storeUrl}
                className={`download-btn ${platform === 'ios' ? 'download-btn-appstore' : 'download-btn-google'}`}
                rel="noopener noreferrer"
              >
                <img className="download-btn-icon" src={storeIcon} alt={storeIconAlt} />
                {storeLabel}
              </a>
            ) : (
              <a
                href={WEBSITE_URL}
                className="download-btn download-btn-website"
                target="_blank"
                rel="noopener noreferrer"
              >
                {i.download.website}
              </a>
            )}
            {isMobile && (
              <a
                href={WEBSITE_URL}
                className="download-link-website"
                target="_blank"
                rel="noopener noreferrer"
              >
                {i.download.website}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

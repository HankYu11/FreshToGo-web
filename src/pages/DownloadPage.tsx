import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { trackEvent } from '../api'
import StoreBadges from '../components/StoreBadges'
import { APP_SCHEME, WEBSITE_URL } from '../constants'
import { detectPlatform } from '../platform'
import { t, type Lang } from '../i18n'
import './DownloadPage.css'

type PageState = 'loading' | 'fallback'

const platform = detectPlatform()
const isMobile = platform === 'ios' || platform === 'android'
const lang: Lang = 'zh'
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
  }, [searchParams])

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
            <StoreBadges
              lang={lang}
              stores={platform === 'ios' ? ['ios'] : platform === 'android' ? ['android'] : ['ios', 'android']}
              className="download-store-badges"
            />
            <a
              href={WEBSITE_URL}
              className="download-link-website"
              target="_blank"
              rel="noopener noreferrer"
            >
              {i.download.website}
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

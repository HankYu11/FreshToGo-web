import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { trackEvent } from '../api'
import StoreBadges from '../components/StoreBadges'
import { APP_SCHEME, WEBSITE_URL } from '../constants'
import { detectPlatform } from '../platform'
import { t, type Lang } from '../i18n'
import './DownloadPage.css'

// Same rule as the app's resolveBoxShareLink: only a UUID id is handed to the app.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const platform = detectPlatform()
const isMobile = platform === 'ios' || platform === 'android'
const lang: Lang = 'zh'
const i = t(lang)

/**
 * Landing page for a shared box link (https://links.handyla.co/box/{id}). With the app installed,
 * App Links / Universal Links open the app before this page loads; it is reached when the app is
 * missing or the link was opened somewhere that skips them, such as an in-app browser.
 */
export default function BoxLinkPage() {
  const { boxId = '' } = useParams()
  const appLink = UUID.test(boxId) ? `${APP_SCHEME}box/${boxId}` : APP_SCHEME
  const [state, setState] = useState<'loading' | 'fallback'>(isMobile ? 'loading' : 'fallback')
  const hasFired = useRef(false)

  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true

    trackEvent({
      event_type: 'page_visit',
      event_category: 'web',
      platform,
      ref_type: 'page',
      ref_id: '/box',
      metadata: { boxId },
      event_time: new Date().toISOString(),
    })

    if (!isMobile) return

    window.location.href = appLink

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
  }, [appLink, boxId])

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
          <h1 className="download-tagline">{i.boxLink.title}</h1>
          <p className="download-subtitle">{i.boxLink.subtitle}</p>
          <div className="download-buttons">
            {isMobile && (
              <a href={appLink} className="download-open-app">
                {i.boxLink.openInApp}
              </a>
            )}
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

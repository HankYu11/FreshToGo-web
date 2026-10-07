import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getRecommendation, trackEvent, type RecommendationItem } from '../api'
import StoreBadges from '../components/StoreBadges'
import { APP_SCHEME, WEBSITE_URL } from '../constants'
import { detectPlatform } from '../platform'
import { t, type Lang } from '../i18n'
import './DownloadPage.css'
import './KnockLinkPage.css'

// Same rule as BoxLinkPage: only a UUID id is handed to the app or the API.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const platform = detectPlatform()
const isMobile = platform === 'ios' || platform === 'android'
const lang: Lang = 'zh'
const i = t(lang)

type Data =
  | { kind: 'loading' }
  | { kind: 'found'; item: RecommendationItem }
  | { kind: 'notFound' }
  | { kind: 'error' }

/**
 * Landing page for a shared 揪朋友一起敲 link (https://links.handyla.co/knock/{id}). With the app
 * installed, App Links / Universal Links open the app before this page loads; it is reached when the
 * app is missing or the link was opened somewhere that skips them, such as an in-app browser.
 *
 * Shows the store and how many neighbours knocked — never a threshold or progress toward one.
 */
export default function KnockLinkPage() {
  const { knockId = '' } = useParams()
  const isValidId = UUID.test(knockId)
  const appLink = isValidId ? `${APP_SCHEME}knock/${knockId}` : APP_SCHEME
  const [redirecting, setRedirecting] = useState(isMobile && isValidId)
  const [data, setData] = useState<Data>(isValidId ? { kind: 'loading' } : { kind: 'notFound' })
  const hasFired = useRef(false)

  useEffect(() => {
    if (!isValidId) return
    let cancelled = false
    getRecommendation(knockId)
      .then((item) => {
        if (!cancelled) setData(item ? { kind: 'found', item } : { kind: 'notFound' })
      })
      .catch(() => {
        if (!cancelled) setData({ kind: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [isValidId, knockId])

  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true

    trackEvent({
      event_type: 'page_visit',
      event_category: 'web',
      platform,
      ref_type: 'page',
      ref_id: '/knock',
      metadata: { knockId },
      event_time: new Date().toISOString(),
    })

    if (!isMobile || !isValidId) return

    window.location.href = appLink

    const showFallback = () => setRedirecting(false)
    const timer = setTimeout(showFallback, 2000)
    const onVisibilityChange = () => {
      if (!document.hidden) showFallback()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [appLink, isValidId, knockId])

  if (redirecting || data.kind === 'loading') {
    return (
      <div className="download-page">
        <div className="download-splash">
          <div className="download-logo">{i.nav.brand}</div>
          <div className="download-spinner" />
          <p className="download-loading">{i.download.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="download-page">
      <div className="download-landing">
        <div className="download-logo">{i.nav.brand}</div>
        <KnockContent data={data} />
        <div className="download-buttons">
          {isMobile && (
            <a href={appLink} className="download-open-app">
              {i.knockLink.openInApp}
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
    </div>
  )
}

function KnockContent({ data }: { data: Exclude<Data, { kind: 'loading' }> }) {
  if (data.kind === 'notFound') {
    return (
      <>
        <h1 className="download-tagline">{i.knockLink.notFoundTitle}</h1>
        <p className="download-subtitle">{i.knockLink.notFoundSubtitle}</p>
      </>
    )
  }
  if (data.kind === 'error') {
    return (
      <>
        <h1 className="download-tagline">{i.knockLink.errorTitle}</h1>
        <p className="download-subtitle">{i.knockLink.errorSubtitle}</p>
      </>
    )
  }

  const { item } = data
  const store = (
    <div className="knock-store">
      <div className="knock-store-name">{item.storeName}</div>
      <div className="knock-store-address">{item.storeAddress}</div>
    </div>
  )

  if (item.status === 'REJECTED') {
    return (
      <>
        <h1 className="download-tagline">{i.knockLink.status.REJECTED}</h1>
        {store}
        <p className="download-subtitle">{i.knockLink.rejectedSubtitle}</p>
      </>
    )
  }

  return (
    <>
      <h1 className="download-tagline">{i.knockLink.title}</h1>
      {store}
      <div className="knock-meta">
        <span className={`knock-status knock-status-${item.status.toLowerCase()}`}>
          {i.knockLink.status[item.status]}
        </span>
        <span className="knock-count">{i.knockLink.knockers(item.distinctKnockers)}</span>
      </div>
      <p className="download-subtitle">
        {item.status === 'ONBOARDED' ? i.knockLink.onboardedSubtitle : i.knockLink.subtitle}
      </p>
    </>
  )
}

import type { Lang } from '../i18n'
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '../constants'
import appStoreBadgeEn from '../assets/appstore-badge-en.svg'
import appStoreBadgeZh from '../assets/appstore-badge-zh.svg'
import googlePlayBadgeEn from '../assets/googleplay-badge-en.svg'
import googlePlayBadgeZh from '../assets/googleplay-badge-zh.svg'
import './StoreBadges.css'

type Store = 'ios' | 'android'

const badges = {
  ios: {
    url: APP_STORE_URL,
    src: { en: appStoreBadgeEn, zh: appStoreBadgeZh },
    alt: { en: 'Download on the App Store', zh: '在 App Store 下載' },
  },
  android: {
    url: GOOGLE_PLAY_URL,
    src: { en: googlePlayBadgeEn, zh: googlePlayBadgeZh },
    alt: { en: 'Get it on Google Play', zh: '立即從 Google Play 下載' },
  },
} as const

interface StoreBadgesProps {
  lang: Lang
  stores?: Store[]
  className?: string
}

export default function StoreBadges({ lang, stores = ['ios', 'android'], className }: StoreBadgesProps) {
  return (
    <div className={`official-store-badges${className ? ` ${className}` : ''}`}>
      {stores.map((store) => {
        const badge = badges[store]
        return (
          <a
            key={store}
            href={badge.url}
            className={`official-store-badge official-store-badge-${store}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img src={badge.src[lang]} alt={badge.alt[lang]} />
          </a>
        )
      })}
    </div>
  )
}

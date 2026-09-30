import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { t, type Lang } from '../i18n'
import { getImpactStats } from '../api'
import appStoreIcon from '../assets/appstore-icon.svg'
import googlePlayIcon from '../assets/googleplay-icon.svg'
import bakeryFeed from '../assets/app-ui/bakery.feed.webp'
import bentoFeed from '../assets/app-ui/bento.feed.webp'
import deliFeed from '../assets/app-ui/deli.feed.webp'
import dessertFeed from '../assets/app-ui/dessert.feed.webp'
import bakeryHunt from '../assets/app-ui/bakery.hunt.webp'
import deliHunt from '../assets/app-ui/deli.hunt.webp'
import dessertHunt from '../assets/app-ui/dessert.hunt.webp'
import '../App.css'

function useAnimatedCounter(target: number, duration = 2000): [number, (el: HTMLDivElement | null) => void] {
  const [count, setCount] = useState(0)
  const elRef = useRef<HTMLDivElement | null>(null)
  const animatedRef = useRef(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    animatedRef.current = false
  }, [target, duration])

  const ref = useCallback((el: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    elRef.current = el
    if (!el) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true
          const start = performance.now()
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(step)
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.3 },
    )
    observerRef.current.observe(el)
  }, [target, duration])

  return [count, ref]
}

export default function HomePage() {
  const [lang, setLang] = useState<Lang>(/^zh\b/i.test(navigator.language) ? 'zh' : 'en')
  const [scrolled, setScrolled] = useState(false)
  const i = t(lang)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const [boxesSaved, setBoxesSaved] = useState(52_340)
  const [merchantsCount, setMerchantsCount] = useState(1_280)
  const [fetchedUsersCount, setFetchedUsersCount] = useState(38_600)

  useEffect(() => {
    getImpactStats()
      .then((stats) => {
        setBoxesSaved(stats.boxesSaved)
        setMerchantsCount(stats.merchantsCount)
        setFetchedUsersCount(stats.usersCount)
      })
      .catch(() => {
        // keep fallback values
      })
  }, [])

  const [packsCount, packsRef] = useAnimatedCounter(boxesSaved)
  const [storesCount, storesRef] = useAnimatedCounter(merchantsCount)
  const [usersCount, usersRef] = useAnimatedCounter(fetchedUsersCount)

  const toggleLang = () => setLang(lang === 'zh' ? 'en' : 'zh')

  return (
    <>
      {/* Navbar */}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-inner">
          <div className="navbar-brand">{i.nav.brand}</div>
          <div className="navbar-links">
            <a href="#mission">{i.nav.howItWorks}</a>
            <a href="#hunt">{i.nav.hunt}</a>
            <a href="#rally">{i.nav.rally}</a>
            <a href="#for-stores">{i.nav.forStores}</a>
            <button className="lang-toggle" onClick={toggleLang}>
              {i.nav.lang}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="dot" />
              {i.hero.comingSoon}
            </div>
            <h1>
              {i.hero.headline}
              <br />
              <span className="highlight">{i.hero.subheadline}</span>
            </h1>
            <p>{i.hero.description}</p>
            <div className="hero-actions">
              <Link to="/download" className="btn-primary">{i.hero.cta}</Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-cards">
              <img className="hero-card hero-card-back" src={dessertHunt} alt="" />
              <img className="hero-card hero-card-front" src={bakeryFeed} alt={i.hero.cardAlt} />
            </div>
            <div className="floating-card card-1">
              <div className="card-icon green">🥐</div>
              <span>{i.hero.madeToday}</span>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon orange">💰</div>
              <span>$120 {i.appPreview.mockup.saved}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mission / How It Works */}
      <section className="section mission" id="mission">
        <div className="mission-inner">
          <div className="section-header">
            <h2>{i.mission.title}</h2>
            <p>{i.mission.subtitle}</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">🏪</div>
              <h3>{i.mission.step1Title}</h3>
              <p>{i.mission.step1Desc}</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">🎁</div>
              <h3>{i.mission.step2Title}</h3>
              <p>{i.mission.step2Desc}</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">🎉</div>
              <h3>{i.mission.step3Title}</h3>
              <p>{i.mission.step3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview */}
      <section className="section app-preview" id="app-preview">
        <div className="app-preview-inner">
          <div>
            <div className="section-header" style={{ textAlign: 'left' }}>
              <h2>{i.appPreview.title}</h2>
              <p>{i.appPreview.subtitle}</p>
            </div>
            <div className="app-features">
              <div className="feature-item">
                <div className="feature-icon">📍</div>
                <span>{i.appPreview.feature1}</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <span>{i.appPreview.feature2}</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🥣</div>
                <span>{i.appPreview.feature3}</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">❤️</div>
                <span>{i.appPreview.feature4}</span>
              </div>
            </div>
          </div>
          <div className="app-mockup">
            <div className="phone-frame">
              <div className="phone-screen">
                <div className="phone-status-bar">{i.nav.brand}</div>
                <div className="phone-header">
                  <h4>{i.appPreview.mockup.nearbyTitle}</h4>
                  <p>{i.appPreview.mockup.nearbySubtitle}</p>
                </div>
                <div className="phone-cards">
                  <img src={bentoFeed} alt={i.appPreview.mockup.cardAlt} />
                  <img src={deliFeed} alt="" />
                  <img src={dessertFeed} alt="" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hunt Mode */}
      <section className="section hunt" id="hunt">
        <div className="hunt-inner">
          <div className="section-header">
            <h2>{i.hunt.title}</h2>
            <p>{i.hunt.subtitle}</p>
          </div>
          <div className="hunt-deck">
            <img src={deliHunt} alt="" />
            <img src={dessertHunt} alt={i.hunt.cardAlt} />
            <img src={bakeryHunt} alt="" />
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-icon">🛍️</div>
              <h3>{i.hunt.reserveTitle}</h3>
              <p>{i.hunt.reserveDesc}</p>
            </div>
            <div className="step-card">
              <div className="step-icon">👋</div>
              <h3>{i.hunt.passTitle}</h3>
              <p>{i.hunt.passDesc}</p>
            </div>
            <div className="step-card">
              <div className="step-icon">📥</div>
              <h3>{i.hunt.stackTitle}</h3>
              <p>{i.hunt.stackDesc}</p>
            </div>
          </div>
          <p className="hunt-recap">{i.hunt.recap}</p>
        </div>
      </section>

      {/* Rally */}
      <section className="section rally" id="rally">
        <div className="rally-inner">
          <div className="section-header">
            <h2>{i.rally.title}</h2>
            <p>{i.rally.subtitle}</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">📝</div>
              <h3>{i.rally.step1Title}</h3>
              <p>{i.rally.step1Desc}</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">🥣</div>
              <h3>{i.rally.step2Title}</h3>
              <p>{i.rally.step2Desc}</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">🏪</div>
              <h3>{i.rally.step3Title}</h3>
              <p>{i.rally.step3Desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Stores */}
      <section className="section for-stores" id="for-stores">
        <div className="for-stores-inner">
          <div className="section-header">
            <h2>{i.forStores.title}</h2>
            <p>{i.forStores.subtitle}</p>
          </div>
          <div className="for-stores-grid">
            <div className="for-stores-card">
              <div className="feature-icon">🎯</div>
              <h3>{i.forStores.eligibilityTitle}</h3>
              <p>{i.forStores.eligibilityDesc}</p>
            </div>
            <div className="for-stores-card">
              <div className="feature-icon">📋</div>
              <h3>{i.forStores.templatesTitle}</h3>
              <p>{i.forStores.templatesDesc}</p>
            </div>
            <div className="for-stores-card">
              <div className="feature-icon">📱</div>
              <h3>{i.forStores.pickupTitle}</h3>
              <p>{i.forStores.pickupDesc}</p>
            </div>
            <div className="for-stores-card">
              <div className="feature-icon">🥣</div>
              <h3>{i.forStores.rallyTitle}</h3>
              <p>{i.forStores.rallyDesc}</p>
            </div>
          </div>
          <div className="for-stores-cta">
            <Link to="/merchant-apply" className="btn-primary">{i.forStores.cta}</Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section impact" id="impact">
        <div className="impact-inner">
          <div className="section-header">
            <h2>{i.impact.title}</h2>
            <p>{i.impact.subtitle}</p>
          </div>
          <div className="impact-grid">
            <div className="impact-card" ref={packsRef}>
              <div className="impact-icon">🥡</div>
              <div className="impact-number">{packsCount.toLocaleString()}+</div>
              <div className="impact-label">{i.impact.packsGrabbed}</div>
            </div>
            <div className="impact-card" ref={storesRef}>
              <div className="impact-icon">🏪</div>
              <div className="impact-number">{storesCount.toLocaleString()}+</div>
              <div className="impact-label">{i.impact.stores}</div>
            </div>
            <div className="impact-card" ref={usersRef}>
              <div className="impact-icon">🙌</div>
              <div className="impact-number">{usersCount.toLocaleString()}+</div>
              <div className="impact-label">{i.impact.users}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-brand">{i.footer.brand}</div>
              <p className="footer-tagline">{i.footer.tagline}</p>
              <div className="store-badges">
                <Link to="/download?source=footer_ios" className="store-badge">
                  <img className="store-badge-icon" src={appStoreIcon} alt="App Store" />
                  {i.footer.downloadIOS}
                </Link>
                <Link to="/download?source=footer_android" className="store-badge">
                  <img className="store-badge-icon" src={googlePlayIcon} alt="Google Play" />
                  {i.footer.downloadAndroid}
                </Link>
              </div>
            </div>
            <div className="footer-column">
              <h4>{i.footer.product}</h4>
              <ul>
                <li><a href="#mission">{i.footer.howItWorks}</a></li>
                <li><Link to="/merchant-apply">{i.footer.forBusinesses}</Link></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>{i.footer.legal}</h4>
              <ul>
                <li><Link to="/privacy">{i.footer.terms}</Link></li>
                <li><Link to="/privacy">{i.footer.privacy}</Link></li>
                <li><Link to="/account-deletion">{i.footer.accountDeletion}</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            {i.footer.copyright}
          </div>
        </div>
      </footer>
    </>
  )
}

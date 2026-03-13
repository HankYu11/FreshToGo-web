import { useState, useEffect, useRef, useCallback } from 'react'
import { t, type Lang } from './i18n'
import './App.css'

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

function App() {
  const [lang, setLang] = useState<Lang>('zh')
  const [scrolled, setScrolled] = useState(false)
  const i = t(lang)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const [mealsCount, mealsRef] = useAnimatedCounter(52_340)
  const [co2Count, co2Ref] = useAnimatedCounter(128_500)
  const [storesCount, storesRef] = useAnimatedCounter(1_280)
  const [usersCount, usersRef] = useAnimatedCounter(38_600)

  const toggleLang = () => setLang(lang === 'zh' ? 'en' : 'zh')

  return (
    <>
      {/* Navbar */}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-inner">
          <div className="navbar-brand">{i.nav.brand}</div>
          <div className="navbar-links">
            <a href="#mission">{i.nav.howItWorks}</a>
            <a href="#app-preview">{i.nav.mission}</a>
            <a href="#impact">{i.nav.impact}</a>
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
              <button className="btn-primary">{i.hero.cta}</button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-illustration">
              <span className="hero-emoji">🥡</span>
              <div className="hero-emoji-row">
                <span>🥐</span>
                <span>🍱</span>
                <span>🥗</span>
                <span>🍰</span>
              </div>
            </div>
            <div className="floating-card card-1">
              <div className="card-icon green">🌱</div>
              <span>-2.5kg CO₂</span>
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
                <div className="feature-icon">🌍</div>
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
                <div className="phone-search">
                  🔍 {i.appPreview.mockup.searchPlaceholder}
                </div>
                <div className="phone-cards">
                  <div className="phone-card-item">
                    <div className="phone-card-thumb" style={{ background: '#FFF3E0' }}>🥐</div>
                    <div className="phone-card-info">
                      <h5>{i.appPreview.mockup.store1Name}</h5>
                      <p>{i.appPreview.mockup.store1Desc}</p>
                    </div>
                    <div className="phone-card-price">$89</div>
                  </div>
                  <div className="phone-card-item">
                    <div className="phone-card-thumb" style={{ background: '#E8F5E9' }}>🍱</div>
                    <div className="phone-card-info">
                      <h5>{i.appPreview.mockup.store2Name}</h5>
                      <p>{i.appPreview.mockup.store2Desc}</p>
                    </div>
                    <div className="phone-card-price">$120</div>
                  </div>
                  <div className="phone-card-item">
                    <div className="phone-card-thumb" style={{ background: '#F3E5F5' }}>🍰</div>
                    <div className="phone-card-info">
                      <h5>{i.appPreview.mockup.store3Name}</h5>
                      <p>{i.appPreview.mockup.store3Desc}</p>
                    </div>
                    <div className="phone-card-price">$99</div>
                  </div>
                </div>
                <div className="phone-nav">
                  <span>🏠</span>
                  <span>🗺️</span>
                  <span>💚</span>
                  <span>👤</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Counter */}
      <section className="section impact" id="impact">
        <div className="impact-inner">
          <div className="section-header">
            <h2>{i.impact.title}</h2>
            <p>{i.impact.subtitle}</p>
          </div>
          <div className="impact-grid">
            <div className="impact-card" ref={mealsRef}>
              <div className="impact-icon">🍽️</div>
              <div className="impact-number">{mealsCount.toLocaleString()}+</div>
              <div className="impact-label">{i.impact.mealsSaved}</div>
            </div>
            <div className="impact-card" ref={co2Ref}>
              <div className="impact-icon">🌿</div>
              <div className="impact-number">{co2Count.toLocaleString()}+</div>
              <div className="impact-label">{i.impact.co2Reduced}</div>
            </div>
            <div className="impact-card" ref={storesRef}>
              <div className="impact-icon">🏪</div>
              <div className="impact-number">{storesCount.toLocaleString()}+</div>
              <div className="impact-label">{i.impact.stores}</div>
            </div>
            <div className="impact-card" ref={usersRef}>
              <div className="impact-icon">💚</div>
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
                <div className="store-badge">
                  <span className="store-badge-icon">🍎</span>
                  {i.footer.comingSoonIOS}
                </div>
                <div className="store-badge">
                  <span className="store-badge-icon">🤖</span>
                  {i.footer.comingSoonAndroid}
                </div>
              </div>
            </div>
            <div className="footer-column">
              <h4>{i.footer.product}</h4>
              <ul>
                <li><a href="#mission">{i.footer.howItWorks}</a></li>
                <li><a href="#!">{i.footer.forBusinesses}</a></li>
                <li><a href="#!">{i.footer.pricing}</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>{i.footer.company}</h4>
              <ul>
                <li><a href="#!">{i.footer.about}</a></li>
                <li><a href="#!">{i.footer.careers}</a></li>
                <li><a href="#!">{i.footer.press}</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>{i.footer.legal}</h4>
              <ul>
                <li><a href="#!">{i.footer.terms}</a></li>
                <li><a href="#!">{i.footer.privacy}</a></li>
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

export default App

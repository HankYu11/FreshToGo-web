import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getPlaceDetails,
  searchPlaces,
  submitMerchantApplication,
  trackEvent,
  type PlaceDetails,
  type PlacePrediction,
} from '../api'
import { t, type Lang } from '../i18n'
import './MerchantApplicationPage.css'

type FormErrors = Partial<Record<'storeName' | 'contactName' | 'phone' | 'email' | 'location', string>>

const PHONE_RE = /^[0-9+\-()\s]{6,}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function newSessionToken() {
  return crypto.randomUUID()
}

export default function MerchantApplicationPage() {
  const [lang, setLang] = useState<Lang>(/^zh\b/i.test(navigator.language) ? 'zh' : 'en')
  const i = t(lang)
  const m = i.merchant

  const [storeName, setStoreName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  // Location autocomplete
  const [locationQuery, setLocationQuery] = useState('')
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [selectedLocation, setSelectedLocation] = useState<PlaceDetails | null>(null)
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const sessionTokenRef = useRef(newSessionToken())

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const hasFired = useRef(false)
  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true
    trackEvent({
      event_type: 'page_visit',
      event_category: 'web',
      ref_type: 'page',
      ref_id: '/merchant-apply',
      event_time: new Date().toISOString(),
    })
  }, [])

  // Debounced place search — skipped once a place has been picked.
  useEffect(() => {
    const q = locationQuery.trim()
    if (selectedLocation || q.length < 2) {
      setPredictions([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const results = await searchPlaces(q, sessionTokenRef.current)
        setPredictions(results)
        setShowDropdown(true)
      } catch {
        setPredictions([])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [locationQuery, selectedLocation])

  function onLocationChange(value: string) {
    setLocationQuery(value)
    if (selectedLocation) setSelectedLocation(null)
    if (errors.location) setErrors((e) => ({ ...e, location: undefined }))
  }

  async function onSelectPrediction(prediction: PlacePrediction) {
    setShowDropdown(false)
    setPredictions([])
    setLocationQuery(prediction.primaryText)
    try {
      const details = await getPlaceDetails(prediction.placeId, sessionTokenRef.current)
      setSelectedLocation(details)
    } catch {
      setErrors((e) => ({ ...e, location: m.errorLocation }))
    } finally {
      // Close the Google billing session and start a fresh one for any next search.
      sessionTokenRef.current = newSessionToken()
    }
  }

  function clearLocation() {
    setSelectedLocation(null)
    setLocationQuery('')
    setPredictions([])
  }

  function validate(): FormErrors {
    const next: FormErrors = {}
    if (!storeName.trim()) next.storeName = m.errorRequired
    if (!contactName.trim()) next.contactName = m.errorRequired
    if (!phone.trim()) next.phone = m.errorRequired
    else if (!PHONE_RE.test(phone.trim())) next.phone = m.errorPhone
    if (email.trim() && !EMAIL_RE.test(email.trim())) next.email = m.errorEmail
    if (!selectedLocation) next.location = m.errorLocation
    return next
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0 || !selectedLocation) return

    setSubmitState('submitting')
    try {
      await submitMerchantApplication({
        storeName: storeName.trim(),
        contactName: contactName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        location: selectedLocation,
      })
      setSubmitState('success')
    } catch {
      setSubmitState('error')
    }
  }

  function resetForm() {
    setStoreName('')
    setContactName('')
    setPhone('')
    setEmail('')
    clearLocation()
    setErrors({})
    setSubmitState('idle')
    sessionTokenRef.current = newSessionToken()
  }

  return (
    <div className="merchant-page">
      <header className="merchant-topbar">
        <Link to="/" className="merchant-back">{m.backHome}</Link>
        <button
          type="button"
          className="merchant-lang"
          onClick={() => setLang((l) => (l === 'zh' ? 'en' : 'zh'))}
        >
          {i.nav.lang}
        </button>
      </header>

      <main className="merchant-main">
        <div className="merchant-card">
          {submitState === 'success' ? (
            <div className="merchant-success">
              <div className="merchant-success-icon" aria-hidden="true">✓</div>
              <h1 className="merchant-success-title">{m.successTitle}</h1>
              <p className="merchant-success-body">{m.successBody}</p>
              <button type="button" className="merchant-submit merchant-submit-ghost" onClick={resetForm}>
                {m.successAnother}
              </button>
            </div>
          ) : (
            <>
              <div className="merchant-logo">{i.nav.brand}</div>
              <h1 className="merchant-title">{m.title}</h1>
              <p className="merchant-subtitle">{m.subtitle}</p>

              <form className="merchant-form" onSubmit={onSubmit} noValidate>
                <label className="merchant-field">
                  <span className="merchant-label">{m.storeName}</span>
                  <input
                    type="text"
                    className={`merchant-input ${errors.storeName ? 'merchant-input-error' : ''}`}
                    value={storeName}
                    placeholder={m.storeNamePlaceholder}
                    onChange={(e) => {
                      setStoreName(e.target.value)
                      if (errors.storeName) setErrors((x) => ({ ...x, storeName: undefined }))
                    }}
                    autoComplete="organization"
                  />
                  {errors.storeName && <span className="merchant-error">{errors.storeName}</span>}
                </label>

                <label className="merchant-field">
                  <span className="merchant-label">{m.contactName}</span>
                  <input
                    type="text"
                    className={`merchant-input ${errors.contactName ? 'merchant-input-error' : ''}`}
                    value={contactName}
                    placeholder={m.contactNamePlaceholder}
                    onChange={(e) => {
                      setContactName(e.target.value)
                      if (errors.contactName) setErrors((x) => ({ ...x, contactName: undefined }))
                    }}
                    autoComplete="name"
                  />
                  {errors.contactName && <span className="merchant-error">{errors.contactName}</span>}
                </label>

                <label className="merchant-field">
                  <span className="merchant-label">{m.phone}</span>
                  <input
                    type="tel"
                    className={`merchant-input ${errors.phone ? 'merchant-input-error' : ''}`}
                    value={phone}
                    placeholder={m.phonePlaceholder}
                    onChange={(e) => {
                      setPhone(e.target.value)
                      if (errors.phone) setErrors((x) => ({ ...x, phone: undefined }))
                    }}
                    autoComplete="tel"
                  />
                  {errors.phone && <span className="merchant-error">{errors.phone}</span>}
                </label>

                <label className="merchant-field">
                  <span className="merchant-label">{m.email}</span>
                  <input
                    type="email"
                    className={`merchant-input ${errors.email ? 'merchant-input-error' : ''}`}
                    value={email}
                    placeholder={m.emailPlaceholder}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors((x) => ({ ...x, email: undefined }))
                    }}
                    autoComplete="email"
                  />
                  {errors.email && <span className="merchant-error">{errors.email}</span>}
                </label>

                <div className="merchant-field">
                  <span className="merchant-label">{m.location}</span>
                  {selectedLocation ? (
                    <div className="merchant-location-selected">
                      <div className="merchant-location-info">
                        <span className="merchant-location-name">{selectedLocation.name}</span>
                        <span className="merchant-location-address">{selectedLocation.address}</span>
                      </div>
                      <button type="button" className="merchant-location-change" onClick={clearLocation}>
                        {m.locationChange}
                      </button>
                    </div>
                  ) : (
                    <div className="merchant-autocomplete">
                      <input
                        type="text"
                        className={`merchant-input ${errors.location ? 'merchant-input-error' : ''}`}
                        value={locationQuery}
                        placeholder={m.locationPlaceholder}
                        onChange={(e) => onLocationChange(e.target.value)}
                        onFocus={() => predictions.length > 0 && setShowDropdown(true)}
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={showDropdown}
                        aria-autocomplete="list"
                      />
                      {showDropdown && (searching || predictions.length > 0) && (
                        <ul className="merchant-predictions">
                          {searching && predictions.length === 0 ? (
                            <li className="merchant-prediction-empty">{m.locationSearching}</li>
                          ) : (
                            predictions.map((p) => (
                              <li key={p.placeId}>
                                <button
                                  type="button"
                                  className="merchant-prediction"
                                  onClick={() => onSelectPrediction(p)}
                                >
                                  <span className="merchant-prediction-primary">{p.primaryText}</span>
                                  <span className="merchant-prediction-secondary">{p.secondaryText}</span>
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                  {errors.location && <span className="merchant-error">{errors.location}</span>}
                </div>

                {submitState === 'error' && <p className="merchant-form-error">{m.errorSubmit}</p>}

                <button
                  type="submit"
                  className="merchant-submit"
                  disabled={submitState === 'submitting'}
                >
                  {submitState === 'submitting' ? m.submitting : m.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

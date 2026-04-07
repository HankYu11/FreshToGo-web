import { BASE_URL } from './config'

interface TrackEventPayload {
  event_type: string
  event_category: string
  platform?: string
  device_id?: string
  user_id?: string | null
  session_id?: string | null
  source?: string | null
  campaign?: string | null
  medium?: string | null
  ref_type?: string
  ref_id?: string
  metadata?: Record<string, unknown>
  event_time: string
}

export function trackEvent(payload: TrackEventPayload): void {
  const url = `${BASE_URL}/api/v1/events`
  const body = JSON.stringify(payload)

  // Prefer sendBeacon — it survives page navigations (critical for redirect pages)
  const blob = new Blob([body], { type: 'application/json' })
  if (navigator.sendBeacon?.(url, blob)) return

  // Fallback: fetch with keepalive
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // fire-and-forget — tracking failure should never break the page
  })
}

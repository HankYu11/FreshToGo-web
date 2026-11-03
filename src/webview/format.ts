/** Formatting helpers shared by the webview screens. Display only — no parsing of user input. */

import type { Box } from '../api'

/**
 * How much is left, as the mark a card wears — or null when there is nothing worth saying.
 *
 * One switch, because both the full card and the compact card in a station's row carry it: a
 * pack that is nearly gone has to say so wherever it is shown, and two copies would drift.
 */
export function statusPill(box: Box) {
  switch (box.status) {
    case 'SOLD_OUT':
      return { label: '已售完', warn: true }
    case 'BEFORE_SALE':
      return { label: '尚未開賣', warn: false }
    case 'EXPIRED':
      return { label: '已結束', warn: false }
    case 'ALMOST_SOLD_OUT':
      return { label: `僅剩 ${box.remainingCount} 份`, warn: true }
    default:
      return box.remainingCount > 0
        ? { label: `剩 ${box.remainingCount} 份`, warn: false }
        : null
  }
}

/** NT$ with thousands separators. */
export function formatPrice(amount: number) {
  return `NT$${amount.toLocaleString('zh-TW')}`
}

/**
 * A pickup window from the box's own "HH:mm" strings.
 *
 * These are already in the merchant's local time, so they are printed as-is rather than
 * put through a timezone conversion that would shift them.
 */
export function formatPickupWindow(start: string, end: string) {
  if (!start || !end) return ''
  return `${trimSeconds(start)} – ${trimSeconds(end)}`
}

function trimSeconds(time: string) {
  const match = /^(\d{1,2}):(\d{2})/.exec(time)
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : time
}

/**
 * A pickup window from a reservation's UTC instants, rendered in the merchant's timezone.
 *
 * The reservation carries `pickupWindowStartUtc`/`EndUtc` as UTC and `merchantTimezone`
 * separately; a customer standing in another timezone must still read the store's hours.
 */
export function formatPickupWindowUtc(
  startUtc: string | null,
  endUtc: string | null,
  timeZone: string,
): string {
  const start = parseUtc(startUtc)
  const end = parseUtc(endUtc)
  if (!start || !end) return ''

  try {
    const time = new Intl.DateTimeFormat('zh-TW', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      // hourCycle, not hour12: false — some ICU builds read that as h24 and print midnight
      // as "24:00". h23 names the cycle we actually want.
      hourCycle: 'h23',
    })
    return `${time.format(start)} – ${time.format(end)}`
  } catch {
    // An unknown IANA zone throws. The caller falls back to the box's own "HH:mm" strings,
    // which are already merchant-local, so returning nothing here is the right answer.
    return ''
  }
}

/** The pickup date in the merchant's timezone, e.g. "11月2日（日）". */
export function formatPickupDate(startUtc: string | null, timeZone: string): string {
  const start = parseUtc(startUtc)
  if (!start) return ''
  const options: Intl.DateTimeFormatOptions = {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }
  try {
    return new Intl.DateTimeFormat('zh-TW', { ...options, timeZone }).format(start)
  } catch {
    // An unrecognised IANA zone throws. The date is still worth showing, so fall back to the
    // device's own zone rather than dropping it — the hours beside it come from the box.
    return new Intl.DateTimeFormat('zh-TW', options).format(start)
  }
}

/**
 * The backend sends `2025-03-20T10:00:00` — ISO-8601 with no zone designator, documented as
 * UTC. `new Date()` reads that as *local* time, so the Z has to be put back on first.
 */
function parseUtc(value: string | null): Date | null {
  if (!value) return null
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

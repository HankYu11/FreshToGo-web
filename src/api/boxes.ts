import { api } from './client'
import { BASE_URL } from './config'
import { ensureSessionQuietly } from './session'
import type { components } from '../types/api-schema'

type BoxResponse = components['schemas']['MysteryBoxResponse']

export type ProductCategory = components['schemas']['ProductCategory']
export type BoxStatus = NonNullable<BoxResponse['status']>

interface ApiResponse<T> {
  success: boolean
  data: T
}

/**
 * A listing with the fields the UI actually reads guaranteed present.
 *
 * Every property on the generated `MysteryBoxResponse` is optional — the spec marks nothing
 * `required` — so the UI would otherwise be a field of `?.` and `?? ''`. `toBox` narrows once,
 * at the boundary, and drops a row the server sent without the essentials rather than rendering
 * a card with blanks in it.
 */
export interface Box {
  id: string
  merchantId: string | null
  name: string
  description: string | null
  originalPrice: number
  discountedPrice: number
  discountPercent: number
  storeName: string
  storeAddress: string
  storeLatitude: number | null
  storeLongitude: number | null
  storeLogoUrl: string | null
  merchantTimezone: string
  pickupTimeStart: string
  pickupTimeEnd: string
  status: BoxStatus
  remainingCount: number
  category: ProductCategory
  imageUrl: string | null
}

/** Statuses a customer can still reserve. Mirrors the app's `BoxStatus.isAvailableForSale`. */
export function isReservable(status: BoxStatus) {
  return status === 'AVAILABLE' || status === 'ALMOST_SOLD_OUT'
}

/** An image URL from the API can be a server-relative path (`/uploads/...`); make it absolute. */
export function absoluteImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

/** Narrow a wire listing to [Box], or null when the server omitted something essential. */
export function toBox(raw: BoxResponse): Box | null {
  const { id, name, storeName, status } = raw
  if (!id || !name || !storeName || !status) return null

  return {
    id,
    merchantId: raw.merchantId ?? null,
    name,
    description: raw.description ?? null,
    originalPrice: raw.originalPrice ?? 0,
    discountedPrice: raw.discountedPrice ?? 0,
    discountPercent: raw.discountPercent ?? 0,
    storeName,
    storeAddress: raw.storeAddress ?? '',
    storeLatitude: raw.storeLatitude ?? null,
    storeLongitude: raw.storeLongitude ?? null,
    storeLogoUrl: absoluteImageUrl(raw.storeLogoUrl),
    merchantTimezone: raw.merchantTimezone || 'Asia/Taipei',
    pickupTimeStart: raw.pickupTimeStart ?? '',
    pickupTimeEnd: raw.pickupTimeEnd ?? '',
    status,
    remainingCount: raw.remainingCount ?? 0,
    category: raw.category ?? 'GENERAL',
    imageUrl: absoluteImageUrl(raw.resolvedImageUrl),
  }
}

/**
 * Every listing on sale today, across all stores.
 *
 * Unauthenticated, but eligibility-aware: with a consumer token the server returns the listings
 * that consumer may actually buy, and without one only the unrestricted ones. It never answers
 * 401, so a session that cannot be opened just means an anonymous — and possibly shorter — list.
 */
export async function listBoxes(signal?: AbortSignal): Promise<Box[]> {
  await ensureSessionQuietly()
  const res = await api.get<ApiResponse<BoxResponse[]>>('/api/boxes', { auth: true, signal })
  return (res.data ?? []).map(toBox).filter((box): box is Box => box !== null)
}

/**
 * One listing by id. Eligibility-aware in the same way as [listBoxes], except that a listing
 * the caller may not buy answers 403 BOX_NOT_ELIGIBLE rather than going missing.
 */
export async function getBox(id: string, signal?: AbortSignal): Promise<Box | null> {
  await ensureSessionQuietly()
  const res = await api.get<ApiResponse<BoxResponse>>(
    `/api/boxes/${encodeURIComponent(id)}`,
    { auth: true, signal },
  )
  return res.data ? toBox(res.data) : null
}

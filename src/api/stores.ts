import { api } from './client'
import { absoluteImageUrl, toBox, type Box } from './boxes'
import { ensureSessionQuietly } from './session'
import type { components } from '../types/api-schema'

type MerchantProfileResponse = components['schemas']['MerchantProfileResponse']

interface ApiResponse<T> {
  success: boolean
  data: T
}

/** A store as a customer sees it, with whatever it has listed right now. */
export interface StoreProfile {
  merchantId: string
  storeName: string
  storeAddress: string
  storeLatitude: number | null
  storeLongitude: number | null
  logoUrl: string | null
  bio: string | null
  story: string | null
  businessHours: string | null
  availableBoxes: Box[]
}

/**
 * One store's public profile.
 *
 * `availableBoxes` is eligibility-filtered the same way the listing endpoints are, so the
 * session goes along when there is one.
 */
export async function getStoreProfile(
  merchantId: string,
  signal?: AbortSignal,
): Promise<StoreProfile | null> {
  await ensureSessionQuietly()
  const res = await api.get<ApiResponse<MerchantProfileResponse>>(
    `/api/merchant/${encodeURIComponent(merchantId)}/profile`,
    { auth: true, signal },
  )
  const data = res.data
  if (!data?.merchantId || !data.storeName) return null

  return {
    merchantId: data.merchantId,
    storeName: data.storeName,
    storeAddress: data.storeAddress ?? '',
    storeLatitude: data.storeLatitude ?? null,
    storeLongitude: data.storeLongitude ?? null,
    logoUrl: absoluteImageUrl(data.logoUrl),
    bio: data.bio ?? null,
    story: data.story ?? null,
    businessHours: data.businessHours ?? null,
    availableBoxes: (data.availableBoxes ?? [])
      .map(toBox)
      .filter((box): box is Box => box !== null),
  }
}

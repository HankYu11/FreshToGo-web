import { api } from './client'
import { toBox, type Box, type ProductCategory } from './boxes'
import type { components } from '../types/api-schema'

type MerchantResponse = components['schemas']['MerchantResponse']
type MysteryBoxResponse = components['schemas']['MysteryBoxResponse']

interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface MerchantSession {
  token: string
  email: string
  storeName: string
  storeAddress: string
  storeLatitude: number | null
  storeLongitude: number | null
}

export interface NewListing {
  name: string
  description?: string
  category: ProductCategory
  originalPrice: number
  discountedPrice: number
  quantity: number
  /** "HH:mm", merchant-local. */
  pickupTimeStart: string
  pickupTimeEnd: string
}

/**
 * Sign a merchant in. Their token is separate from the consumer session: the two live side by
 * side, and the consumer flow must never send a merchant's.
 */
export async function merchantLogin(
  email: string,
  password: string,
): Promise<MerchantSession> {
  const res = await api.post<ApiResponse<MerchantResponse & { token?: string }>>(
    '/api/merchant/login',
    { email, password },
  )
  const data = res.data
  if (!data?.token) throw new Error('登入回應沒有帶回 token')
  return {
    token: data.token,
    email: data.email ?? email,
    storeName: data.storeName ?? '',
    storeAddress: data.storeAddress ?? '',
    storeLatitude: data.storeLatitude ?? null,
    storeLongitude: data.storeLongitude ?? null,
  }
}

function auth(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

/** Everything this merchant has listed, newest first as the API returns it. */
export async function merchantBoxes(token: string, signal?: AbortSignal): Promise<Box[]> {
  const res = await api.get<ApiResponse<MysteryBoxResponse[]>>('/api/merchant/boxes', {
    ...auth(token),
    signal,
  })
  return (res.data ?? []).map((row) => toBox(row)).filter((box): box is Box => box !== null)
}

/**
 * List a pack for today.
 *
 * The sale window runs from midnight to the end of the pickup window. That is not a free
 * choice: the backend rejects `saleTimeEnd > pickupTimeEnd`
 * (BoxInputValidator → SaleEndsAfterPickupEnds), and opening at midnight means the pack is
 * never BEFORE_SALE, so it can be reserved from the moment it is listed.
 */
export async function createListing(token: string, listing: NewListing): Promise<Box | null> {
  const today = new Date()
  const saleDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  const res = await api.post<ApiResponse<MysteryBoxResponse>>(
    '/api/merchant/boxes',
    {
      name: listing.name,
      description: listing.description || undefined,
      category: listing.category,
      originalPrice: listing.originalPrice,
      discountedPrice: listing.discountedPrice,
      quantity: listing.quantity,
      pickupTimeStart: listing.pickupTimeStart,
      pickupTimeEnd: listing.pickupTimeEnd,
      saleTimeStart: '00:00',
      saleTimeEnd: listing.pickupTimeEnd,
      saleDate,
    },
    auth(token),
  )
  return res.data ? toBox(res.data) : null
}

/**
 * Put this store at a point — DEV BACKEND ONLY.
 *
 * `POST /api/test/merchants/location` is mounted only when the backend runs with
 * `KTOR_DEVELOPMENT=true`, so on production it simply does not exist. Placing a store is an
 * admin decision on the public API and stays one: a shop that could move itself next to a
 * busier station would be helping itself to somebody else's commuters. This is here so a dev
 * environment can be set up without an admin account.
 *
 * Throws ApiError(404) when the backend predates the endpoint — the caller says so plainly
 * rather than looking broken.
 */
export async function placeStore(
  email: string,
  storeAddress: string,
  storeLatitude: number,
  storeLongitude: number,
): Promise<{ storeLatitude: number | null; storeLongitude: number | null; storeAddress: string }> {
  const res = await api.post<ApiResponse<MerchantResponse>>('/api/test/merchants/location', {
    email,
    storeAddress,
    storeLatitude,
    storeLongitude,
  })
  return {
    storeLatitude: res.data?.storeLatitude ?? null,
    storeLongitude: res.data?.storeLongitude ?? null,
    storeAddress: res.data?.storeAddress ?? storeAddress,
  }
}

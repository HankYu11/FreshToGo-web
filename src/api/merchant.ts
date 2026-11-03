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

/** One reservation as the merchant side lists it — no station, no code; the backend has neither. */
export interface MerchantOrder {
  id: string
  orderId: string
  customerName: string
  itemDescription: string
  totalPrice: number
  isPickedUp: boolean
  isCancelled: boolean
  status: string
  pickupDate: string
  /** UTC; the merchant's own timezone converts it for display. */
  pickupWindowStartUtc: string | null
  pickupWindowEndUtc: string | null
  merchantTimezone: string
}

/** What the backend hands back when a reservation is redeemed. */
export interface Redemption {
  reservationId: string
  itemName: string
  quantity: number
  unitPrice: number
  totalAmount: number
}

type MerchantOrderResponse = components['schemas']['MerchantOrderSummaryResponse']

function toMerchantOrder(row: MerchantOrderResponse): MerchantOrder {
  return {
    id: row.id ?? '',
    orderId: row.orderId ?? '',
    customerName: row.customerName ?? '',
    itemDescription: row.itemDescription ?? '',
    totalPrice: row.totalPrice ?? 0,
    isPickedUp: row.isPickedUp ?? false,
    isCancelled: row.isCancelled ?? false,
    status: row.status ?? '',
    pickupDate: row.pickupDate ?? '',
    pickupWindowStartUtc: row.pickupWindowStartUtc ?? null,
    pickupWindowEndUtc: row.pickupWindowEndUtc ?? null,
    merchantTimezone: row.merchantTimezone ?? 'Asia/Taipei',
  }
}

/**
 * This merchant's reservations, filtered the way the app's dashboard filters them.
 *
 * `isPickedUp=false&isCancelled=false` is the counter's working list: everything still owed to
 * somebody. The response carries no redemption code — the customer holds that, and the merchant
 * either reads it off their screen or redeems the row by its id.
 */
export async function merchantReservations(
  token: string,
  options: { pickedUp?: boolean; cancelled?: boolean; signal?: AbortSignal } = {},
): Promise<MerchantOrder[]> {
  const { pickedUp, cancelled, signal } = options
  const params: Record<string, string> = {}
  if (pickedUp !== undefined) params.isPickedUp = String(pickedUp)
  if (cancelled !== undefined) params.isCancelled = String(cancelled)

  const res = await api.get<ApiResponse<MerchantOrderResponse[]>>('/api/merchant/reservations', {
    ...auth(token),
    signal,
    ...(Object.keys(params).length > 0 ? { params } : {}),
  })
  return (res.data ?? []).map(toMerchantOrder)
}

/**
 * Redeem by the customer's six-character code — the app's `confirmRedemption`.
 *
 * The same endpoint the merchant app's scanner posts to, with the same body. Redeeming marks
 * the reservation picked up and clears the customer's no-show count, so the consumer's own
 * ticket and order list change the next time they read the server.
 */
export async function redeemByCode(token: string, code: string): Promise<Redemption> {
  const res = await api.post<ApiResponse<Redemption>>(
    '/api/merchant/reservations/redeem',
    { code },
    auth(token),
  )
  return res.data
}

/**
 * Redeem a reservation by its id — the app's `completeReservation`.
 *
 * For a customer who cannot show the code: same state change, same response, no code involved.
 */
export async function redeemById(token: string, reservationId: string): Promise<Redemption> {
  const res = await api.post<ApiResponse<Redemption>>(
    `/api/merchant/reservations/${encodeURIComponent(reservationId)}/redeem`,
    undefined,
    auth(token),
  )
  return res.data
}

import { api } from './client'
import type { ProductCategory } from './boxes'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface SeedListingInput {
  name: string
  description?: string
  category?: ProductCategory
  originalPrice: number
  discountedPrice: number
  quantity: number
  pickupTimeStart: string
  pickupTimeEnd: string
}

export interface SeedStoreInput {
  email: string
  storeName: string
  storeAddress: string
  storeLatitude: number
  storeLongitude: number
  listings: SeedListingInput[]
}

export interface SeedResult {
  saleDate: string
  stores: {
    email: string
    merchantId: string
    store: 'created' | 'reused'
    listings: { name: string; outcome: 'created' | 'reused' | 'failed'; reason?: string }[]
  }[]
}

/**
 * Put stores and today's packs on the backend — DEV BACKEND ONLY, no credentials.
 *
 * `POST /api/test/demo/listings` is mounted only when the backend runs with
 * `KTOR_DEVELOPMENT=true`, so production does not have it. It is idempotent: a store already
 * there is reused and moved, and a pack already listed for today is left alone, which is what
 * makes it safe to run every morning before a demo.
 *
 * The data comes from here, not from the backend: the stations, the stores and the packs are
 * this demo's business, and the endpoint deliberately knows nothing about them.
 */
export async function seedDemoListings(stores: SeedStoreInput[]): Promise<SeedResult> {
  const res = await api.post<ApiResponse<SeedResult>>('/api/test/demo/listings', { stores })
  return res.data
}

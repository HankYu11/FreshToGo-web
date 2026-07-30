import { api } from './client'
import type { PlaceDetails } from './places'

export interface MerchantApplication {
  /** Store / business name */
  storeName: string
  /** Name of the person we should contact */
  contactName: string
  /** Contact phone number */
  phone: string
  /** Optional contact email */
  email?: string
  /** Resolved store location from the Places autocomplete */
  location: PlaceDetails
}

/**
 * Submit a merchant "apply to join" lead.
 *
 * NOTE: this endpoint must be added to the backend (MysteryBox-ktor) as a
 * PUBLIC (unauthenticated) route — applicants are not logged-in merchants yet.
 */
export async function submitMerchantApplication(application: MerchantApplication) {
  await api.post('/api/merchant/apply', application)
}

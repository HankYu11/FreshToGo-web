import { api } from './client'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface PlacePrediction {
  placeId: string
  primaryText: string
  secondaryText: string
}

export interface PlaceDetails {
  placeId: string
  name: string
  address: string
  latitude: number
  longitude: number
}

/**
 * Autocomplete place predictions via the server-side Google Places proxy.
 * Reuse the same `sessionToken` for the follow-up `getPlaceDetails` call so
 * Google bills the whole interaction as one session.
 */
export async function searchPlaces(q: string, sessionToken: string) {
  const res = await api.get<ApiResponse<PlacePrediction[]>>('/api/places/autocomplete', {
    params: { q, sessionToken },
  })
  return res.data
}

/** Resolve full details for a prediction. Pass the same `sessionToken` used for autocomplete. */
export async function getPlaceDetails(placeId: string, sessionToken: string) {
  const res = await api.get<ApiResponse<PlaceDetails>>(
    `/api/places/${encodeURIComponent(placeId)}`,
    { params: { sessionToken } },
  )
  return res.data
}

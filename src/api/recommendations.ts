import { api } from './client'
import type { components } from '../types/api-schema'

export type RecommendationItem = components['schemas']['RecommendationItem']
export type RecommendationStatus = components['schemas']['RecommendationStatus']

interface ApiResponse<T> {
  success: boolean
  data: T
}

/**
 * One 敲碗 recommendation for the `/knock/:id` share page. The endpoint is public with optional
 * auth; the site never sends a token, so the per-caller fields (`hasVoted`, `myAnswers`, …) are
 * always the anonymous defaults and must not be shown.
 *
 * Resolves to `null` when the backend says the id is unknown (404) or malformed (400); any other
 * failure (rate limit, network, 5xx) rejects.
 */
export async function getRecommendation(id: string): Promise<RecommendationItem | null> {
  try {
    const res = await api.get<ApiResponse<RecommendationItem>>(
      `/api/recommendations/${encodeURIComponent(id)}`,
    )
    return res.data
  } catch (error) {
    const status = (error as { status?: number }).status
    if (status === 404 || status === 400) return null
    throw error
  }
}

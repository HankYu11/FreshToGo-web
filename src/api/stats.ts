import { api } from './client'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface ImpactStats {
  boxesSaved: number
  merchantsCount: number
  usersCount: number
}

export async function getImpactStats() {
  const res = await api.get<ApiResponse<ImpactStats>>('/api/stats/impact')
  return res.data
}

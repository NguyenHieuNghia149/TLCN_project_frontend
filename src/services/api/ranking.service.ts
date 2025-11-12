import { API_CONFIG } from '../../config/api.config'
import type { RankingResponse, RankingFilters } from '@/types/ranking.types'

class RankingAPI {
  private baseURL: string

  constructor() {
    this.baseURL = `${API_CONFIG.baseURL}/users/ranking`
  }

  async getRanking(filters: RankingFilters = {}): Promise<RankingResponse> {
    const params = new URLSearchParams()

    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

    const url = `${this.baseURL}${params.toString() ? `?${params.toString()}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ranking: ${response.statusText}`)
    }

    return response.json()
  }
}

export const rankingAPI = new RankingAPI()

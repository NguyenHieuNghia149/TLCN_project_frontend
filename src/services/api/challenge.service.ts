import { apiClient } from '@/config/axios.config'
import type {
  PaginatedResponse,
  ChallengeItem,
  Cursor,
} from '@/types/challenge.types'

export class ChallengeService {
  /**
   * Get challenges by topic ID with cursor-based pagination
   * @param topicId - Topic ID
   * @param limit - Number of items to load (1-50, default: 10)
   * @param cursor - Cursor from previous response for pagination
   * @param tags - Optional tags filter
   * @returns Paginated response with items and nextCursor
   */
  async getChallengesByTopicId(
    topicId: string,
    limit: number = 10,
    cursor: Cursor | null = null,
    tags?: string[]
  ): Promise<PaginatedResponse<ChallengeItem>> {
    const params: Record<string, string> = {
      limit: limit.toString(),
    }

    // Add cursor if provided (encode as JSON string)
    if (cursor) {
      params.cursor = JSON.stringify(cursor)
    }

    // Add tags if provided
    if (tags && tags.length > 0) {
      params.tags = tags.join(',')
    }

    const response = await apiClient.get(
      `/challenges/problems/topic/${topicId}`,
      { params }
    )

    const data = response.data?.data

    // Handle paginated response structure: { items: [], nextCursor: null | Cursor }
    if (data && typeof data === 'object' && 'items' in data) {
      return data as PaginatedResponse<ChallengeItem>
    }

    // Fallback: return empty response if format is unexpected
    console.warn('API response format not recognized:', data)
    return {
      items: [],
      nextCursor: null,
    }
  }

  async getTagsByTopicId(topicId: string) {
    const response = await apiClient.get(`/challenges/topics/${topicId}/tags`)
    const data = response.data?.data
    const tags = (data && (data as { tags?: unknown }).tags) as unknown
    return Array.isArray(tags) ? (tags as string[]) : []
  }

  async getChallengeById(challengeId: string, showAll = false) {
    const params = showAll ? { showAll: 'true' } : {}
    const response = await apiClient.get(`/challenges/${challengeId}`, {
      params,
    })
    return response.data
  }

  async getAllTags() {
    const response = await apiClient.get('/challenges/tags')
    return response.data.data.tags as string[]
  }
  // Admin methods
  async getAllChallenges(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortField?: string,
    sortOrder?: 'asc' | 'desc'
  ) {
    const params: Record<string, string | number> = { page, limit }
    if (search) params.q = search
    if (sortField) params.sortField = sortField
    if (sortOrder) params.sortOrder = sortOrder

    const response = await apiClient.get<{
      success: boolean
      data: { items: ChallengeItem[]; total: number }
    }>(`/challenges/all`, { params })
    return response.data.data
  }

  async createChallenge(data: Record<string, unknown>) {
    const response = await apiClient.post('/challenges/create', data)
    return response.data
  }

  async updateChallenge(id: string, data: Record<string, unknown>) {
    const response = await apiClient.put(`/challenges/${id}`, data)
    return response.data
  }

  async deleteChallenge(id: string) {
    const response = await apiClient.delete(`/challenges/${id}`)
    return response.data
  }
}

// Export a singleton instance
export const challengeService = new ChallengeService()

import { apiClient } from '@/config/axios.config'
import type { PaginatedResponse, ChallengeItem } from '@/types/challenge.types'

export class ChallengeService {
  async getChallengesByTopicId(
    topicId: string,
    tags?: string[]
  ): Promise<ChallengeItem[]> {
    const params: Record<string, string> = {}
    if (tags && tags.length > 0) {
      params.tags = tags.join(',')
    }
    const response = await apiClient.get(
      `/challenges/topics/${topicId}/problems`,
      { params }
    )
    const data = response.data?.data

    // Handle paginated response structure: { items: [], nextCursor: null }
    if (data && typeof data === 'object' && 'items' in data) {
      const paginatedData = data as PaginatedResponse<ChallengeItem>
      return Array.isArray(paginatedData.items) ? paginatedData.items : []
    }

    // Handle direct array response
    if (Array.isArray(data)) {
      return data as ChallengeItem[]
    }

    // If data is not in expected format, log warning and return empty array
    console.warn('API response format not recognized:', data)
    return []
  }

  async getTagsByTopicId(topicId: string) {
    const response = await apiClient.get(`/challenges/topics/${topicId}/tags`)
    const data = response.data?.data
    const tags = (data && (data as { tags?: unknown }).tags) as unknown
    return Array.isArray(tags) ? (tags as string[]) : []
  }

  async getChallengeById(challengeId: string) {
    const response = await apiClient.get(`/challenges/${challengeId}`)
    return response.data
  }
}

// Export a singleton instance
export const challengeService = new ChallengeService()

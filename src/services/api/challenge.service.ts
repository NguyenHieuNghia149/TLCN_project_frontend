import { apiClient } from '@/config/axios.config'

export class ChallengeService {
  async getChallengesByTopicId(topicId: string, tags?: string[]) {
    const params: Record<string, string> = {}
    if (tags && tags.length > 0) {
      params.tags = tags.join(',')
    }
    const response = await apiClient.get(
      `/challenges/topics/${topicId}/problems`,
      { params }
    )
    return response.data?.data ?? []
  }

  async getTagsByTopicId(topicId: string) {
    const response = await apiClient.get(`/challenges/topics/${topicId}/tags`)
    const data = response.data?.data
    const tags = (data && (data as { tags?: unknown }).tags) as unknown
    return Array.isArray(tags) ? (tags as string[]) : []
  }
}

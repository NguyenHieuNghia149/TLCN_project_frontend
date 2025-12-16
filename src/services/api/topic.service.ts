import { apiClient } from '@/config/axios.config'

export class TopicService {
  async getTopics() {
    const response = await apiClient.get('/topics')
    return response.data?.data ?? []
  }
  async getTagsByTopicId(topicId: string) {
    const response = await apiClient.get(`/challenges/topics/${topicId}/tags`)
    return response.data?.data ?? []
  }
}

export const topicService = new TopicService()

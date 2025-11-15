import { apiClient } from '../../config/axios.config'
import type {
  LessonResponse,
  LessonFilters,
  SingleLessonResponse,
} from '@/types/lesson.types'

class LessonAPI {
  async getAllLessons(filters: LessonFilters = {}): Promise<LessonResponse> {
    const params: Record<string, string | number> = {}

    if (filters.topicId) params.topicId = filters.topicId
    if (filters.page) params.page = filters.page
    if (filters.limit) params.limit = filters.limit

    const response = await apiClient.get('/lessons', { params })
    return response.data
  }

  async getLessonById(id: string): Promise<SingleLessonResponse> {
    const response = await apiClient.get(`/lessons/${id}`)
    return response.data
  }

  async getLessonsByTopic(
    topicId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<LessonResponse> {
    const params = { page, limit }
    const response = await apiClient.get(`/lessons/topic/${topicId}`, {
      params,
    })
    return response.data
  }

  async createLesson(lessonData: {
    title: string
    content?: string
    topicId: string
  }): Promise<SingleLessonResponse> {
    const response = await apiClient.post('/lessons', lessonData)
    return response.data
  }

  async updateLesson(
    id: string,
    lessonData: {
      title?: string
      content?: string
      topicId?: string
    }
  ): Promise<SingleLessonResponse> {
    const response = await apiClient.put(`/lessons/${id}`, lessonData)
    return response.data
  }

  async deleteLesson(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/lessons/${id}`)
    return response.data
  }
}

export const lessonAPI = new LessonAPI()

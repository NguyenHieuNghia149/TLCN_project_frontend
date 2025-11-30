import { apiClient } from '../../config/axios.config'

export interface AdminLessonResponse {
  id: string
  title: string
  content?: string | null
  videoUrl?: string | null
  topicId: string
  topicName?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminLessonFilters {
  search?: string
  topicId?: string
  title?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface AdminLessonListResponse {
  success: boolean
  data: {
    data: AdminLessonResponse[]
    pagination: {
      total: number
      page: number
      limit: number
      pages: number
    }
  }
}

export interface AdminLessonDetailResponse {
  success: boolean
  data: AdminLessonResponse
}

class AdminLessonAPI {
  async listLessons(
    filters: AdminLessonFilters = {}
  ): Promise<AdminLessonListResponse> {
    const params: Record<string, string | number | boolean | undefined> = {}

    if (filters.search) params.search = filters.search
    if (filters.topicId) params.topicId = filters.topicId
    if (filters.title) params.title = filters.title
    if (filters.page) params.page = filters.page
    if (filters.limit) params.limit = filters.limit
    if (filters.sortBy) params.sortBy = filters.sortBy
    if (filters.sortOrder) params.sortOrder = filters.sortOrder

    const response = await apiClient.get<AdminLessonListResponse>(
      '/admin/lessons',
      { params }
    )
    return response.data
  }

  async getLessonById(id: string): Promise<AdminLessonDetailResponse> {
    const response = await apiClient.get<AdminLessonDetailResponse>(
      `/admin/lessons/${id}`
    )
    return response.data
  }

  async createLesson(lessonData: {
    title: string
    content?: string
    videoUrl?: string
    topicId: string
  }): Promise<AdminLessonDetailResponse> {
    const response = await apiClient.post<AdminLessonDetailResponse>(
      '/admin/lessons',
      lessonData
    )
    return response.data
  }

  async updateLesson(
    id: string,
    lessonData: {
      title?: string
      content?: string
      videoUrl?: string
      topicId?: string
    }
  ): Promise<AdminLessonDetailResponse> {
    const response = await apiClient.put<AdminLessonDetailResponse>(
      `/admin/lessons/${id}`,
      lessonData
    )
    return response.data
  }

  async deleteLesson(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(
      `/admin/lessons/${id}`
    )
    return response.data
  }
}

export const adminLessonAPI = new AdminLessonAPI()

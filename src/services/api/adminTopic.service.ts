import { apiClient } from '../../config/axios.config'

export interface AdminTopicResponse {
  id: string
  topicName: string
  createdAt?: string
  updatedAt?: string
}

export interface AdminTopicFilters {
  search?: string
  topicName?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface AdminTopicListResponse {
  success: boolean
  data: {
    data: AdminTopicResponse[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
}

export interface AdminTopicDetailResponse {
  success: boolean
  data: AdminTopicResponse
}

export interface TopicStats {
  id: string
  topicName: string
  totalLessons: number
  totalProblems: number
  createdAt: string
  updatedAt: string
}

export interface TopicStatsResponse {
  success: boolean
  data: TopicStats
}

class AdminTopicAPI {
  async listTopics(
    filters: AdminTopicFilters = {}
  ): Promise<AdminTopicListResponse> {
    const params: Record<string, string | number | boolean | undefined> = {}

    if (filters.search) params.search = filters.search
    if (filters.topicName) params.topicName = filters.topicName
    if (filters.page) params.page = filters.page
    if (filters.limit) params.limit = filters.limit
    if (filters.sortBy) params.sortBy = filters.sortBy
    if (filters.sortOrder) params.sortOrder = filters.sortOrder

    const response = await apiClient.get<AdminTopicListResponse>(
      '/admin/topics',
      { params }
    )
    return response.data
  }

  async getTopicById(id: string): Promise<AdminTopicDetailResponse> {
    const response = await apiClient.get<AdminTopicDetailResponse>(
      `/admin/topics/${id}`
    )
    return response.data
  }

  async getTopicStats(id: string): Promise<TopicStatsResponse> {
    const response = await apiClient.get<TopicStatsResponse>(
      `/admin/topics/${id}/stats`
    )
    return response.data
  }

  async createTopic(topicData: {
    topicName: string
  }): Promise<AdminTopicDetailResponse> {
    const response = await apiClient.post<AdminTopicDetailResponse>(
      '/admin/topics',
      topicData
    )
    return response.data
  }

  async updateTopic(
    id: string,
    topicData: {
      topicName?: string
    }
  ): Promise<AdminTopicDetailResponse> {
    const response = await apiClient.put<AdminTopicDetailResponse>(
      `/admin/topics/${id}`,
      topicData
    )
    return response.data
  }

  async deleteTopic(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(
      `/admin/topics/${id}`
    )
    return response.data
  }
}

export default new AdminTopicAPI()

import { apiClient } from '@/config/axios.config'

export interface AdminRoadmapListParams {
  keyword?: string
  createdBy?: string
  visibility?: 'public' | 'private'
  createdAtFrom?: string
  createdAtTo?: string
  limit?: number
  offset?: number
}

export type AdminRoadmapRow = {
  id: string
  title: string
  description: string | null
  createdBy: string
  visibility: 'public' | 'private'
  createdAt: string
  updatedAt: string
  creatorEmail: string | null
  creatorFirstName: string | null
  creatorLastName: string | null
  itemCount: number
}

export interface AdminRoadmapListResponse {
  success: boolean
  data: {
    roadmaps: AdminRoadmapRow[]
    pagination: { limit: number; offset: number; total: number }
  }
}

export interface AdminRoadmapDetailResponse {
  success: boolean
  data: {
    roadmap: AdminRoadmapRow
    items: Array<{
      id: string
      roadmapId: string
      itemType: 'lesson' | 'problem'
      itemId: string
      itemTitle?: string
      order: number
      createdAt: string
      updatedAt: string
    }>
  }
}

export interface AddItemRequest {
  itemType: 'lesson' | 'problem'
  itemId: string
  order?: number
}

export interface AddItemResponse {
  success: boolean
  data: {
    id: string
    roadmapId: string
    itemType: 'lesson' | 'problem'
    itemId: string
    order: number
    createdAt: string
    updatedAt: string
  }
}

class AdminRoadmapAPI {
  async listRoadmaps(
    params: AdminRoadmapListParams = {}
  ): Promise<AdminRoadmapListResponse> {
    const response = await apiClient.get<AdminRoadmapListResponse>(
      '/admin/roadmaps',
      {
        params,
      }
    )
    return response.data
  }

  async getRoadmapDetail(id: string): Promise<AdminRoadmapDetailResponse> {
    const response = await apiClient.get<AdminRoadmapDetailResponse>(
      `/admin/roadmaps/${id}`
    )
    return response.data
  }

  async createRoadmap(data: {
    title: string
    description?: string
    visibility?: 'public' | 'private'
  }): Promise<AdminRoadmapDetailResponse> {
    const response = await apiClient.post<AdminRoadmapDetailResponse>(
      '/admin/roadmaps',
      data
    )
    return response.data
  }

  async updateVisibility(
    id: string,
    visibility: 'public' | 'private'
  ): Promise<{ success: boolean; data: AdminRoadmapRow }> {
    const response = await apiClient.patch<{
      success: boolean
      data: AdminRoadmapRow
    }>(`/admin/roadmaps/${id}/visibility`, { visibility })
    return response.data
  }

  async deleteRoadmap(
    id: string
  ): Promise<{ success: boolean; data: { deleted: boolean } }> {
    const response = await apiClient.delete<{
      success: boolean
      data: { deleted: boolean }
    }>(`/admin/roadmaps/${id}`)
    return response.data
  }

  async addItemToRoadmap(
    roadmapId: string,
    item: AddItemRequest
  ): Promise<AddItemResponse> {
    const response = await apiClient.post<AddItemResponse>(
      `/admin/roadmaps/${roadmapId}/items`,
      item
    )
    return response.data
  }

  async removeItemFromRoadmap(
    roadmapId: string,
    itemId: string
  ): Promise<{ success: boolean; data: { removed: boolean } }> {
    const response = await apiClient.delete<{
      success: boolean
      data: { removed: boolean }
    }>(`/admin/roadmaps/${roadmapId}/items/${itemId}`)
    return response.data
  }

  async reorderItems(
    roadmapId: string,
    itemIds: string[]
  ): Promise<{ success: boolean; data: unknown }> {
    const response = await apiClient.patch<{ success: boolean; data: unknown }>(
      `/admin/roadmaps/${roadmapId}/items/reorder`,
      { itemIds }
    )
    return response.data
  }
}

export const adminRoadmapAPI = new AdminRoadmapAPI()

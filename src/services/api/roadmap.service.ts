import { apiClient } from '@/config/axios.config'
import { AxiosError } from 'axios'
import type {
  AddItemDto,
  ApiEnvelope,
  CreateRoadmapDto,
  ProgressStats,
  Roadmap,
  RoadmapDetail,
  RoadmapItem,
  RoadmapItemWithLockStatus,
} from '@/types/roadmap.types'

const mapRoadmapApiError = (error: unknown): never => {
  const err = error as AxiosError<{ error?: { message?: string } }>
  const status = err.response?.status
  const backendMessage = err.response?.data?.error?.message

  if (status === 404) {
    throw new Error(
      'Roadmap API endpoint not found (404). Check backend server URL/port and ensure roadmap routes are mounted.'
    )
  }

  throw new Error(backendMessage || err.message || 'Roadmap request failed')
}

class RoadmapService {
  async createRoadmap(data: CreateRoadmapDto): Promise<Roadmap> {
    try {
      const response = await apiClient.post<ApiEnvelope<Roadmap>>(
        '/roadmaps',
        data
      )
      return response.data.data
    } catch (error) {
      return mapRoadmapApiError(error)
    }
  }

  async getRoadmap(id: string): Promise<RoadmapDetail> {
    const response = await apiClient.get<ApiEnvelope<RoadmapDetail>>(
      `/roadmaps/${id}`
    )
    return response.data.data
  }

  /**
   * R14.6: Get roadmap detail with sequential unlock status per item
   * Frontend calls this when user is viewing roadmap to see lock status
   * Returns items with: isCompleted, isUnlocked, lockReason
   */
  async getRoadmapDetailWithLockStatus(
    id: string
  ): Promise<RoadmapDetail & { items: RoadmapItemWithLockStatus[] }> {
    try {
      const response = await apiClient.get<
        ApiEnvelope<RoadmapDetail & { items: RoadmapItemWithLockStatus[] }>
      >(`/roadmaps/${id}/detail-with-locks`)
      return response.data.data
    } catch (error) {
      return mapRoadmapApiError(error)
    }
  }

  async updateRoadmap(
    id: string,
    data: Partial<CreateRoadmapDto>
  ): Promise<Roadmap> {
    const response = await apiClient.put<ApiEnvelope<Roadmap>>(
      `/roadmaps/${id}`,
      data
    )
    return response.data.data
  }

  async deleteRoadmap(id: string): Promise<void> {
    await apiClient.delete(`/roadmaps/${id}`)
  }

  async listRoadmaps(
    limit = 20,
    offset = 0
  ): Promise<{ roadmaps: Roadmap[]; total: number }> {
    const response = await apiClient.get<
      ApiEnvelope<{ roadmaps: Roadmap[]; total: number }>
    >('/roadmaps', {
      params: { limit, offset },
    })
    return response.data.data
  }

  async listUserRoadmaps(
    limit = 20,
    offset = 0
  ): Promise<{ roadmaps: Roadmap[]; total: number }> {
    try {
      const response = await apiClient.get<
        ApiEnvelope<{ roadmaps: Roadmap[]; total: number }>
      >('/user/roadmaps', {
        params: { limit, offset },
      })
      return response.data.data
    } catch (error) {
      return mapRoadmapApiError(error)
    }
  }

  async addItem(roadmapId: string, itemData: AddItemDto): Promise<RoadmapItem> {
    const response = await apiClient.post<ApiEnvelope<RoadmapItem>>(
      `/roadmaps/${roadmapId}/items`,
      itemData
    )
    return response.data.data
  }

  async removeItem(roadmapId: string, itemId: string): Promise<void> {
    await apiClient.delete(`/roadmaps/${roadmapId}/items/${itemId}`)
  }

  async reorderItems(
    roadmapId: string,
    itemIds: string[]
  ): Promise<RoadmapItem[]> {
    const response = await apiClient.patch<ApiEnvelope<RoadmapItem[]>>(
      `/roadmaps/${roadmapId}/items/reorder`,
      { itemIds }
    )
    return response.data.data
  }

  async getUserProgress(roadmapId: string): Promise<ProgressStats> {
    const response = await apiClient.get<ApiEnvelope<ProgressStats>>(
      `/roadmaps/${roadmapId}/progress`
    )
    return response.data.data
  }

  /**
   * R14.6: Mark roadmap item as completed
   * Validates prerequisite on backend, returns unlocked next item
   * Throws error if prerequisite not met
   */
  async completeRoadmapItem(
    roadmapId: string,
    itemId: string
  ): Promise<{
    item: RoadmapItemWithLockStatus
    unlockedNextItem?: RoadmapItemWithLockStatus
  }> {
    try {
      const response = await apiClient.post<
        ApiEnvelope<{
          item: RoadmapItemWithLockStatus
          unlockedNextItem?: RoadmapItemWithLockStatus
        }>
      >(`/roadmaps/${roadmapId}/items/${itemId}/complete`)
      return response.data.data
    } catch (error) {
      return mapRoadmapApiError(error)
    }
  }

  /**
   * Mark a problem as completed in a specific roadmap (by problem ID, not roadmapItem UUID).
   * Called from ProblemDetailPage after an ACCEPTED submission when user came from a roadmap.
   */
  async markProblemCompletedInRoadmap(
    roadmapId: string,
    problemId: string
  ): Promise<void> {
    try {
      await apiClient.post(`/roadmaps/${roadmapId}/complete-by-content`, {
        contentId: problemId,
        itemType: 'problem',
      })
    } catch (error) {
      return mapRoadmapApiError(error)
    }
  }

  async markItemCompleted(roadmapId: string, itemId: string): Promise<void> {
    await apiClient.post(`/roadmaps/${roadmapId}/progress/mark-complete`, {
      itemId,
    })
  }

  async markItemIncomplete(roadmapId: string, itemId: string): Promise<void> {
    await apiClient.post(`/roadmaps/${roadmapId}/progress/mark-incomplete`, {
      itemId,
    })
  }
}

export const roadmapService = new RoadmapService()

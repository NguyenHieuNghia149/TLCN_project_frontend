import { apiClient } from '@/config/axios.config'
import type { Problem } from '@/types/challenge.types'

export interface FavoriteResponse {
  success: boolean
  message: string
  data: {
    isFavorite: boolean
    message: string
    data: {
      id: string
      problemId: string
      createdAt: string
      problem: Problem
    }
  }
}

export interface FavoriteItem {
  id: string
  problemId: string
  createdAt: string
  problem: Problem
}

export interface FavoritesListResponse {
  success: boolean
  data: FavoriteItem[]
}

export class FavoritesService {
  /**
   * Toggle favorite status for a challenge
   * @param problemId - The ID of the problem/challenge
   * @returns Promise with favorite response
   */
  async toggleFavorite(problemId: string): Promise<FavoriteResponse> {
    const response = await apiClient.put<FavoriteResponse>(
      `/favorites/${problemId}/toggle`
    )
    console.log(response.data)
    return response.data
  }

  /**
   * Get list of favorite challenges
   * @returns Promise with list of favorites
   */
  async getFavorites(): Promise<FavoritesListResponse> {
    const response = await apiClient.get<FavoritesListResponse>('/favorites')
    console.log(response.data)
    return response.data
  }
}

// Export a singleton instance
export const favoritesService = new FavoritesService()

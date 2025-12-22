import { apiClient } from '@/config/axios.config'
import type { Problem } from '@/types/challenge.types'
import type { Lesson } from '@/types/lesson.types'

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

export interface LessonFavoriteResponse {
  success: boolean
  message: string
  data: {
    isFavorite: boolean
    message: string
    data: {
      id: string
      lessonId: string
      createdAt: string
      lesson: Lesson
    }
  }
}

export interface LessonFavoriteItem {
  id: string
  lessonId: string
  createdAt: string
  lesson: Lesson
}

export interface LessonFavoritesListResponse {
  success: boolean
  data: LessonFavoriteItem[]
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
    return response.data
  }

  /**
   * Get list of favorite challenges
   * @returns Promise with list of favorites
   */
  async getFavorites(): Promise<FavoritesListResponse> {
    const response = await apiClient.get<FavoritesListResponse>('/favorites')
    return response.data
  }

  /**
   * Toggle favorite status for a lesson
   * @param lessonId - The ID of the lesson
   * @returns Promise with lesson favorite response
   */
  async toggleLessonFavorite(
    lessonId: string
  ): Promise<LessonFavoriteResponse> {
    const response = await apiClient.put<LessonFavoriteResponse>(
      `/favorites/lesson/${lessonId}/toggle`
    )
    return response.data
  }

  /**
   * Get list of favorite lessons
   * @returns Promise with list of favorite lessons
   */
  async getLessonFavorites(): Promise<LessonFavoritesListResponse> {
    const response =
      await apiClient.get<LessonFavoritesListResponse>('/favorites/lessons')
    return response.data
  }
}

// Export a singleton instance
export const favoritesService = new FavoritesService()

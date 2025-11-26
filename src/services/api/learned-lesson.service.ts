import { apiClient } from '@/config/axios.config'

export interface LessonCompletionResponse {
  isCompleted: boolean
}

export interface CompletedLessonsResponse {
  completedLessonIds: string[]
}

export class LearnedLessonService {
  /**
   * Check if user has completed a specific lesson
   */
  async checkLessonCompletion(lessonId: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/learned-lessons/check/${lessonId}`)
      return response.data?.data?.isCompleted ?? false
    } catch (error) {
      console.error(`Error checking lesson completion for ${lessonId}:`, error)
      return false
    }
  }

  /**
   * Get all completed lessons for user
   */
  async getCompletedLessons(): Promise<string[]> {
    try {
      const response = await apiClient.get('/learned-lessons/user/completed')
      return response.data?.data?.completedLessonIds ?? []
    } catch (error) {
      console.error('Error fetching completed lessons:', error)
      return []
    }
  }

  /**
   * Mark a lesson as completed
   */
  async markLessonAsCompleted(lessonId: string): Promise<boolean> {
    try {
      const response = await apiClient.post('/learned-lessons/mark-completed', {
        lessonId,
      })
      return response.data?.success ?? false
    } catch (error) {
      console.error(`Error marking lesson ${lessonId} as completed:`, error)
      return false
    }
  }
}

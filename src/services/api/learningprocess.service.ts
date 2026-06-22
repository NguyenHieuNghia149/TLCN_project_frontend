import { apiClient } from '@/config/axios.config'

export interface TopicProgress {
  topicId: string
  topicName: string
  totalProblems: number
  solvedProblems: number
  completionPercentage: number
  lastSubmittedAt: Date | null
}

export interface LessonProgress {
  lessonId: string
  lessonTitle: string
  topicId: string
  topicName: string
  totalLessons: number
  completedLessons: number
  completionPercentage: number
  lastCompletedAt: Date | null
}

export interface LearningProgressResponse {
  userId: string
  totalTopics: number
  totalProblems: number
  totalSolvedProblems: number
  overallCompletionPercentage: number
  topicProgress: TopicProgress[]
  recentTopic?: TopicProgress
}

export interface LessonProgressResponse {
  userId: string
  totalLessons: number
  completedLessons: number
  completionPercentage: number
  lessonProgress: LessonProgress[]
  recentLesson?: LessonProgress
}

function unwrapResponseData<T>(response: {
  data?: T | { data?: T }
}): T | null {
  const payload = response.data
  if (!payload) return null
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as { data?: T }).data ?? null
  }
  return payload as T
}

export class LearningProcessService {
  /**
   * Get user's complete learning progress
   */
  async getUserProgress(): Promise<LearningProgressResponse | null> {
    try {
      const response = await apiClient.get('/learningprocess/user/progress')
      return unwrapResponseData<LearningProgressResponse>(response)
    } catch (error) {
      console.error('Error fetching user learning progress:', error)
      return null
    }
  }

  /**
   * Get progress for a specific topic
   */
  async getTopicProgress(topicId: string): Promise<TopicProgress | null> {
    try {
      const response = await apiClient.get(`/learningprocess/topic/${topicId}`)
      return unwrapResponseData<TopicProgress>(response)
    } catch (error) {
      console.error(`Error fetching topic progress for ${topicId}:`, error)
      return null
    }
  }

  /**
   * Get the most recent topic with submissions
   */
  async getRecentTopic(): Promise<TopicProgress | null> {
    try {
      const response = await apiClient.get('/learningprocess/user/recent')
      return unwrapResponseData<TopicProgress>(response)
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } }
      // Silently handle 401 - user may not be authenticated
      if (axiosError?.response?.status === 401) {
        return null
      }
      console.error('Error fetching recent topic:', error)
      return null
    }
  }

  /**
   * Get user's complete lesson learning progress
   */
  async getUserLessonProgress(): Promise<LessonProgressResponse | null> {
    try {
      const response = await apiClient.get(
        '/learningprocess/lessons/user/progress'
      )
      return unwrapResponseData<LessonProgressResponse>(response)
    } catch (error) {
      console.error('Error fetching user lesson progress:', error)
      return null
    }
  }

  /**
   * Get progress for a specific lesson
   */
  async getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
    try {
      const response = await apiClient.get(
        `/learningprocess/lessons/${lessonId}`
      )
      return unwrapResponseData<LessonProgress>(response)
    } catch (error) {
      console.error(`Error fetching lesson progress for ${lessonId}:`, error)
      return null
    }
  }

  /**
   * Get the most recent lesson completed
   */
  async getRecentLesson(): Promise<LessonProgress | null> {
    try {
      const response = await apiClient.get(
        '/learningprocess/lessons/user/recent'
      )
      return unwrapResponseData<LessonProgress>(response)
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } }
      // Silently handle 401 - user may not be authenticated
      if (axiosError?.response?.status === 401) {
        return null
      }
      console.error('Error fetching recent lesson:', error)
      return null
    }
  }
}

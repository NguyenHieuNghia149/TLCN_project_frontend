import { API_CONFIG } from '../../config/api.config'
import type {
  LessonResponse,
  LessonFilters,
  SingleLessonResponse,
} from '@/types/lesson.types'

class LessonAPI {
  private baseURL: string

  constructor() {
    this.baseURL = `${API_CONFIG.baseURL}/lessons`
  }

  async getAllLessons(filters: LessonFilters = {}): Promise<LessonResponse> {
    const params = new URLSearchParams()

    if (filters.topicId) params.append('topicId', filters.topicId)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const url = `${this.baseURL}${params.toString() ? `?${params.toString()}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch lessons: ${response.statusText}`)
    }

    return response.json()
  }

  async getLessonById(id: string): Promise<SingleLessonResponse> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch lesson: ${response.statusText}`)
    }

    return response.json()
  }

  async getLessonsByTopic(
    topicId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<LessonResponse> {
    const response = await fetch(
      `${this.baseURL}/topic/${topicId}?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(
        `Failed to fetch lessons by topic: ${response.statusText}`
      )
    }

    return response.json()
  }

  async createLesson(lessonData: {
    title: string
    content?: string
    topicId: string
  }): Promise<SingleLessonResponse> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lessonData),
    })

    if (!response.ok) {
      throw new Error(`Failed to create lesson: ${response.statusText}`)
    }

    return response.json()
  }

  async updateLesson(
    id: string,
    lessonData: {
      title?: string
      content?: string
      topicId?: string
    }
  ): Promise<SingleLessonResponse> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lessonData),
    })

    if (!response.ok) {
      throw new Error(`Failed to update lesson: ${response.statusText}`)
    }

    return response.json()
  }

  async deleteLesson(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to delete lesson: ${response.statusText}`)
    }

    return response.json()
  }
}

export const lessonAPI = new LessonAPI()

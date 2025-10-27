import { API_CONFIG } from '../../config/api.config'

export interface LessonDetail {
  id: string
  title: string
  content: string | null
  videoUrl: string | null
  topicId: string
  topicName: string | null
  createdAt: string
  updatedAt: string
}

export interface LessonDetailResponse {
  success: boolean
  data: LessonDetail
  message: string
}

export interface LessonDetailListResponse {
  success: boolean
  data: LessonDetail[]
  message: string
}

class LessonDetailAPI {
  private baseURL: string

  constructor() {
    this.baseURL = `${API_CONFIG.baseURL}/lesson-details`
  }

  async getLessonById(lessonId: string): Promise<LessonDetailResponse> {
    const response = await fetch(`${this.baseURL}/${lessonId}`, {
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

  async getLessonsByTopicId(
    topicId: string
  ): Promise<LessonDetailListResponse> {
    const response = await fetch(`${this.baseURL}/topic/${topicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(
        `Failed to fetch lessons by topic: ${response.statusText}`
      )
    }

    return response.json()
  }

  async getAllLessons(): Promise<LessonDetailListResponse> {
    const response = await fetch(this.baseURL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch all lessons: ${response.statusText}`)
    }

    return response.json()
  }
}

export const lessonDetailApi = new LessonDetailAPI()

export interface Lesson {
  id: string
  title: string
  content: string | null
  videoUrl?: string | null
  topicId: string
  topicName: string | null
  createdAt: string
  updatedAt: string
}

export interface LessonResponse {
  success: boolean
  data: Lesson[]
  message: string
}

export interface SingleLessonResponse {
  success: boolean
  data: Lesson
  message: string
}

export interface LessonFilters {
  topicId?: string
  page?: number
  limit?: number
}

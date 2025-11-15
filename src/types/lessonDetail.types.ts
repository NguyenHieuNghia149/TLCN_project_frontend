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

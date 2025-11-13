import { useState, useEffect } from 'react'
import { lessonDetailApi } from '../../services/api/lessonDetail.service'
import { LessonDetail } from '@/types/lessonDetail.types'

export const useLessonDetail = (lessonId: string) => {
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await lessonDetailApi.getLessonById(lessonId)
        setLesson(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lesson')
        setLesson(null)
      } finally {
        setLoading(false)
      }
    }

    fetchLesson()
  }, [lessonId])

  return { lesson, loading, error }
}

export const useLessonsByTopic = (topicId: string) => {
  const [lessons, setLessons] = useState<LessonDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLessons = async () => {
      if (!topicId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const response = await lessonDetailApi.getLessonsByTopicId(topicId)
        setLessons(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lessons')
        setLessons([])
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [topicId])

  return { lessons, loading, error }
}

import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { lessonAPI } from '../../services/api/lesson.service'
import { Lesson, LessonFilters } from '@/types/lesson.types'

export const useLessons = (filters: LessonFilters = {}) => {
  const location = useLocation()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const serializedFilters = useMemo(
    () => JSON.stringify(filters ?? {}),
    [filters]
  )

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await lessonAPI.getAllLessons(filters)
        setLessons(response.data)
        setPagination({
          page: 1,
          limit: 10,
          total: response.data.length,
          totalPages: 1,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lessons')
      } finally {
        setLoading(false)
      }
    }
    fetchLessons()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedFilters, location.pathname])

  const refetch = () => {
    lessonAPI
      .getAllLessons(filters)
      .then(response => {
        setLessons(response.data)
        setPagination({
          page: 1,
          limit: 10,
          total: response.data.length,
          totalPages: 1,
        })
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to fetch lessons')
      })
  }

  return {
    lessons,
    loading,
    error,
    pagination,
    refetch,
  }
}

export const useLesson = (id: string) => {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchLesson = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await lessonAPI.getLessonById(id)
        setLesson(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch lesson')
      } finally {
        setLoading(false)
      }
    }
    fetchLesson()
  }, [id])

  const refetch = async () => {
    if (!id) return
    try {
      const response = await lessonAPI.getLessonById(id)
      setLesson(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lesson')
    }
  }

  return {
    lesson,
    loading,
    error,
    refetch,
  }
}

export const useLessonsByTopic = (
  topicId: string,
  page: number = 1,
  limit: number = 10
) => {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    if (!topicId) return

    const fetchLessonsByTopic = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await lessonAPI.getLessonsByTopic(topicId, page, limit)
        setLessons(response.data)
        setPagination({
          page: 1,
          limit: 10,
          total: response.data.length,
          totalPages: 1,
        })
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch lessons by topic'
        )
      } finally {
        setLoading(false)
      }
    }
    fetchLessonsByTopic()
  }, [topicId, page, limit])

  const refetch = async () => {
    if (!topicId) return
    try {
      const response = await lessonAPI.getLessonsByTopic(topicId, page, limit)
      setLessons(response.data)
      setPagination({
        page: 1,
        limit: 10,
        total: response.data.length,
        totalPages: 1,
      })
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch lessons by topic'
      )
    }
  }

  return {
    lessons,
    loading,
    error,
    pagination,
    refetch,
  }
}

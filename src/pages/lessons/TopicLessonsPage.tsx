import React, { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { Star, BookOpen } from 'lucide-react'
import { useLessons } from '../../hooks/api/useLessons'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { createHtmlPreview } from '../../utils/htmlUtils'
import { favoritesService } from '../../services/api/favorites.service'
import './TopicLessonsPage.css'

// Placeholder images - replace with actual imports when available
const algoBeginners =
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop'
const algoAdvanced =
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop'
const systemDesign =
  'https://images.unsplash.com/photo-1461749280684-dccba6e6d3c1?w=400&h=300&fit=crop'
const systemInterview =
  'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop'
const fullstack =
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=300&fit=crop'
const webDev =
  'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop'

const TopicLessonsPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const { lessons, loading, error } = useLessons({ topicId: topicId || '' })
  const [favoritesMap, setFavoritesMap] = React.useState<
    Record<string, boolean>
  >({})

  const topicName = useMemo(() => {
    return lessons && lessons.length > 0 ? lessons[0].topicName : 'Topic'
  }, [lessons])

  // Sync server-provided favorite status when lessons load
  useEffect(() => {
    if (lessons && lessons.length > 0) {
      const initialFavoritesMap = lessons.reduce(
        (acc, lesson) => {
          acc[lesson.id] = lesson.isFavorite ?? false
          return acc
        },
        {} as Record<string, boolean>
      )
      setFavoritesMap(initialFavoritesMap)
    }
  }, [lessons])

  const handleToggleFavorite = React.useCallback(
    async (lessonId: string) => {
      const currentFavoriteStatus = favoritesMap[lessonId] ?? false

      // Optimistic update
      setFavoritesMap(prev => ({
        ...prev,
        [lessonId]: !currentFavoriteStatus,
      }))

      try {
        const response = await favoritesService.toggleLessonFavorite(lessonId)
        // Update with actual response
        setFavoritesMap(prev => ({
          ...prev,
          [lessonId]: response.data.isFavorite,
        }))
      } catch (err) {
        console.error('Error toggling favorite:', err)
        // Revert on error
        setFavoritesMap(prev => ({
          ...prev,
          [lessonId]: currentFavoriteStatus,
        }))
      }
    },
    [favoritesMap]
  )

  const handleStartLesson = (lessonId: string) => {
    navigate(`/lessons/${lessonId}`)
  }

  const handleGoBack = () => {
    navigate('/lessons')
  }

  if (loading) {
    return (
      <div className="topic-lessons-page">
        <div className="topic-lessons-container">
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    )
  }

  if (error || !lessons || lessons.length === 0) {
    return (
      <div className="topic-lessons-page">
        <div className="topic-lessons-container">
          <button
            onClick={handleGoBack}
            className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
          >
            <FiArrowLeft />
            Back to Lessons
          </button>
          <div className="py-8 text-center">
            <h2 className="mb-2 text-xl font-semibold text-red-600">
              {error ? 'Error Loading Lessons' : 'No Lessons Found'}
            </h2>
            <p className="text-gray-600">
              {error || 'There are no lessons in this topic.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="topic-lessons-page">
      <div className="topic-lessons-container">
        <button
          onClick={handleGoBack}
          className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
        >
          <FiArrowLeft />
          Back to Lessons
        </button>

        <div className="topic-lessons-header">
          <h1 className="topic-lessons-title">{topicName}</h1>
          <p className="topic-lessons-subtitle">All lessons for {topicName}</p>
        </div>

        <div className="topic-lessons-grid">
          {lessons.map((lesson, index) => (
            <div key={lesson.id} className="topic-lesson-card">
              <div className="topic-lesson-image">
                <div
                  className="topic-lesson-image-bg"
                  style={{
                    backgroundImage: `url(${
                      [
                        algoBeginners,
                        algoAdvanced,
                        systemDesign,
                        systemInterview,
                        fullstack,
                        webDev,
                      ][index % 6]
                    })`,
                  }}
                />
                <div className="topic-lesson-image-overlay" />
              </div>

              <div className="topic-lesson-content">
                <h3 className="topic-lesson-title">{lesson.title}</h3>
                <p className="topic-lesson-description">
                  {createHtmlPreview(lesson.content || '', 100)}
                </p>

                <div className="topic-lesson-footer">
                  <button
                    className="topic-lesson-button"
                    onClick={() => handleStartLesson(lesson.id)}
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Start Lesson
                  </button>
                  <button
                    className="topic-lesson-favorite-button"
                    onClick={() => handleToggleFavorite(lesson.id)}
                    title={
                      favoritesMap[lesson.id]
                        ? 'Remove from favorites'
                        : 'Add to favorites'
                    }
                    aria-label={
                      favoritesMap[lesson.id]
                        ? 'Remove from favorites'
                        : 'Add to favorites'
                    }
                  >
                    <span
                      className={
                        favoritesMap[lesson.id]
                          ? 'text-yellow-400'
                          : 'text-gray-500'
                      }
                    >
                      <Star
                        className={`h-5 w-5 ${
                          favoritesMap[lesson.id] ? 'fill-current' : ''
                        }`}
                      />
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TopicLessonsPage

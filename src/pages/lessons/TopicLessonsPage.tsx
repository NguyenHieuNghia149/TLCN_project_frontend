import React, { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { useLessonsByTopic } from '../../hooks/api/useLessonDetail'
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
  const { lessons, loading, error } = useLessonsByTopic(topicId || '')
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
          acc[lesson.id] = false // Initialize as not favorite
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
                  >
                    <svg
                      className="h-5 w-5"
                      fill={favoritesMap[lesson.id] ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      />
                    </svg>
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

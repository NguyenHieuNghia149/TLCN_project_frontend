import React from 'react'
import { useParams } from 'react-router-dom'
import { FiClock, FiArrowLeft } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import VideoPlayer from '../../components/ui/VideoPlayer'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useLessonDetail } from '../../hooks/api/useLessonDetail'
import CommentsSection from '../../components/lesson/CommentsSection'
import './LessonDetail.css'

const LessonDetail: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const { lesson, loading, error } = useLessonDetail(lessonId || '')

  const handleGoBack = () => {
    navigate('/lessons')
  }

  if (loading) {
    return (
      <div className="lesson-detail-page">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="lesson-detail-page">
        <div className="lesson-main-content">
          <div className="py-8 text-center">
            <h2 className="mb-2 text-xl font-semibold text-red-600">
              Error Loading Lesson
            </h2>
            <p className="mb-4 text-gray-600">{error || 'Lesson not found'}</p>
            <button
              onClick={handleGoBack}
              className="mx-auto flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <FiArrowLeft />
              Back to Lessons
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="lesson-detail-page">
      <main className="lesson-main-content">
        <header className="lesson-header">
          <button
            onClick={handleGoBack}
            className="mb-4 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
          >
            <FiArrowLeft />
            Back to Lessons
          </button>
          <h1 className="lesson-title">{lesson.title}</h1>
          <div className="lesson-metadata">
            <div className="metadata-item">
              <FiClock />
              <span>1 hour</span>
            </div>
            {lesson.topicName && (
              <div className="metadata-item">
                <span className="text-sm text-gray-400">
                  Topic: {lesson.topicName}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Video Player */}
        {lesson.videoUrl && (
          <div className="video-container">
            <VideoPlayer videoUrl={lesson.videoUrl} title={lesson.title} />
          </div>
        )}

        {/* Lesson Content */}
        {lesson.content && (
          <div
            className="lesson-content"
            dangerouslySetInnerHTML={{ __html: lesson.content }}
          />
        )}

        {/* Comments */}
        <CommentsSection lessonId={lesson.id} />
      </main>
    </div>
  )
}

export default LessonDetail

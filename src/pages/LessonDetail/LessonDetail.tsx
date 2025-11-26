import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import VideoPlayer from '../../components/ui/VideoPlayer'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { useLessonDetail } from '../../hooks/api/useLessonDetail'
import CommentsSection from '../../components/lesson/CommentsSection'
import { LearnedLessonService } from '../../services/api/learned-lesson.service'
import './LessonDetail.css'

const LessonDetail: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const { lesson, loading, error } = useLessonDetail(lessonId || '')

  // Lesson completion tracking
  const [showCompletionMessage, setShowCompletionMessage] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const hasMarkedAsCompletedRef = useRef(false)
  const learnedLessonServiceRef = useRef(new LearnedLessonService())

  // Mark lesson as completed
  const markLessonCompleted = useCallback(
    async (reason: 'scroll') => {
      console.log(
        `🔍 markLessonCompleted called - lessonId=${lessonId}, reason=${reason}, alreadyMarked=${hasMarkedAsCompletedRef.current}`
      )

      if (!lessonId) {
        console.error('❌ Cannot mark lesson: lessonId is empty')
        return
      }

      if (hasMarkedAsCompletedRef.current) {
        console.log('⚠️ Already marked as completed, skipping')
        return
      }

      hasMarkedAsCompletedRef.current = true
      try {
        console.log(`📤 Sending API request to mark lesson as completed...`)
        const success =
          await learnedLessonServiceRef.current.markLessonAsCompleted(lessonId)

        if (success) {
          setShowCompletionMessage(true)
          console.log(`✅ Lesson marked as completed via ${reason}`)

          // Auto-hide message after 3 seconds
          setTimeout(() => setShowCompletionMessage(false), 3000)
        } else {
          console.warn('⚠️ API returned false for success')
        }
      } catch (error) {
        console.error('❌ Error marking lesson as completed:', error)
        hasMarkedAsCompletedRef.current = false
      }
    },
    [lessonId]
  )

  // Scroll detection: Mark as completed when user reaches bottom
  useEffect(() => {
    console.log('🚀 Scroll listener setup...')

    let lastScrollCheck = 0

    const handleScroll = () => {
      console.log('🎯 Scroll event fired!')

      // Throttle scroll events to every 500ms
      const now = Date.now()
      if (now - lastScrollCheck < 500) return
      lastScrollCheck = now

      console.log('📍 Processing scroll...')

      if (hasMarkedAsCompletedRef.current) {
        console.log('⚠️ Already marked as completed')
        return
      }

      // Check window scroll (for normal page scroll)
      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const docHeight = document.body.scrollHeight

      console.log(
        `↕️ Scroll - scrollTop: ${Math.round(scrollTop)}, docHeight: ${Math.round(docHeight)}, windowHeight: ${Math.round(windowHeight)}`
      )

      // Calculate how far down the page we are
      const scrollableHeight = docHeight - windowHeight
      const scrollPercentage =
        scrollableHeight > 0 ? (scrollTop / scrollableHeight) * 100 : 0
      const distanceToBottom = docHeight - scrollTop - windowHeight

      console.log(
        `📊 Page scroll: ${scrollPercentage.toFixed(1)}% | Distance to bottom: ${Math.round(distanceToBottom)}px`
      )

      // Mark as complete if scrolled to 80% or within 200px of bottom
      // But only if user has actually scrolled down (scrollTop > 0)
      if (
        scrollTop > 0 &&
        (scrollPercentage >= 80 || distanceToBottom <= 200)
      ) {
        console.log('✅ Bottom of page detected! Marking lesson as complete...')

        if (lessonId) {
          markLessonCompleted('scroll')
        } else {
          console.error('❌ lessonId is not available')
        }
      }
    }

    // Log initial page info
    const docHeight = document.body.scrollHeight
    const windowHeight = window.innerHeight
    const isScrollable = docHeight > windowHeight
    console.log(
      `📊 Page info: docHeight=${docHeight}, windowHeight=${windowHeight}, isScrollable=${isScrollable}`
    )

    // Attach listener immediately
    console.log('🔗 Attaching scroll listener...')
    window.addEventListener('scroll', handleScroll, { passive: true })
    console.log('✅ Scroll listener attached to window')

    return () => {
      console.log('❌ Removing scroll listener')
      window.removeEventListener('scroll', handleScroll)
    }
  }, [lessonId, markLessonCompleted])

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
      <main className="lesson-main-content" ref={mainContentRef}>
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
            {lesson.topicName && (
              <div className="metadata-item">
                <span className="text-sm text-gray-400">
                  Topic: {lesson.topicName}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Completion Message */}
        {showCompletionMessage && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-500 bg-green-900 bg-opacity-40 px-4 py-4 text-green-300 shadow-lg">
            <FiCheckCircle className="flex-shrink-0 text-2xl" />
            <div>
              <p className="font-semibold">Lesson Completed! 🎉</p>
              <p className="mt-1 text-sm">
                This lesson has been marked as learned and saved to your
                progress.
              </p>
            </div>
          </div>
        )}

        {/* Video Player */}
        {lesson.videoUrl && (
          <div className="video-container">
            <VideoPlayer videoUrl={lesson.videoUrl} title={lesson.title} />
          </div>
        )}

        {/* Lesson Content */}
        {lesson.content && (
          <div
            ref={contentRef}
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

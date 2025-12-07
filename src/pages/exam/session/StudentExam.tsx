import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/stores'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  List,
  RotateCcw,
  LogOut,
  AlertCircle,
} from 'lucide-react'
import { Exam } from '@/types/exam.types'
import ExamHeader from '@/components/exam/ExamHeader'
import Button from '@/components/common/Button/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ChallengePicker from '@/components/exam/ChallengePicker'
import ProblemDetailPage from '@/pages/challengeDetail/ProblemDetailPage'
import './StudentExam.scss'
import { examService } from '@/services/api/exam.service'

const ExamProblemDetail = ProblemDetailPage as React.ComponentType<{
  problemIdOverride: string
}>

const StudentExam: React.FC = () => {
  const { examId, challengeId } = useParams<{
    examId: string
    challengeId: string
  }>()
  const navigate = useNavigate()
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [showWarning, setShowWarning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const reduxParticipationId = useSelector(
    (s: RootState) => s.exam?.currentParticipationId
  )

  const handleSubmitExam = useCallback(() => {
    ;(async () => {
      try {
        const participationId = reduxParticipationId
        if (examId && participationId) {
          await examService.submitExam(examId, participationId)
        } else {
          console.warn('No participationId in Redux; skipping server submit')
        }
      } catch (e) {
        console.warn('Failed to submit exam to API', e)
      } finally {
        navigate(`/exam/${examId}/results`)
      }
    })()
  }, [navigate, examId, reduxParticipationId])

  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true)
        if (examId) {
          const apiExam = await examService.getExamById(examId)
          setExam(apiExam)
          setTimeRemaining((apiExam.duration || 0) * 60)

          if (challengeId && apiExam.challenges) {
            const index = apiExam.challenges.findIndex(
              c => c.id === challengeId
            )
            if (index !== -1) setCurrentChallengeIndex(index)
          }
        }
      } catch (error) {
        console.error('Failed to fetch exam:', error)
        setExam(null)
      } finally {
        setLoading(false)
      }
    }

    fetchExam()
  }, [examId, challengeId])

  // Timer logic
  useEffect(() => {
    if (!exam || timeRemaining <= 0) return

    // Check if 5 minutes remaining
    if (timeRemaining === 5 * 60) {
      setShowWarning(true)
      setTimeout(() => setShowWarning(false), 5000)
    }

    // Auto submit if time is up
    if (timeRemaining === 0) {
      handleSubmitExam()
      return
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [timeRemaining, exam, handleSubmitExam])

  const handleNextChallenge = () => {
    if (exam && currentChallengeIndex < exam.challenges.length - 1) {
      setCurrentChallengeIndex(currentChallengeIndex + 1)
    }
  }

  const handlePrevChallenge = () => {
    if (currentChallengeIndex > 0) {
      setCurrentChallengeIndex(currentChallengeIndex - 1)
    }
  }

  const handleExitExam = () => {
    if (
      window.confirm(
        'Are you sure you want to exit? Your progress may not be saved.'
      )
    ) {
      navigate(-1)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!exam || !exam.challenges || exam.challenges.length === 0) {
    return (
      <div className="student-exam-page">
        <div className="error-state">
          <h2>Exam not found</h2>
        </div>
      </div>
    )
  }

  const currentChallenge = exam.challenges[currentChallengeIndex]
  const isFirstChallenge = currentChallengeIndex === 0
  const isLastChallenge = currentChallengeIndex === exam.challenges.length - 1

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
        transition: 'background-color 200ms ease, color 200ms ease',
      }}
    >
      <ExamHeader
        examTitle={exam.title}
        totalChallenges={exam.challenges.length}
        currentChallenge={currentChallengeIndex + 1}
        timeRemaining={timeRemaining}
        totalScore={0}
        onShowChallengeList={() => setShowPicker(true)}
      />

      {showWarning && (
        <div
          className="border-b"
          style={{
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            borderColor: 'rgba(251, 191, 36, 0.3)',
          }}
        >
          <div
            className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 text-sm font-semibold"
            style={{ color: '#f59e0b' }}
          >
            <AlertCircle size={18} />
            You have only 5 minutes remaining!
          </div>
        </div>
      )}

      <div className="relative">
        <ExamProblemDetail
          key={currentChallenge.id}
          problemIdOverride={currentChallenge.id}
        />

        <div className="fixed bottom-4 left-4 z-30 flex flex-wrap gap-2 md:bottom-6 md:left-6 md:gap-3">
          <Button
            onClick={handlePrevChallenge}
            disabled={isFirstChallenge}
            variant="secondary"
            size="md"
            icon={<ChevronLeft size={16} />}
          >
            Previous
          </Button>
          <Button
            onClick={handleNextChallenge}
            disabled={isLastChallenge}
            variant="secondary"
            size="md"
            icon={<ChevronRight size={16} />}
          >
            Next
          </Button>
          <Button
            onClick={() => setShowPicker(true)}
            variant="secondary"
            size="md"
            icon={<List size={16} />}
          >
            Challenges
          </Button>
        </div>

        <div className="fixed bottom-4 right-4 z-30 mb-10 flex flex-col gap-2 md:bottom-6 md:right-6 md:gap-3">
          {isLastChallenge && (
            <Button
              onClick={handleSubmitExam}
              variant="primary"
              size="md"
              icon={<RotateCcw size={16} />}
            >
              Submit exam
            </Button>
          )}
          <Button
            onClick={handleExitExam}
            variant="secondary"
            size="md"
            icon={<LogOut size={16} />}
          >
            Exit
          </Button>
        </div>
      </div>

      {showPicker && (
        <ChallengePicker
          challenges={exam.challenges}
          currentIndex={currentChallengeIndex}
          onClose={() => setShowPicker(false)}
          onSelectChallenge={index => {
            setCurrentChallengeIndex(index)
            setShowPicker(false)
          }}
        />
      )}
    </div>
  )
}

export default StudentExam

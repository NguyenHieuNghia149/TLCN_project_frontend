import React, { useState, useEffect, useRef, useCallback } from 'react'
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
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ChallengePicker from '@/components/exam/ChallengePicker'
import ProblemDetailPage from '@/pages/challengeDetail/ProblemDetailPage'
import './StudentExam.scss'

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

  const handleSubmitExam = useCallback(() => {
    // Submit exam logic
    console.log('Submitting exam...')
    // Navigate to results page
    navigate(`/exam/${examId}/results`)
  }, [navigate, examId])

  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true)
        // Mock data - replace with actual API call
        const mockExam: Exam = {
          id: examId || '1',
          title: 'Algorithms Midterm Test',
          password: 'test123',
          duration: 90,
          challenges: [
            {
              id: '1',
              title: 'Two Sum',
              description: 'Find two numbers that add up to target',
              difficulty: 'easy',
              topic: 'Array',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '2',
              title: 'Longest Substring',
              description: 'Find longest substring without repeating chars',
              difficulty: 'medium',
              topic: 'String',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: '3',
              title: 'Merge K Lists',
              description: 'Merge k sorted linked lists',
              difficulty: 'hard',
              topic: 'LinkedList',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: 'lecturer1',
          createdAt: new Date().toISOString(),
        }
        setExam(mockExam)
        setTimeRemaining(mockExam.duration * 60) // Convert to seconds

        // Set initial challenge index
        if (challengeId && mockExam.challenges) {
          const index = mockExam.challenges.findIndex(c => c.id === challengeId)
          if (index !== -1) {
            setCurrentChallengeIndex(index)
          }
        }
      } catch (error) {
        console.error('Failed to fetch exam:', error)
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
    <div className="min-h-screen bg-[#010308] text-gray-100">
      <ExamHeader
        examTitle={exam.title}
        totalChallenges={exam.challenges.length}
        currentChallenge={currentChallengeIndex + 1}
        timeRemaining={timeRemaining}
        totalScore={0}
        onShowChallengeList={() => setShowPicker(true)}
      />

      {showWarning && (
        <div className="bg-amber-500/10 text-amber-200">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 text-sm font-semibold">
            <AlertCircle size={18} />
            You have only 5 minutes remaining!
          </div>
        </div>
      )}

      <div className="relative">
        <ProblemDetailPage
          key={currentChallenge.id}
          problemIdOverride={currentChallenge.id}
        />

        <div className="fixed bottom-6 left-6 z-30 flex flex-wrap gap-3">
          <button
            onClick={handlePrevChallenge}
            disabled={isFirstChallenge}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <button
            onClick={handleNextChallenge}
            disabled={isLastChallenge}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-40"
          >
            Next
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition"
          >
            <List size={16} />
            Challenges
          </button>
        </div>

        <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
          {isLastChallenge && (
            <button
              onClick={handleSubmitExam}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-primary-400 px-5 py-3 text-sm font-semibold text-black shadow-[0_20px_45px_rgba(16,185,129,0.45)]"
            >
              <RotateCcw size={16} />
              Submit exam
            </button>
          )}
          <button
            onClick={handleExitExam}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100"
          >
            <LogOut size={16} />
            Exit
          </button>
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

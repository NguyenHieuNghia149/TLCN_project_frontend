import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store/stores'
import { setParticipation } from '@/store/slices/examSlice'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, List, Sun, Moon } from 'lucide-react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Button from '@/components/common/Button/Button'
import { Exam } from '@/types/exam.types'
import ExamProblemSection from '@/components/problem/ExamProblemSection'
import CodeEditorSection from '@/components/editor/CodeEditorSection'
import ChallengePicker from '@/components/exam/ChallengePicker'
import { ProblemDetailResponse } from '@/types/challenge.types'
import { submissionsService } from '@/services/api/submissions.service'
import type {
  SupportedLanguage,
  SandboxTestcaseResult,
} from '@/types/submission.types'
import type { TestCase, OutputState } from '@/types/editor.types'
import { io, Socket } from 'socket.io-client'
import './ExamChallengeDetail.scss'
// mocks removed: use real API only
import { examService } from '@/services/api/exam.service'
import { useTheme } from '@/contexts/useTheme'

const DEFAULT_CODE = `
#include <iostream>
using namespace std;

int main() {
 
    return 0;
}
`

const ExamChallengeDetail: React.FC = () => {
  const { examId, challengeId } = useParams<{
    examId: string
    challengeId: string
  }>()
  console.log('ExamChallengeDetail params:', { examId, challengeId })
  const navigate = useNavigate()
  const [exam, setExam] = useState<Exam | null>(null)
  const [problemData, setProblemData] = useState<
    ProblemDetailResponse['data'] | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [activeTab, setActiveTab] = useState<'question' | 'submissions'>(
    'question'
  )
  const [selectedLanguage, setSelectedLanguage] = useState('C++')
  const [code, setCode] = useState(DEFAULT_CODE)
  const [output, setOutput] = useState<OutputState>({
    status: 'idle',
    message: 'Ready to run tests',
  })
  const [selectedTestCase, setSelectedTestCase] = useState<string>('1')
  const [showChallengeList, setShowChallengeList] = useState(false)
  const [problemPanelWidth, setProblemPanelWidth] = useState(60)
  const dispatch = useDispatch()
  const reduxParticipationId = useSelector(
    (s: RootState) => s.exam?.currentParticipationId
  )
  const reduxStartAt = useSelector(
    (s: RootState) => s.exam?.currentParticipationStartAt
  )
  const splitPaneRef = useRef<HTMLDivElement | null>(null)
  const isDraggingSplitRef = useRef(false)
  const { theme, toggleTheme } = useTheme()
  const clampPanelWidth = useCallback((value: number) => {
    const MIN = 35
    const MAX = 75
    return Math.min(MAX, Math.max(MIN, value))
  }, [])

  const updateSplitFromClientX = useCallback(
    (clientX: number) => {
      if (!splitPaneRef.current) return
      const rect = splitPaneRef.current.getBoundingClientRect()
      if (!rect.width) return
      const relativeX = clientX - rect.left
      const nextWidth = (relativeX / rect.width) * 100
      setProblemPanelWidth(clampPanelWidth(nextWidth))
    },
    [clampPanelWidth]
  )

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!isDraggingSplitRef.current) return
      event.preventDefault()
      updateSplitFromClientX(event.clientX)
    }

    const onTouchMove = (event: TouchEvent) => {
      if (!isDraggingSplitRef.current) return
      const touch = event.touches[0]
      if (!touch) return
      updateSplitFromClientX(touch.clientX)
    }

    const stopDragging = () => {
      isDraggingSplitRef.current = false
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('touchmove', onTouchMove)
    window.addEventListener('mouseup', stopDragging)
    window.addEventListener('touchend', stopDragging)
    window.addEventListener('touchcancel', stopDragging)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('mouseup', stopDragging)
      window.removeEventListener('touchend', stopDragging)
      window.removeEventListener('touchcancel', stopDragging)
    }
  }, [updateSplitFromClientX])

  const startDraggingSplit = (
    event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    event.preventDefault()
    isDraggingSplitRef.current = true
    if ('touches' in event) {
      const touch = event.touches[0]
      if (touch) {
        updateSplitFromClientX(touch.clientX)
      }
    }
  }

  const resetSplit = () => setProblemPanelWidth(60)

  const pollTimerRef = useRef<number | null>(null)
  const countdownRef = useRef<number | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const socketTimeoutRef = useRef<number | null>(null)
  const isCompletedRef = useRef<boolean>(false)

  // Helper: format seconds to HH:MM:SS
  const formatSeconds = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    const hh = h > 0 ? String(h).padStart(2, '0') + ':' : ''
    return `${hh}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  useEffect(() => {
    const fetchData = async () => {
      console.log('Fetching challenge data for:', { examId, challengeId })
      if (!challengeId || !examId) return

      try {
        setLoading(true)
        setError(null)

        // Fetch exam basic info (to populate challenge list)
        try {
          const apiExam = await examService.getExamById(examId)
          setExam(apiExam)
        } catch (apiErr) {
          console.error('Failed to fetch exam from API', apiErr)
          setError('Failed to load exam')
          return
        }

        // Fetch challenge details from exam endpoint (lazy load per challenge)
        try {
          const response = await examService.getExamChallenge(
            examId,
            challengeId
          )
          console.log('Challenge response:', response)
          if (response && response.data) {
            const rawData = response.data
            const formattedData = {
              problem: {
                id: rawData.id,
                title: rawData.title,
                description: rawData.description || rawData.content, // Đề phòng backend dùng tên field khác
                difficulty: rawData.difficulty, // Chú ý: backend dùng 'difficult' hay 'difficulty'? Check lại model
                topic: rawData.topic,
                totalPoints: rawData.totalPoints,
                constraint: rawData.constraint,
                tags: rawData.tags || [],
                orderIndex: rawData.orderIndex,
                // Map thêm các trường khác của problem nếu cần
              },
              testcases: rawData.testcases || [],
              solution: rawData.solution,
            }
            setProblemData(formattedData as ProblemDetailResponse['data']) // Cast as any hoặc sửa lại Type Definition cho đúng
            setCode(rawData.initialCode || DEFAULT_CODE) // Nếu backend có trả về code mẫu
            // Do NOT persist current challenge id to localStorage for privacy/security.
            // Keep current challenge in Redux only to avoid leaking session identifiers.
          } else {
            console.error('Invalid challenge response')
            setError('Failed to load challenge')
            return
          }
        } catch (apiError) {
          console.error('Failed to fetch challenge from API', apiError)
          setError('Failed to load challenge')
          return
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [examId, challengeId])

  const clearPoll = () => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }

  useEffect(() => {
    return () => clearPoll()
  }, [])

  const clearSocketTimeout = () => {
    if (socketTimeoutRef.current) {
      window.clearTimeout(socketTimeoutRef.current)
      socketTimeoutRef.current = null
    }
  }

  const ensureSocket = () => {
    if (!socketRef.current) {
      socketRef.current = io('/', {
        transports: ['websocket'],
        withCredentials: true,
      })
    }
    return socketRef.current
  }

  const leaveSubmissionRoom = (submissionId: string) => {
    const s = socketRef.current
    if (s) {
      s.emit('leave_submission', { submissionId })
    }
  }

  const normalizeStatus = (status?: string) => {
    if (!status) return ''
    const s = status.toUpperCase()
    const map: Record<string, string> = {
      PENDING: 'pending',
      RUNNING: 'running',
      ACCEPTED: 'accepted',
      WRONG_ANSWER: 'wrong_answer',
      TIME_LIMIT_EXCEEDED: 'time_limit_exceeded',
      MEMORY_LIMIT_EXCEEDED: 'memory_limit_exceeded',
      RUNTIME_ERROR: 'runtime_error',
      COMPILATION_ERROR: 'compilation_error',
      FAILED: 'failed',
    }
    return map[s] || status.toLowerCase()
  }

  const coerceResults = (
    results?: Array<{
      index: number
      input: string
      expected?: string
      expectedOutput?: string
      actual?: string
      actualOutput?: string
      ok: boolean
      stderr?: string
      executionTime?: number
    }>
  ): SandboxTestcaseResult[] | undefined => {
    if (!Array.isArray(results)) return undefined
    return results.map(r => ({
      index: r.index,
      input: r.input,
      expectedOutput: r.expectedOutput ?? r.expected ?? '',
      actualOutput: r.actualOutput ?? r.actual ?? '',
      ok: r.ok,
      stderr: r.stderr || '',
      executionTime: r.executionTime ?? 0,
    }))
  }

  const languageToApi = (lang: string): SupportedLanguage => {
    const l = lang.toLowerCase()
    if (l === 'c++' || l === 'cpp') return 'cpp'
    if (l === 'python') return 'python'
    if (l === 'java') return 'java'
    return 'javascript'
  }

  const handleRun = async () => {
    if (!problemData?.problem.id) return
    setOutput({ status: 'running', message: 'Running tests...' })
    try {
      const participationIdToUse = reduxParticipationId || undefined
      const payload = {
        sourceCode: code,
        language: languageToApi(selectedLanguage),
        problemId: problemData.problem.id,
        ...(participationIdToUse
          ? { participationId: participationIdToUse }
          : {}),
      }
      const data = await submissionsService.runCode(payload)
      const summary = data.data.summary
      setOutput({
        status: summary.passed === summary.total ? 'accepted' : 'rejected',
        message:
          summary.passed === summary.total
            ? 'All test cases passed!'
            : `Passed ${summary.passed}/${summary.total} test cases`,
        passedTests: summary.passed,
        totalTests: summary.total,
        results: data.data.results,
        processingTime: data.data.processingTime,
      })
    } catch (err) {
      setOutput({
        status: 'rejected',
        message:
          (err as { message?: string }).message ||
          'Run code failed. Please try again.',
        error: (err as { message?: string }).message,
      })
    }
  }

  const handleSubmit = async () => {
    if (!problemData?.problem.id) return
    setOutput({ status: 'running', message: 'Submitting...' })
    try {
      const participationIdToUse = reduxParticipationId || undefined
      const payload = {
        sourceCode: code,
        language: languageToApi(selectedLanguage),
        problemId: problemData.problem.id,
        ...(participationIdToUse
          ? { participationId: participationIdToUse }
          : {}),
      }
      const create = await submissionsService.submitCode(payload)
      const submissionId = create.submissionId

      // Socket realtime updates
      try {
        const s = ensureSocket()
        s.emit('join_submission', { submissionId })

        const onUpdate = (update: {
          submissionId?: string
          status?: string
          result?: {
            passed?: number
            total?: number
            results?: Array<{
              index: number
              input: string
              expected?: string
              expectedOutput?: string
              actual?: string
              actualOutput?: string
              ok: boolean
              stderr?: string
              executionTime?: number
            }>
          }
        }) => {
          if (!update || update.submissionId !== submissionId) return
          clearSocketTimeout()
          const normalized = normalizeStatus(update.status)
          const isTerminal = [
            'accepted',
            'wrong_answer',
            'time_limit_exceeded',
            'memory_limit_exceeded',
            'runtime_error',
            'compilation_error',
            'failed',
          ].includes(normalized)
          const passed = update.result?.passed
          const total = update.result?.total
          setOutput(prev => ({
            status: isTerminal
              ? normalized === 'accepted'
                ? 'accepted'
                : 'rejected'
              : 'running',
            message: isTerminal
              ? normalized === 'accepted'
                ? 'You have successfully completed this problem!'
                : `Status: ${normalized}${
                    typeof passed === 'number' && typeof total === 'number'
                      ? ` • ${passed}/${total}`
                      : ''
                  }`
              : typeof passed === 'number' && typeof total === 'number'
                ? `Running... ${passed}/${total} passed`
                : 'Running...',
            passedTests: passed,
            totalTests: total,
            results: coerceResults(update.result?.results) || prev.results,
          }))
          if (isTerminal) {
            isCompletedRef.current = true
            s.off('submission_update', onUpdate)
            leaveSubmissionRoom(submissionId)
            clearPoll()
          }
        }

        s.on('submission_update', onUpdate)

        // Fallback to polling if socket silent for 6s
        clearSocketTimeout()
        socketTimeoutRef.current = window.setTimeout(() => {
          s.off('submission_update', onUpdate)
          leaveSubmissionRoom(submissionId)
        }, 6000)
      } catch {
        // ignore socket errors and rely on polling
      }

      const checkOnce = async () => {
        try {
          const detail = await submissionsService.getSubmission(submissionId)
          const normalized = normalizeStatus(detail.status)
          const terminal = [
            'accepted',
            'wrong_answer',
            'time_limit_exceeded',
            'memory_limit_exceeded',
            'runtime_error',
            'compilation_error',
            'failed',
          ]
          if (terminal.includes(normalized)) {
            const passed = detail.result?.passed ?? 0
            const total = detail.result?.total ?? problemData.testcases.length
            setOutput({
              status: normalized === 'accepted' ? 'accepted' : 'rejected',
              message:
                normalized === 'accepted'
                  ? 'You have successfully completed this problem!'
                  : `Status: ${normalized}. Passed ${passed}/${total}`,
              passedTests: passed,
              totalTests: total,
              results: coerceResults(detail.result?.results),
            })
            clearPoll()
            return true
          } else {
            const partialPassed = detail.result?.passed
            const partialTotal = detail.result?.total
            setOutput({
              status: 'running',
              message:
                partialPassed !== undefined && partialTotal !== undefined
                  ? `Running... ${partialPassed}/${partialTotal} passed`
                  : 'Running...',
              passedTests: partialPassed,
              totalTests: partialTotal,
              results: coerceResults(detail.result?.results),
            })
            return false
          }
        } catch (e) {
          setOutput({
            status: 'rejected',
            message:
              (e as { message?: string }).message ||
              'Failed to get submission status',
            error: (e as { message?: string }).message,
          })
          clearPoll()
          return true
        }
      }

      // Poll every 2s until terminal status
      clearPoll()
      // Immediate fetch once so UI updates without initial delay
      const finished = await checkOnce()
      if (!finished && !isCompletedRef.current) {
        pollTimerRef.current = window.setInterval(async () => {
          const done = await checkOnce()
          if (done) {
            clearPoll()
            isCompletedRef.current = true
          }
        }, 2000)
      }
    } catch (err) {
      setOutput({
        status: 'rejected',
        message:
          (err as { message?: string }).message ||
          'Submit failed. Please try again.',
        error: (err as { message?: string }).message,
      })
    }
  }

  const handleReset = () => {
    setCode(DEFAULT_CODE)
  }

  const handleSubmitExam = useCallback(async () => {
    if (
      !window.confirm(
        'Are you sure you want to submit the exam? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      const participationId = reduxParticipationId
      if (examId && participationId) {
        await examService.submitExam(examId, participationId)
      }
    } catch (e) {
      console.warn('Failed to submit exam to API', e)
    } finally {
      navigate(`/exam/${examId}/results`)
    }
  }, [navigate, examId, reduxParticipationId])

  // Initialize and manage countdown separately so hooks don't depend on `handleSubmitExam` definition order
  useEffect(() => {
    if (!exam) return

    let cancelled = false

    const init = async () => {
      const participationId = reduxParticipationId
      const startAtRaw = reduxStartAt
      const totalSeconds = (exam.duration || 0) * 60

      // Check if user joined. If Redux lacks participation, try server-backed resume.
      if (!participationId) {
        try {
          if (examId) {
            const myPartRes = await examService.getMyParticipation(examId)
            const part = myPartRes?.data || myPartRes
            const partId = part?.id || part?.participationId
            const serverStart =
              part?.startedAt ||
              part?.startAt ||
              part?.startTimestamp ||
              part?.startedAtMs
            if (partId) {
              const startAtValue = serverStart ?? Date.now()
              try {
                dispatch(
                  setParticipation({
                    participationId: partId,
                    startAt: startAtValue,
                  })
                )
              } catch (e) {
                console.warn(
                  'Failed to dispatch recovered participation to redux',
                  e
                )
              }
              // proceed as joined
            } else {
              setIsJoined(false)
              return
            }
          } else {
            setIsJoined(false)
            return
          }
        } catch {
          // server recovery failed -> not joined
          setIsJoined(false)
          return
        }
      }

      setIsJoined(true)

      let startAtMs: number | null = null
      if (startAtRaw) {
        const asNumber = Number(startAtRaw)
        if (!Number.isNaN(asNumber) && isFinite(asNumber)) {
          startAtMs = asNumber
        } else {
          const parsed =
            typeof startAtRaw === 'string'
              ? Date.parse(startAtRaw)
              : Number(startAtRaw)
          if (!Number.isNaN(parsed)) startAtMs = parsed
        }
      } else {
        // Try to recover session info from server if startAt missing
        try {
          if (examId && participationId) {
            const partRes = await examService.getParticipation(
              examId,
              participationId
            )
            const partData = partRes?.data || partRes
            const serverStart =
              partData?.startedAt ||
              partData?.startAt ||
              partData?.startTimestamp ||
              partData?.startedAtMs
            if (serverStart) {
              // persist recovered start into Redux and localStorage
              try {
                // ensure we pass null when undefined to match slice typing
                dispatch(
                  setParticipation({
                    participationId: participationId ?? null,
                    startAt: serverStart,
                  })
                )
              } catch (err) {
                console.warn(
                  'Failed to dispatch recovered startAt to redux',
                  err
                )
              }
              // Do NOT persist recovered startAt to localStorage for privacy/security.
              const asNumber = Number(serverStart)
              if (!Number.isNaN(asNumber) && isFinite(asNumber)) {
                startAtMs = asNumber
              } else {
                const parsed = Date.parse(serverStart)
                if (!Number.isNaN(parsed)) startAtMs = parsed
              }
            }
            // recover current challenge id if server provides
            const serverCurrentChallenge =
              partData?.currentChallengeId || partData?.currentChallenge
            if (serverCurrentChallenge) {
              // Do NOT persist recovered currentChallengeId to localStorage for privacy/security.
            }
          }
        } catch (e) {
          console.warn('Failed to recover participation from server', e)
        }
      }

      const elapsed = startAtMs
        ? Math.floor((Date.now() - startAtMs) / 1000)
        : 0
      let remaining = Math.max(0, totalSeconds - elapsed)
      if (cancelled) return
      setTimeRemaining(remaining)

      // Check for 5 minute warning
      if (remaining === 5 * 60) {
        setShowTimeWarning(true)
        setTimeout(() => setShowTimeWarning(false), 5000)
      }

      // If time already up -> auto submit
      if (remaining <= 0) {
        handleSubmitExam()
        return
      }

      // start interval
      if (cancelled) return
      countdownRef.current = window.setInterval(() => {
        remaining -= 1
        setTimeRemaining(remaining)
        // Check for 5 minute warning
        if (remaining === 5 * 60) {
          setShowTimeWarning(true)
          setTimeout(() => setShowTimeWarning(false), 5000)
        }
        if (remaining <= 0) {
          if (countdownRef.current) {
            window.clearInterval(countdownRef.current)
            countdownRef.current = null
          }
          handleSubmitExam()
        }
      }, 1000)
    }

    init()

    return () => {
      cancelled = true
      if (countdownRef.current) {
        window.clearInterval(countdownRef.current)
        countdownRef.current = null
      }
    }
  }, [
    exam,
    examId,
    handleSubmitExam,
    dispatch,
    reduxParticipationId,
    reduxStartAt,
  ])

  // Convert API test cases to the format expected by CodeEditorSection
  const testCases: TestCase[] =
    problemData?.testcases.map((tc, index) => ({
      id: tc.id,
      name: `Case ${index + 1}`,
      input: tc.input,
      expectedOutput: tc.output,
      isPublic: tc.isPublic,
    })) || []

  if (loading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{
          backgroundColor: 'var(--background-color)',
          color: 'var(--text-color)',
        }}
      >
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4">Loading challenge...</p>
        </div>
      </div>
    )
  }

  // Guard: redirect if not joined
  if (!isJoined) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{
          backgroundColor: 'var(--background-color)',
          color: 'var(--text-color)',
        }}
      >
        <div className="text-center">
          <p className="mb-4" style={{ color: '#f59e0b' }}>
            You must join the exam first before accessing challenges.
          </p>
          <Button
            onClick={() => navigate(`/exam/${examId}`)}
            variant="secondary"
            size="md"
          >
            Back to Exam
          </Button>
        </div>
      </div>
    )
  }

  if (error || !problemData) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{
          backgroundColor: 'var(--background-color)',
          color: 'var(--text-color)',
        }}
      >
        <div className="text-center">
          <p className="mb-4" style={{ color: '#ef4444' }}>
            {error || 'Challenge not found'}
          </p>
          <Button
            onClick={() => navigate(`/exam/${examId}`)}
            variant="secondary"
            size="md"
          >
            Back to Exam
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex h-screen flex-col"
      style={{
        backgroundColor: 'var(--background-color)',
        color: 'var(--text-color)',
      }}
    >
      {/* 5-minute warning banner */}
      {showTimeWarning && (
        <div
          className="border-b"
          style={{
            backgroundColor: 'rgba(251, 191, 36, 0.1)',
            borderColor: 'rgba(251, 191, 36, 0.3)',
          }}
        >
          <div
            className="mx-auto flex max-w-full items-center gap-3 px-4 py-3 text-sm font-semibold"
            style={{ color: '#f59e0b' }}
          >
            <Clock size={18} />
            You have only 5 minutes remaining!
          </div>
        </div>
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b"
        style={{
          backgroundColor: 'var(--exam-panel-bg)',
          borderColor: 'var(--surface-border)',
          transition: 'background-color 200ms ease, border-color 200ms ease',
        }}
      >
        <div className="mx-auto flex max-w-full flex-col gap-3 px-4 py-3 md:px-6 md:py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            {/* s */}
            <div>
              <h1
                className="text-lg font-semibold md:text-xl"
                style={{ color: 'var(--text-color)' }}
              >
                {problemData.problem.title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{
                backgroundColor: 'var(--exam-toolbar-bg)',
                border: '1px solid var(--surface-border)',
              }}
            >
              <Clock size={16} style={{ color: 'var(--accent)' }} />
              <span className="text-sm" style={{ color: 'var(--muted-text)' }}>
                Time remaining:{' '}
                {timeRemaining !== null
                  ? formatSeconds(timeRemaining)
                  : exam
                    ? formatSeconds((exam.duration || 0) * 60)
                    : '00:00'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-lg border transition-all focus:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: 'var(--exam-toolbar-bg)',
                borderColor: 'var(--surface-border)',
                color: 'var(--text-color)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
              }}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun size={18} style={{ color: 'var(--accent)' }} />
              ) : (
                <Moon size={18} style={{ color: 'var(--accent)' }} />
              )}
            </button>
            <Button
              onClick={() => setShowChallengeList(true)}
              variant="secondary"
              size="sm"
              icon={<List size={16} />}
              aria-label="View all challenges"
            >
              View All Challenges
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div
        ref={splitPaneRef}
        className="flex min-h-0 flex-1 flex-col lg:flex-row"
        style={{ borderTop: '1px solid var(--surface-border)' }}
      >
        <div
          className="flex h-full min-h-0 min-w-[280px] flex-col overflow-hidden lg:border-r"
          style={{
            borderColor: 'var(--surface-border)',
            flexBasis: `${problemPanelWidth}%`,
            maxWidth: `${problemPanelWidth}%`,
          }}
        >
          <ExamProblemSection
            activeTab={activeTab}
            onTabChange={setActiveTab}
            problemData={problemData}
          />
        </div>

        <div
          className="hidden w-1 cursor-col-resize select-none lg:block"
          style={{ backgroundColor: 'var(--surface-border)' }}
          onMouseDown={startDraggingSplit}
          onTouchStart={startDraggingSplit}
          onDoubleClick={resetSplit}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          tabIndex={-1}
        />

        <div
          className="flex h-full min-h-0 min-w-[320px] flex-1 overflow-hidden"
          style={{
            flexBasis: `${100 - problemPanelWidth}%`,
            maxWidth: `${100 - problemPanelWidth}%`,
          }}
        >
          <CodeEditorSection
            code={code}
            onCodeChange={setCode}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            testCases={testCases}
            selectedTestCase={selectedTestCase}
            onTestCaseSelect={setSelectedTestCase}
            output={output}
            onRun={handleRun}
            onSubmit={handleSubmit}
            onReset={handleReset}
          />
        </div>
      </div>

      {showChallengeList &&
        exam &&
        exam.challenges &&
        exam.challenges.length > 0 && (
          <ChallengePicker
            challenges={exam.challenges}
            currentIndex={
              exam.challenges.findIndex(c => c.id === challengeId) >= 0
                ? exam.challenges.findIndex(c => c.id === challengeId)
                : 0
            }
            onClose={() => setShowChallengeList(false)}
            onSelectChallenge={index => {
              const selectedChallenge = exam.challenges[index]
              if (selectedChallenge) {
                navigate(`/exam/${examId}/challenge/${selectedChallenge.id}`)
                setShowChallengeList(false)
              }
            }}
            totalPoints={exam.challenges.reduce(
              (sum, ch) => sum + (ch.totalPoints || 0),
              0
            )}
            onSubmitExam={handleSubmitExam}
          />
        )}
    </div>
  )
}

export default ExamChallengeDetail

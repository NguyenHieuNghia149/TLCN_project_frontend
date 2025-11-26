import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, List, Sun, Moon } from 'lucide-react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Button from '@/components/common/Button/Button'
import { Exam } from '@/types/exam.types'
import ExamProblemSection from '@/components/problem/ExamProblemSection'
import CodeEditorSection from '@/components/editor/CodeEditorSection'
import ChallengePicker from '@/components/exam/ChallengePicker'
import { challengeService } from '@/services/api/challenge.service'
import { ProblemDetailResponse } from '@/types/challenge.types'
import { submissionsService } from '@/services/api/submissions.service'
import type {
  SupportedLanguage,
  SandboxTestcaseResult,
} from '@/types/submission.types'
import type { TestCase, OutputState } from '@/types/editor.types'
import { io, Socket } from 'socket.io-client'
import './ExamChallengeDetail.scss'
import { buildMockExam } from '@/mocks/exam.mock'
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
  const navigate = useNavigate()
  const [exam, setExam] = useState<Exam | null>(null)
  const [problemData, setProblemData] = useState<
    ProblemDetailResponse['data'] | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
  const socketRef = useRef<Socket | null>(null)
  const socketTimeoutRef = useRef<number | null>(null)
  const isCompletedRef = useRef<boolean>(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!challengeId) return

      try {
        setLoading(true)
        setError(null)

        // Fetch exam data (mock for now - in real app, fetch from API)
        const mockExam: Exam = buildMockExam({
          id: examId || 'exam-001',
        })
        setExam(mockExam)

        // Helper function to create mock problem data
        const createMockProblemData = () => {
          // Create mock problem data based on challengeId
          const currentChallenge =
            mockExam.challenges.find(
              (c: { id: string }) => c.id === challengeId
            ) || mockExam.challenges[0]
          const mockProblemData: ProblemDetailResponse['data'] = {
            problem: {
              id: challengeId || '1',
              title: currentChallenge?.title || 'Two Sum',
              description:
                currentChallenge?.description ||
                'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
              difficulty:
                (currentChallenge?.difficulty as 'easy' | 'medium' | 'hard') ||
                'easy',
              constraint:
                '2 ≤ nums.length ≤ 10⁴\n-10⁹ ≤ nums[i] ≤ 10⁹\n-10⁹ ≤ target ≤ 10⁹\nOnly one valid answer exists.',
              tags: [currentChallenge?.topic || 'Array'],
              lessonId: '',
              topicId: '',
              totalPoints: currentChallenge?.totalPoints || 30,
              isSolved: false,
              isFavorite: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            testcases: [
              {
                id: '1',
                input: 'nums = [2,7,11,15], target = 9',
                output: '[0,1]',
                isPublic: true,
                point: 10,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: '2',
                input: 'nums = [3,2,4], target = 6',
                output: '[1,2]',
                isPublic: true,
                point: 10,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: '3',
                input: 'nums = [3,3], target = 6',
                output: '[0,1]',
                isPublic: false,
                point: 10,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            solution: {
              id: '1',
              title: 'Solution',
              description: 'Solutions will be available after exam completion.',
              videoUrl: '',
              imageUrl: '',
              isVisible: false,
              solutionApproaches: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }
          setProblemData(mockProblemData)
          setCode(DEFAULT_CODE)
        }

        // Try to fetch challenge data from API
        try {
          const response = await challengeService.getChallengeById(challengeId)
          if (response && response.success && response.data) {
            setProblemData(response.data)
            setCode(DEFAULT_CODE)
          } else {
            // Fallback to mock data if API response is invalid
            console.warn('API response invalid, using mock data')
            createMockProblemData()
          }
        } catch (apiError) {
          // Fallback to mock data if API fails
          console.warn('API call failed, using mock data:', apiError)
          createMockProblemData()
        }
      } catch (err) {
        console.error('Error in fetchData:', err)
        // Try to create mock data as last resort
        // Note: exam might not be set yet, so we'll create minimal mock
        const minimalMock: ProblemDetailResponse['data'] = {
          problem: {
            id: challengeId || '1',
            title: 'Two Sum',
            description:
              'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            difficulty: 'easy',
            constraint: '2 ≤ nums.length ≤ 10⁴',
            tags: ['Array'],
            lessonId: '',
            topicId: '',
            totalPoints: 30,
            isSolved: false,
            isFavorite: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          testcases: [
            {
              id: '1',
              input: 'nums = [2,7,11,15], target = 9',
              output: '[0,1]',
              isPublic: true,
              point: 10,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          solution: {
            id: '1',
            title: 'Solution',
            description: 'Solutions will be available after exam completion.',
            videoUrl: '',
            imageUrl: '',
            isVisible: false,
            solutionApproaches: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        }
        setProblemData(minimalMock)
        setCode(DEFAULT_CODE)
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
      const payload = {
        sourceCode: code,
        language: languageToApi(selectedLanguage),
        problemId: problemData.problem.id,
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
      const payload = {
        sourceCode: code,
        language: languageToApi(selectedLanguage),
        problemId: problemData.problem.id,
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

  const handleSubmitExam = () => {
    if (
      window.confirm(
        'Are you sure you want to submit the exam? This action cannot be undone.'
      )
    ) {
      navigate(`/exam/${examId}/results`)
    }
  }

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
                Time remaining: --:--
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
                navigate(
                  `/exam/${examId}/challenge/${selectedChallenge.id}/preview`
                )
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

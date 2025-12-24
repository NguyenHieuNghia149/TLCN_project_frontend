import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import ProblemSection from '../../components/problem/ProblemSection'
import CodeEditorSection from '../../components/editor/CodeEditorSection'
import { challengeService } from '../../services/api/challenge.service'
import { ProblemDetailResponse } from '../../types/challenge.types'
import ProblemHeader from '../../components/problem/ProblemHeader'
import { useProblemNavigation } from '../../hooks/common/useProblemNavigation'
import { submissionsService } from '@/services/api/submissions.service'
import { examService } from '@/services/api/exam.service'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/stores'
import type {
  SupportedLanguage,
  SandboxTestcaseResult,
  RunOrSubmitPayload,
} from '@/types/submission.types'
import type { TestCase, OutputState } from '@/types/editor.types'
import { io, Socket } from 'socket.io-client'
import useDebouncedCallback from '@/hooks/useDebouncedCallback'
import { normalizeSubmissionStatus } from '@/utils/submissionStatus'

// Types moved to src/types/editor.types.ts

const DEFAULT_CODE = `
#include <iostream>
using namespace std;

int main() {
 
    return 0;
}
`

export default function ProblemDetailPage({
  problemIdOverride,
}: {
  problemIdOverride?: string
}) {
  const params = useParams<{ id?: string }>()
  const id = problemIdOverride ?? params.id
  const [activeTab, setActiveTab] = useState<
    'question' | 'solution' | 'submissions' | 'discussion'
  >('question')
  const [selectedLanguage, setSelectedLanguage] = useState('C++')
  const [code, setCode] = useState(DEFAULT_CODE)
  const [output, setOutput] = useState<OutputState>({
    status: 'idle',
    message: 'Ready to run tests',
  })
  const [selectedTestCase, setSelectedTestCase] = useState<string>('1')
  const [problemData, setProblemData] = useState<
    ProblemDetailResponse['data'] | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Use custom hook for navigation logic
  const { navigationLoading, hasPrev, hasNext, goPrev, goNext } =
    useProblemNavigation({
      currentProblemId: id,
      topicId: problemData?.problem.topicId,
    })

  useEffect(() => {
    const fetchProblemData = async () => {
      if (!id) return

      try {
        setLoading(true)
        const response = await challengeService.getChallengeById(id)
        if (response.success) {
          setProblemData(response.data)
        } else {
          setError('Failed to load problem data')
        }
      } catch (err) {
        setError('Error loading problem data')
        console.error('Error fetching problem:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProblemData()
  }, [id])

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      // Alt + Left Arrow for previous
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      }

      // Alt + Right Arrow for next
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goPrev, goNext])

  const languageToApi = (lang: string): SupportedLanguage => {
    const l = lang.toLowerCase()
    if (l === 'c++' || l === 'cpp') return 'cpp'
    if (l === 'python') return 'python'
    if (l === 'java') return 'java'
    return 'javascript'
  }

  // Read participation id from Redux at top-level (do not call hooks inside handlers)
  const reduxParticipationId = useSelector(
    (s: RootState) => s.exam?.currentParticipationId
  )
  const participationIdToUse = reduxParticipationId || undefined

  const handleRun = async () => {
    if (!problemData?.problem.id) return
    setOutput({ status: 'running', message: 'Running tests...' })
    try {
      const payload = {
        sourceCode: code,
        language: languageToApi(selectedLanguage),
        problemId: problemData.problem.id,
        ...(participationIdToUse
          ? { participationId: participationIdToUse }
          : {}),
      }
      const data = await submissionsService.runCode(payload)
      const submissionId = data.submissionId

      // Reuse socket logic similar to handleSubmit but without DB polling
      // Join socket room
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

        const allResults = coerceResults(update.result?.results) || []
        const publicResults = allResults.filter(
          r => r.isPublic !== false && testCases[r.index]?.isPublic !== false
        )
        const passed = publicResults.filter(r => r.ok).length
        const total = publicResults.length

        setOutput(prev => ({
          status: isTerminal
            ? normalized === 'accepted'
              ? 'accepted'
              : 'rejected'
            : 'running',
          message: isTerminal
            ? normalized === 'accepted'
              ? 'All test cases passed!'
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
          results: publicResults.length ? publicResults : prev.results,
        }))

        if (isTerminal) {
          s.off('submission_update', onUpdate)
          leaveSubmissionRoom(submissionId)
        }
      }

      s.on('submission_update', onUpdate)

      // Fallback timeout since we have no DB polling to rely on for ephemeral runs
      clearSocketTimeout()
      socketTimeoutRef.current = window.setTimeout(() => {
        s.off('submission_update', onUpdate)
        leaveSubmissionRoom(submissionId)
        if (output.status === 'running') {
          setOutput({
            status: 'rejected',
            message: 'Execution timed out (no response from server).',
            error: 'Socket timeout',
          })
        }
      }, 30000) // 30s timeout
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

  const pollTimerRef = useRef<number | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const socketTimeoutRef = useRef<number | null>(null)
  const isCompletedRef = useRef<boolean>(false)
  const splitPaneRef = useRef<HTMLDivElement | null>(null)
  const isDraggingSplitRef = useRef(false)
  const [problemPanelWidth, setProblemPanelWidth] = useState(60)
  const clampWidth = useCallback((nextWidth: number) => {
    const MIN = 35
    const MAX = 75
    return Math.min(MAX, Math.max(MIN, nextWidth))
  }, [])

  const updateSplitFromClientX = useCallback(
    (clientX: number) => {
      if (!splitPaneRef.current) return
      const rect = splitPaneRef.current.getBoundingClientRect()
      if (rect.width === 0) return
      const relativeX = clientX - rect.left
      const nextWidth = (relativeX / rect.width) * 100
      setProblemPanelWidth(clampWidth(nextWidth))
    },
    [clampWidth]
  )

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingSplitRef.current) return
      event.preventDefault()
      updateSplitFromClientX(event.clientX)
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!isDraggingSplitRef.current) return
      const touch = event.touches[0]
      if (!touch) return
      updateSplitFromClientX(touch.clientX)
    }

    const stopDragging = () => {
      isDraggingSplitRef.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('mouseup', stopDragging)
    window.addEventListener('touchend', stopDragging)
    window.addEventListener('touchcancel', stopDragging)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
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
      // Connect to the backend root URL (not /api)
      const socketUrl =
        import.meta.env.REACT_APP_API_URL || 'https://api.algoforge.site'
      socketRef.current = io(socketUrl, {
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
      index?: number
      testcaseId?: string
      input: string
      expected?: string
      expectedOutput?: string
      actual?: string
      actualOutput?: string
      ok?: boolean
      isPassed?: boolean
      stderr?: string
      executionTime?: number
      isPublic?: boolean
    }>
  ): SandboxTestcaseResult[] | undefined => {
    if (!Array.isArray(results)) return undefined
    return results.map((r, idx) => ({
      index: r.index ?? idx, // Use provided index or fallback to array index
      input: r.input,
      expectedOutput: r.expectedOutput ?? r.expected ?? '',
      actualOutput: r.actualOutput ?? r.actual ?? '',
      ok: r.ok ?? r.isPassed ?? false,
      stderr: r.stderr || '',
      executionTime: r.executionTime ?? 0,
      isPublic: r.isPublic ?? true, // Default to true if not provided
    }))
  }

  const handleSubmit = async () => {
    if (!problemData?.problem.id) return
    setOutput({ status: 'running', message: 'Submitting...', isSubmit: true })
    try {
      const payload: RunOrSubmitPayload = {
        sourceCode: code,
        language: languageToApi(selectedLanguage),
        problemId: problemData.problem.id,
      }
      if (participationIdToUse) payload.participationId = participationIdToUse
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
          const allResults = coerceResults(update.result?.results) || []
          const publicResults = allResults.filter(
            r => r.isPublic !== false && testCases[r.index]?.isPublic !== false
          )

          // For submit: Use backend status (all testcases)
          // If backend doesn't provide summary, calculate from results
          const allPassed =
            update.result?.passed ?? allResults.filter(r => r.ok).length
          const allTotal = update.result?.total ?? allResults.length
          const uiStatus = normalizeSubmissionStatus(normalized)

          setOutput(prev => ({
            status: isTerminal
              ? normalized === 'accepted'
                ? 'accepted'
                : 'rejected'
              : 'running',
            message: isTerminal
              ? normalized === 'accepted'
                ? 'You have successfully completed this problem!'
                : `Status: ${normalized}${typeof allPassed === 'number' && typeof allTotal === 'number' ? ` • ${allPassed}/${allTotal}` : ''}`
              : typeof allPassed === 'number' && typeof allTotal === 'number'
                ? `Running... ${allPassed}/${allTotal} passed`
                : 'Running...',
            passedTests: allPassed,
            totalTests: allTotal,
            results: publicResults.length ? publicResults : prev.results,
            isSubmit: true,
            normalizedStatus: uiStatus,
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
            // Filter public test cases for display
            const allResults = coerceResults(detail.result?.results) || []
            const publicResults = allResults.filter(
              r =>
                r.isPublic !== false && testCases[r.index]?.isPublic !== false
            )

            // Use ALL testcases count from backend for status consistency
            // If backend doesn't provide summary, calculate from results
            const allPassed =
              detail.result?.passed ?? allResults.filter(r => r.ok).length
            const allTotal = detail.result?.total ?? allResults.length
            const uiStatus = normalizeSubmissionStatus(normalized)

            setOutput({
              status: normalized === 'accepted' ? 'accepted' : 'rejected',
              message:
                normalized === 'accepted'
                  ? 'You have successfully completed this problem!'
                  : `Status: ${normalized}. Passed ${allPassed}/${allTotal}`,
              passedTests: allPassed,
              totalTests: allTotal,
              results: publicResults,
              isSubmit: true,
              normalizedStatus: uiStatus,
            })
            clearPoll()
            return true
          } else {
            // Filter public test cases for display
            const allResults = coerceResults(detail.result?.results) || []
            const publicResults = allResults.filter(
              r =>
                r.isPublic !== false && testCases[r.index]?.isPublic !== false
            )

            // Use ALL testcases count from backend
            // If backend doesn't provide summary, calculate from results
            const allPassed =
              detail.result?.passed ?? allResults.filter(r => r.ok).length
            const allTotal = detail.result?.total ?? allResults.length
            const uiStatus = normalizeSubmissionStatus(normalized)

            setOutput({
              status: 'running',
              message:
                allPassed !== undefined && allTotal !== undefined
                  ? `Running... ${allPassed}/${allTotal} passed`
                  : 'Running...',
              passedTests: allPassed,
              totalTests: allTotal,
              results: publicResults,
              isSubmit: true,
              normalizedStatus: uiStatus,
            })
            return false
          }
        } catch (e) {
          const uiStatus = normalizeSubmissionStatus('failed')
          setOutput({
            status: 'rejected',
            message:
              (e as { message?: string }).message ||
              'Failed to get submission status',
            error: (e as { message?: string }).message,
            isSubmit: true,
            normalizedStatus: uiStatus,
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
        isSubmit: true,
      })
    }
  }

  const handleReset = () => {
    setCode(DEFAULT_CODE)
  }

  // Autosave: when participating in an exam, sync code edits to server (debounced)
  const [autosaveStatus, setAutosaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')

  const {
    callback: debouncedSync,
    flush: flushSync,
    cancel: cancelSync,
  } = useDebouncedCallback(
    async (latestCode: string) => {
      const problemId = problemData?.problem?.id
      if (!participationIdToUse || !problemId) return
      const answers = {
        [problemId]: {
          sourceCode: latestCode,
          language: selectedLanguage,
          updatedAt: Date.now(),
        },
      }
      await examService.syncSession(participationIdToUse, answers)
    },
    2000,
    {
      onStart: () => setAutosaveStatus('saving'),
      onSuccess: () => {
        setAutosaveStatus('saved')
        window.setTimeout(() => setAutosaveStatus('idle'), 2000)
      },
      onError: () => {
        setAutosaveStatus('error')
        window.setTimeout(() => setAutosaveStatus('idle'), 3000)
      },
    }
  )

  const handleCodeChange = (next: string) => {
    setCode(next)
    try {
      debouncedSync(next)
    } catch (err) {
      // intentionally ignore autosave errors here
      // (network errors are surfaced via onError handler)
      void err
    }
  }

  useEffect(() => {
    return () => {
      try {
        flushSync()
      } catch (e) {
        // ignore flush errors during unmount
        void e
      }
      try {
        cancelSync()
      } catch (e) {
        // ignore cancel errors during unmount
        void e
      }
    }
  }, [flushSync, cancelSync])

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
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-green-500"></div>
          <p>Loading problem...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-100">
        <div className="text-center">
          <p className="mb-4 text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100">
      {/* Problem Header */}
      <ProblemHeader
        onPrev={goPrev}
        onNext={goNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
        onReset={handleReset}
        problemId={problemData?.problem.id}
        navigationLoading={navigationLoading}
      />

      <div
        ref={splitPaneRef}
        className="flex min-h-0 flex-1 flex-col lg:flex-row"
      >
        <div
          className="flex h-full min-h-0 min-w-[200px] flex-col overflow-hidden border-b border-gray-800 lg:border-b-0 lg:border-r"
          style={{
            flexBasis: `${problemPanelWidth}%`,
            maxWidth: `${problemPanelWidth}%`,
          }}
        >
          <ProblemSection
            activeTab={activeTab}
            onTabChange={setActiveTab}
            problemData={problemData || undefined}
          />
        </div>
        <div
          className="hidden w-0.5 cursor-col-resize select-none bg-gray-800 lg:block"
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
            onCodeChange={handleCodeChange}
            autosaveStatus={autosaveStatus}
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
    </div>
  )
}

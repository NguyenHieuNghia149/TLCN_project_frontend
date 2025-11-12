import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import ProblemSection from '../../components/problem/ProblemSection'
import CodeEditorSection from '../../components/editor/CodeEditorSection'
import { challengeService } from '../../services/api/challenge.service'
import { ProblemDetailResponse } from '../../types/challenge.types'
import ProblemHeader from '../../components/problem/ProblemHeader'
import { useProblemNavigation } from '../../hooks/common/useProblemNavigation'
import { submissionsService } from '@/services/api/submissions.service'
import type {
  SupportedLanguage,
  SandboxTestcaseResult,
} from '@/types/submission.types'
import type { TestCase, OutputState } from '@/types/editor.types'
import { io, Socket } from 'socket.io-client'

// Types moved to src/types/editor.types.ts

const DEFAULT_CODE = `
#include <iostream>
using namespace std;

int main() {
 
    return 0;
}
`

export default function ProblemDetailPage() {
  const { id } = useParams<{ id: string }>()
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

  const pollTimerRef = useRef<number | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const socketTimeoutRef = useRef<number | null>(null)
  const isCompletedRef = useRef<boolean>(false)

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

      <div className="flex min-h-0 flex-1">
        <ProblemSection
          activeTab={activeTab}
          onTabChange={setActiveTab}
          problemData={problemData || undefined}
        />

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
  )
}

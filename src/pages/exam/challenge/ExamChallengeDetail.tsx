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
import useAutosaveSession from '@/hooks/useAutosaveSession'
import { useTheme } from '@/contexts/useTheme'
import { normalizeSubmissionStatus } from '@/utils/submissionStatus'

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
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [autosaveEnabled, setAutosaveEnabled] = useState(false)
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
  const [yourScore, setYourScore] = useState<number | null>(null)
  // const [yourPoints, setYourPoints] = useState<number | null>(null)

  const [problemPanelWidth, setProblemPanelWidth] = useState(60)
  const dispatch = useDispatch()
  const reduxParticipationId = useSelector(
    (s: RootState) => s.exam?.currentParticipationId
  )
  const reduxStartAt = useSelector(
    (s: RootState) => s.exam?.currentParticipationStartAt
  )

  const refreshSubmissionData = useCallback(async () => {
    if (!examId || !reduxParticipationId) return
    try {
      const details = await examService.getSubmissionDetails(
        examId,
        reduxParticipationId
      )
      if (!details) return
      const totalScore = details.totalScore as number | undefined
      const perProblem = details.perProblem as
        | Array<{
            problemId: string
            obtained: number
            maxPoints: number
          }>
        | undefined
      if (perProblem) {
        setExam(prev => {
          if (!prev) return prev
          const updated = { ...prev }
          updated.challenges = updated.challenges.map(ch => {
            const per = perProblem.find(p => p.problemId === ch.id)
            return {
              ...ch,
              isSolved: per ? per.obtained === per.maxPoints : ch.isSolved,
            }
          })
          return updated
        })
      }
      setYourScore(totalScore ?? null)
      if (perProblem) {
        // const pts = perProblem.reduce((s, p) => s + (p.obtained || 0), 0)
        // setYourPoints(pts)
      }
    } catch {
      // ignore refresh errors; UI will simply not update scores
    }
  }, [examId, reduxParticipationId])
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
  const prevChallengeIdRef = useRef<string | null>(null)
  const codeRef = useRef<string>(code)
  const socketRef = useRef<Socket | null>(null)
  const socketTimeoutRef = useRef<number | null>(null)
  const isCompletedRef = useRef<boolean>(false)

  // Prepare autosave payload getter and hook
  const getPayload = useCallback(() => {
    return { sourceCode: codeRef.current, language: selectedLanguage }
    // codeRef is a ref so it's always current, but we need 'code' in dependencies
    // to trigger the useAutosaveSession effect when code changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage, code])

  const { flush: flushAutosave, cancel: cancelAutosave } = useAutosaveSession(
    reduxParticipationId,
    challengeId,
    getPayload,
    { delay: 5000, enabled: autosaveEnabled }
  )

  // Trigger autosave on code change (integrated in useAutosaveSession effect)
  useEffect(() => {
    if (!autosaveEnabled) return
  }, [code, autosaveEnabled, challengeId])

  // Flush pending autosave on unmount
  useEffect(() => {
    return () => {
      try {
        // flush pending autosave before unmount
        void flushAutosave()
      } catch {
        // ignore
      }
    }
  }, [flushAutosave])

  // Periodic full-session flush: ensure recent work is persisted
  useEffect(() => {
    if (!reduxParticipationId) return
    const intervalId = window.setInterval(() => {
      // best-effort flush of any pending debounced save
      void flushAutosave()
    }, 15000)

    return () => {
      window.clearInterval(intervalId)
      try {
        // cancel any pending debounced save
        cancelAutosave()
      } catch {
        // ignore
      }
      void flushAutosave()
    }
  }, [reduxParticipationId, flushAutosave, cancelAutosave])

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
      if (!challengeId || !examId) return
      // If we already have loaded the same challenge, skip to prevent redundant fetches
      if (problemData && problemData.problem?.id === challengeId) {
        return
      }

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
          if (response && response.data) {
            const rawData = response.data as Record<string, unknown>
            const formattedData = {
              problem: {
                id: rawData.id as string,
                title: rawData.title as string,
                description:
                  (rawData.description as string) ||
                  (rawData.content as string) ||
                  '',
                difficulty: rawData.difficulty as string as
                  | 'easy'
                  | 'medium'
                  | 'hard',
                topic: rawData.topic as string,
                totalPoints: rawData.totalPoints as number,
                constraint: rawData.constraint as string,
                tags: (rawData.tags as string[]) || [],
                orderIndex: rawData.orderIndex as number,
              },
              testcases:
                (rawData.testcases as Array<{
                  id: string
                  input: string
                  output: string
                  isPublic: boolean
                  point: number
                }>) || [],
              solution: rawData.solution as
                | {
                    id: string
                    title: string
                    description: string
                    videoUrl?: string
                    imageUrl?: string
                  }
                | undefined,
            }
            setProblemData(
              formattedData as unknown as ProblemDetailResponse['data']
            )

            // Always start with initial code first
            const initialCode = (rawData.initialCode as string) || DEFAULT_CODE
            setCode(initialCode)

            // Do NOT recover saved code here — saved code is restored via a separate effect that depends on reduxParticipationId.
            // Do NOT persist current challenge id to localStorage for privacy/security.
            // Keep current challenge in Redux only to avoid leaking session identifiers.
          } else {
            setError('Failed to load challenge')
            return
          }
        } catch {
          setError('Failed to load challenge')
          return
        }
      } finally {
        setLoading(false)
        try {
          setAutosaveEnabled(true)
        } catch {
          // ignore
        }
      }
    }

    fetchData()
  }, [examId, challengeId, problemData])

  // When participation becomes available, attempt to refresh per-problem data and recover saved code for the current challenge
  useEffect(() => {
    const runOnParticipantReady = async () => {
      if (!reduxParticipationId || !examId || !challengeId) return
      try {
        await refreshSubmissionData()
      } catch (err) {
        console.warn(
          'Failed to refresh submission details on participation change',
          err
        )
      }

      try {
        const partData = await examService.getParticipation(
          examId,
          reduxParticipationId
        )
        const answers = partData?.currentAnswers || partData?.answers || {}
        const saved = answers?.[challengeId || '']
        if (saved && saved.sourceCode) {
          setCode(saved.sourceCode)
        }
      } catch (err) {
        console.warn(
          `[Challenge Load] Failed to recover saved code for ${challengeId}:`,
          err
        )
      }
    }

    void runOnParticipantReady()
  }, [reduxParticipationId, examId, challengeId, refreshSubmissionData])

  // keep latest code in ref for use in unload/save handlers
  useEffect(() => {
    codeRef.current = code
  }, [code])

  // Save code to localStorage whenever it changes (for F5 persistence)
  useEffect(() => {
    if (!examId || !challengeId || !code) return
    try {
      const storageKey = `exam_${examId}_challenge_${challengeId}_code`
      localStorage.setItem(storageKey, code)
    } catch (err) {
      console.warn('Failed to save code to localStorage:', err)
    }
  }, [code, examId, challengeId])

  // Restore code from localStorage on mount (for F5 recovery)
  useEffect(() => {
    if (!examId || !challengeId) return
    try {
      const storageKey = `exam_${examId}_challenge_${challengeId}_code`
      const savedCode = localStorage.getItem(storageKey)
      if (savedCode && savedCode !== DEFAULT_CODE) {
        setCode(savedCode)
      }
    } catch (err) {
      console.warn('Failed to restore code from localStorage:', err)
    }
  }, [examId, challengeId])

  // Save previous challenge's code when switching challenges
  useEffect(() => {
    const savePrevious = async () => {
      const prev = prevChallengeIdRef.current
      if (!prev) return
      if (prev === challengeId) return // Same challenge, no need to save
      const participationId = reduxParticipationId
      if (!participationId) return
      try {
        // Flush any pending debounced autosave for the previous challenge
        await flushAutosave()
      } catch {
        // ignore autosave flush failures
      }

      try {
        await examService.syncSession(participationId, {
          [prev]: {
            sourceCode: codeRef.current,
            language: selectedLanguage,
            updatedAt: new Date().toISOString(),
          },
        })
      } catch {
        // ignore sync failures for previous challenge
      }
    }

    savePrevious()
    prevChallengeIdRef.current = challengeId ?? null
  }, [challengeId, reduxParticipationId, selectedLanguage, flushAutosave])

  // Persist current code when user closes or reloads the tab (best-effort)
  useEffect(() => {
    const onBeforeUnload = () => {
      const participationId = reduxParticipationId
      const current = prevChallengeIdRef.current || challengeId
      if (!participationId || !current) return
      try {
        const payload = JSON.stringify({
          sessionId: participationId,
          answers: {
            [current]: {
              sourceCode: codeRef.current,
              language: selectedLanguage,
              updatedAt: new Date().toISOString(),
            },
          },
          clientTimestamp: new Date().toISOString(),
        })
        if (typeof navigator !== 'undefined') {
          type BeaconNav = {
            sendBeacon?: (url: string, data?: BodyInit | null) => boolean
          }
          const nav = navigator as unknown as BeaconNav
          if (nav.sendBeacon) {
            const url = '/api/exams/session/sync'
            const blob = new Blob([payload], { type: 'application/json' })
            nav.sendBeacon(url, blob)
          } else {
            const xhr = new XMLHttpRequest()
            try {
              xhr.open('PUT', '/api/exams/session/sync', false)
              xhr.setRequestHeader('Content-Type', 'application/json')
              xhr.send(payload)
            } catch {
              // ignore
            }
          }
        } else {
          const xhr = new XMLHttpRequest()
          try {
            xhr.open('PUT', '/api/exams/session/sync', false)
            xhr.setRequestHeader('Content-Type', 'application/json')
            xhr.send(payload)
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [challengeId, reduxParticipationId, selectedLanguage])

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
    results?: unknown[],
    testCasesArray: TestCase[] = []
  ): SandboxTestcaseResult[] | undefined => {
    if (!Array.isArray(results)) return undefined
    type RawResult = Record<string, unknown>
    const arr = results as RawResult[]
    return arr.map((r: RawResult, idx: number) => {
      // Determine index: prefer explicit index, then testcaseId lookup, fallback to array index
      let index =
        typeof r['index'] === 'number' ? (r['index'] as number) : undefined
      if (
        index === undefined &&
        typeof r['testcaseId'] === 'string' &&
        Array.isArray(testCasesArray)
      ) {
        const found = testCasesArray.findIndex(
          tc => tc.id === (r['testcaseId'] as string)
        )
        if (found >= 0) index = found
      }
      if (index === undefined) index = idx

      const input = (r['input'] as string) ?? (r['stdin'] as string) ?? ''
      const expectedOutput =
        (r['expectedOutput'] as string) ??
        (r['expected'] as string) ??
        (r['output'] as string) ??
        ''
      const actualOutput =
        (r['actualOutput'] as string) ??
        (r['actual'] as string) ??
        (r['stdout'] as string) ??
        ''
      const ok =
        typeof r['ok'] === 'boolean'
          ? (r['ok'] as boolean)
          : typeof r['isPassed'] === 'boolean'
            ? (r['isPassed'] as boolean)
            : !!(r['passed'] as boolean)
      const stderr = (r['stderr'] as string) || (r['error'] as string) || ''
      const executionTime =
        (r['executionTime'] as number) ?? (r['time'] as number) ?? 0
      const isPublic = (r as { isPublic?: boolean }).isPublic ?? true

      return {
        index,
        input,
        expectedOutput,
        actualOutput,
        ok,
        stderr,
        executionTime,
        isPublic,
      }
    })
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

        const allResults =
          coerceResults(update.result?.results, testCases) || []
        // Note: Exam challenge test cases usually hidden, but if public field exists use it
        const publicResults = allResults.filter(
          r => r.isPublic !== false && testCases[r.index]?.isPublic !== false
        )
        // Prefer sandbox summary when available
        const passedCount = publicResults.filter(r => r.ok).length
        const totalCount = publicResults.length

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
                  typeof passedCount === 'number' &&
                  typeof totalCount === 'number'
                    ? ` • ${passedCount}/${totalCount}`
                    : ''
                }`
            : typeof passedCount === 'number' && typeof totalCount === 'number'
              ? `Running... ${passedCount}/${totalCount} passed`
              : 'Running...',
          passedTests: passedCount,
          totalTests: totalCount,
          results: publicResults.length ? publicResults : prev.results,
          isSubmit: false,
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
          const allResults =
            coerceResults(update.result?.results, testCases) || []
          const publicResults = allResults.filter(
            r => r.isPublic !== false && testCases[r.index]?.isPublic !== false
          )

          // Use ALL testcases count from backend for status consistency
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
            // Refresh user's current session scores to update ChallengePicker
            ;(async () => {
              try {
                await refreshSubmissionData()
              } catch (err) {
                console.warn(
                  'Failed to refresh submission details after socket update',
                  err
                )
              }
            })()
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
            const allResults =
              coerceResults(detail.result?.results, testCases) || []
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
            try {
              await refreshSubmissionData()
            } catch (err) {
              console.warn(
                'Failed to refresh submission details after polling',
                err
              )
            }
            return true
          } else {
            const allResults =
              coerceResults(detail.result?.results, testCases) || []
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
        // Flush any pending autosave before navigating
        try {
          await flushAutosave()
        } catch {
          // ignore autosave flush errors on submit
          void 0
        }

        // Clear participation from Redux since exam is completed
        dispatch({ type: 'exam/clearParticipation' })
      }
    } catch {
      alert('Failed to submit exam. Please try again.')
      return
    } finally {
      navigate(`/exam/${examId}/results`)
    }
  }, [navigate, examId, reduxParticipationId, dispatch, flushAutosave])

  // Initialize and manage countdown separately so hooks don't depend on `handleSubmitExam` definition order
  useEffect(() => {
    if (!exam?.id) return

    let cancelled = false

    const init = async () => {
      const participationId = reduxParticipationId
      const startAtRaw = reduxStartAt
      const totalSeconds = (exam.duration || 0) * 60

      // Check if user joined. If Redux lacks participation, try server-backed resume.
      if (!participationId) {
        try {
          if (examId) {
            const part = await examService.getMyParticipation(examId)
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
        } catch (err) {
          // server recovery failed -> not joined
          console.error(`[SessionInit] ✗ Server recovery failed:`, err)
          setIsJoined(false)
          return
        }
      } else {
        // participation already present in Redux; continue with existing session
        void 0
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
            const partData = await examService.getParticipation(
              examId,
              participationId
            )
            const serverStart =
              partData?.startedAt ||
              partData?.startAt ||
              partData?.startTimestamp ||
              partData?.startedAtMs
            if (serverStart) {
              // Persist recovered start into Redux only (in-memory, NOT localStorage)
              try {
                // ensure we pass null when undefined to match slice typing
                dispatch(
                  setParticipation({
                    participationId: participationId ?? null,
                    startAt:
                      typeof serverStart === 'number'
                        ? serverStart
                        : Date.parse(String(serverStart)),
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
              } else if (typeof serverStart === 'string') {
                const parsed = Date.parse(serverStart)
                if (!Number.isNaN(parsed)) startAtMs = parsed
              }
            }
            // recover current challenge id if server provides
            const serverCurrentChallenge =
              partData?.currentChallengeId || partData?.currentChallenge
            if (serverCurrentChallenge) {
              // Do NOT persist recovered currentChallengeId to localStorage for privacy/security.
              try {
                dispatch(
                  setParticipation({
                    participationId: participationId ?? null,
                    startAt: serverStart ?? null,
                    currentChallengeId: serverCurrentChallenge,
                  })
                )
              } catch (e) {
                console.warn(
                  'Failed to dispatch recovered currentChallenge to redux',
                  e
                )
              }
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
    exam?.id,
    exam?.duration,
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
              {/* {lastSavedAt && (
                <div className="text-xs" style={{ color: 'var(--muted-text)', marginLeft: 8 }}>
                  Last saved: {formatTimeShort(lastSavedAt)}
                </div>
              )} */}
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
            // totalPoints={exam.challenges.reduce(
            //   (sum, ch) => sum + (ch.totalPoints || 0),
            //   0
            // )}
            yourScore={yourScore}
            // yourPoints={yourPoints}
            onSubmitExam={handleSubmitExam}
          />
        )}
    </div>
  )
}

export default ExamChallengeDetail

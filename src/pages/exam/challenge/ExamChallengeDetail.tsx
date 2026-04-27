import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store/stores'
import { setParticipation } from '@/store/slices/examSlice'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, List, Send, Sun, Moon } from 'lucide-react'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Button from '@/components/common/Button/Button'
import { Exam } from '@/types/exam.types'
import ExamProblemSection from '@/components/problem/ExamProblemSection'
import CodeEditorSection from '@/components/editor/CodeEditorSection'
import ChallengePicker from '@/components/exam/ChallengePicker'
import { ProblemDetailResponse } from '@/types/challenge.types'
import { useLanguageDrafts } from '@/hooks/useLanguageDrafts'
import { useLanguages } from '@/hooks/api/useLanguages'
import { useSubmissionExecution } from '@/hooks/useSubmissionExecution'
import type { SupportedLanguage } from '@/types/submission.types'
import type { TestCase } from '@/types/editor.types'
import './ExamChallengeDetail.scss'
import {
  buildSubmissionLanguageOptions,
  DEFAULT_SUBMISSION_LANGUAGE,
} from '@/constants/submissionLanguages'
// mocks removed: use real API only
import { examService } from '@/services/api/exam.service'
import useAutosaveSession from '@/hooks/useAutosaveSession'
import { useTheme } from '@/contexts/useTheme'
import { canResumeExamWorkspace } from './exam-workspace-access'
import { computeExamRemainingSeconds } from './exam-countdown'

type MobileWorkspacePanel = 'problem' | 'editor' | 'output' | 'challenges'

const ExamChallengeDetail: React.FC = () => {
  const {
    examId: routeExamId,
    examSlug,
    challengeId,
  } = useParams<{
    examId?: string
    examSlug?: string
    challengeId: string
  }>()
  const navigate = useNavigate()
  const [resolvedExamId, setResolvedExamId] = useState<string | null>(
    routeExamId || null
  )
  const [exam, setExam] = useState<Exam | null>(null)
  const [problemData, setProblemData] = useState<
    ProblemDetailResponse['data'] | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joinBlockedReason, setJoinBlockedReason] = useState<string | null>(
    null
  )
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [showTimeWarning, setShowTimeWarning] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [autosaveEnabled, setAutosaveEnabled] = useState(false)
  const [activeTab, setActiveTab] = useState<'question' | 'submissions'>(
    'question'
  )
  const [selectedTestCase, setSelectedTestCase] = useState<string>('1')
  const [showChallengeList, setShowChallengeList] = useState(false)
  const [yourScore, setYourScore] = useState<number | null>(null)
  // const [yourPoints, setYourPoints] = useState<number | null>(null)
  const [isMobileWorkspace, setIsMobileWorkspace] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 1023px)').matches
      : false
  )
  const [mobileWorkspacePanel, setMobileWorkspacePanel] =
    useState<MobileWorkspacePanel>('problem')

  const [problemPanelWidth, setProblemPanelWidth] = useState(60)
  const examWorkspaceBasePath = examSlug
    ? `/exam/${examSlug}`
    : resolvedExamId
      ? `/exam/${resolvedExamId}`
      : '/exam'
  const { data: languages } = useLanguages()
  const languageOptions = React.useMemo(
    () => buildSubmissionLanguageOptions(languages),
    [languages]
  )
  const activeLanguages = React.useMemo(
    () => languageOptions.map(option => option.value),
    [languageOptions]
  )
  const dispatch = useDispatch()
  const reduxParticipationId = useSelector(
    (s: RootState) => s.exam?.currentParticipationId
  )
  const reduxStartAt = useSelector(
    (s: RootState) => s.exam?.currentParticipationStartAt
  )
  const reduxExpiresAt = useSelector(
    (s: RootState) => s.exam?.currentParticipationExpiresAt
  )
  const mobileWorkspacePanelStorageKey =
    resolvedExamId && reduxParticipationId
      ? `exam_workspace_mobile_panel_${resolvedExamId}_${reduxParticipationId}`
      : null

  const refreshSubmissionData = useCallback(async () => {
    if (!resolvedExamId || !reduxParticipationId) return
    try {
      const details = await examService.getSubmissionDetails(
        resolvedExamId,
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
  }, [resolvedExamId, reduxParticipationId])

  const resolveSupportedLanguage = (
    value?: string | null
  ): SupportedLanguage => {
    if (value && activeLanguages.includes(value)) {
      return value
    }
    return activeLanguages[0] ?? DEFAULT_SUBMISSION_LANGUAGE
  }

  const editorStorageKey =
    resolvedExamId && challengeId
      ? `exam_${resolvedExamId}_challenge_${challengeId}_editor_state`
      : undefined
  const legacyCodeStorageKey =
    resolvedExamId && challengeId
      ? `exam_${resolvedExamId}_challenge_${challengeId}_code`
      : undefined

  const {
    code,
    selectedLanguage,
    setSelectedLanguage,
    onCodeChange,
    onResetCurrentLanguage,
    restoreDraft,
  } = useLanguageDrafts({
    storageKey: editorStorageKey,
    legacyCodeStorageKey,
    languages: activeLanguages,
    starterCodeByLanguage: problemData?.problem.starterCodeByLanguage,
  })

  const testCases: TestCase[] =
    problemData?.testcases.map((testCase, index) => ({
      id: testCase.id,
      name: `Case ${index + 1}`,
      input: testCase.displayInput,
      expectedOutput: testCase.displayOutput,
      isPublic: testCase.isPublic,
    })) || []

  const { output, run, submit, resetOutput } = useSubmissionExecution({
    testCases,
    onSubmitCompleted: async () => {
      await refreshSubmissionData()
    },
  })
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

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)')
    const onViewportChange = (event: MediaQueryListEvent) => {
      setIsMobileWorkspace(event.matches)
      if (!event.matches && showChallengeList) {
        setShowChallengeList(false)
      }
    }

    setIsMobileWorkspace(mediaQuery.matches)
    mediaQuery.addEventListener('change', onViewportChange)
    return () => mediaQuery.removeEventListener('change', onViewportChange)
  }, [showChallengeList])

  useEffect(() => {
    if (!isMobileWorkspace || !mobileWorkspacePanelStorageKey) {
      return
    }

    const storedPanel = window.localStorage.getItem(
      mobileWorkspacePanelStorageKey
    ) as MobileWorkspacePanel | null
    if (
      storedPanel === 'problem' ||
      storedPanel === 'editor' ||
      storedPanel === 'output'
    ) {
      setMobileWorkspacePanel(storedPanel)
      return
    }

    setMobileWorkspacePanel('problem')
  }, [isMobileWorkspace, mobileWorkspacePanelStorageKey])

  useEffect(() => {
    if (!isMobileWorkspace || !mobileWorkspacePanelStorageKey) {
      return
    }
    if (mobileWorkspacePanel === 'challenges') {
      return
    }
    window.localStorage.setItem(
      mobileWorkspacePanelStorageKey,
      mobileWorkspacePanel
    )
  }, [isMobileWorkspace, mobileWorkspacePanel, mobileWorkspacePanelStorageKey])

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

  const countdownRef = useRef<number | null>(null)
  const prevChallengeIdRef = useRef<string | null>(null)
  const codeRef = useRef<string>(code)

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
    if (routeExamId) {
      setResolvedExamId(routeExamId)
      return
    }

    if (!examSlug) {
      setResolvedExamId(null)
      return
    }

    let cancelled = false

    const resolveExamIdFromSlug = async () => {
      try {
        const publicExam = await examService.getPublicExam(examSlug)
        if (!cancelled) {
          setResolvedExamId(publicExam.id)
        }
      } catch (err) {
        console.error('Failed to resolve exam from slug', err)
        if (!cancelled) {
          setResolvedExamId(null)
          setError('Failed to resolve exam')
        }
      }
    }

    void resolveExamIdFromSlug()
    return () => {
      cancelled = true
    }
  }, [examSlug, routeExamId])

  useEffect(() => {
    const fetchData = async () => {
      if (!challengeId || !resolvedExamId) return
      // If we already have loaded the same challenge, skip to prevent redundant fetches
      if (problemData && problemData.problem?.id === challengeId) {
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch exam basic info (to populate challenge list)
        try {
          const apiExam = await examService.getExamById(resolvedExamId)
          setExam(apiExam)
        } catch (apiErr) {
          console.error('Failed to fetch exam from API', apiErr)
          setError('Failed to load exam')
          return
        }

        // Fetch challenge details from exam endpoint (lazy load per challenge)
        try {
          const response = await examService.getExamChallenge(
            resolvedExamId,
            challengeId
          )
          if (response && response.success) {
            const challengeData = response.data
            setProblemData({
              problem: {
                id: challengeData.id,
                title: challengeData.title,
                description:
                  challengeData.description || challengeData.content || '',
                difficulty: challengeData.difficulty,
                topic: challengeData.topic,
                totalPoints: challengeData.totalPoints,
                constraint: challengeData.constraint,
                tags: challengeData.tags || [],
                orderIndex: challengeData.orderIndex,
                functionSignature: challengeData.functionSignature,
                starterCodeByLanguage: challengeData.starterCodeByLanguage,
              },
              testcases: challengeData.testcases,
              solution: challengeData.solution ?? {
                id: 'no-solution',
                title: 'No Solution',
                description: '',
                videoUrl: '',
                imageUrl: '',
                isVisible: false,
                solutionApproaches: [],
                createdAt: '',
                updatedAt: '',
              },
            })
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
  }, [challengeId, problemData, resolvedExamId])

  // When participation becomes available, attempt to refresh per-problem data and recover saved code for the current challenge
  useEffect(() => {
    const runOnParticipantReady = async () => {
      if (!reduxParticipationId || !resolvedExamId || !challengeId) return
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
          resolvedExamId,
          reduxParticipationId
        )
        const answers = partData?.currentAnswers || partData?.answers || {}
        const saved = answers?.[challengeId || '']
        if (saved && saved.sourceCode) {
          restoreDraft(
            resolveSupportedLanguage(saved.language),
            saved.sourceCode
          )
        }
      } catch (err) {
        console.warn(
          `[Challenge Load] Failed to recover saved code for ${challengeId}:`,
          err
        )
      }
    }

    void runOnParticipantReady()
  }, [reduxParticipationId, resolvedExamId, challengeId, refreshSubmissionData])

  // keep latest code in ref for use in unload/save handlers
  useEffect(() => {
    codeRef.current = code
  }, [code])

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
          participationId,
          answers: {
            [current]: {
              sourceCode: codeRef.current,
              language: selectedLanguage,
              updatedAt: new Date().toISOString(),
            },
          },
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

  useEffect(() => {
    setSelectedTestCase('1')
    resetOutput()
  }, [challengeId, resetOutput])

  const handleRun = async () => {
    if (!problemData?.problem.id) return
    await run({
      sourceCode: code,
      language: selectedLanguage,
      problemId: problemData.problem.id,
      participationId: reduxParticipationId || undefined,
    })
  }

  const handleSubmit = async () => {
    if (!problemData?.problem.id) return
    await submit({
      sourceCode: code,
      language: selectedLanguage,
      problemId: problemData.problem.id,
      participationId: reduxParticipationId || undefined,
    })
  }

  const handleReset = () => {
    onResetCurrentLanguage()
    resetOutput()
  }

  const handleSubmitExam = useCallback(
    async (options?: { force?: boolean }) => {
      if (
        !options?.force &&
        !window.confirm(
          'Are you sure you want to submit the exam? This action cannot be undone.'
        )
      ) {
        return
      }

      let submitted = false
      try {
        const participationId = reduxParticipationId
        if (resolvedExamId && participationId) {
          await examService.submitExam(resolvedExamId, participationId)
          // Flush any pending autosave before navigating
          try {
            await flushAutosave()
          } catch {
            // ignore autosave flush errors on submit
            void 0
          }

          // Clear participation from Redux since exam is completed
          dispatch({ type: 'exam/clearParticipation' })
          submitted = true
        }
      } catch {
        if (!options?.force) {
          alert('Failed to submit exam. Please try again.')
        }
        return
      } finally {
        if (submitted) {
          navigate(
            examSlug
              ? `/exam/${examSlug}/results`
              : `/exam/${resolvedExamId}/results`
          )
        }
      }
    },
    [
      dispatch,
      examSlug,
      flushAutosave,
      navigate,
      resolvedExamId,
      reduxParticipationId,
    ]
  )

  // Initialize and manage countdown separately so hooks don't depend on `handleSubmitExam` definition order
  useEffect(() => {
    if (!exam?.id) return

    let cancelled = false

    const init = async () => {
      let activeParticipationId = reduxParticipationId ?? null
      const startAtRaw = reduxStartAt
      const expiresAtRaw = reduxExpiresAt
      const resultPath = examSlug
        ? `/exam/${examSlug}/results`
        : `/exam/${resolvedExamId}/results`

      const checkResumePermission = (input: {
        status?: string | null
        expiresAt?: string | number | null
      }) =>
        canResumeExamWorkspace({
          participationStatus: input.status,
          examEndDate: exam.endDate,
          participationExpiresAt: input.expiresAt,
        })

      // Check if user joined. If Redux lacks participation, try server-backed resume.
      if (!activeParticipationId) {
        try {
          if (resolvedExamId) {
            const part = await examService.getMyParticipation(resolvedExamId)
            const partId = part?.id || part?.participationId
            const canResume = checkResumePermission({
              status: part?.status,
              expiresAt: part?.expiresAt || part?.expires_at,
            })

            if (partId && !canResume) {
              dispatch({ type: 'exam/clearParticipation' })
              navigate(resultPath, { replace: true })
              return
            }
            const serverStart =
              part?.startedAt ||
              part?.startAt ||
              part?.startTimestamp ||
              part?.startedAtMs
            const serverExpires =
              part?.expiresAt || part?.expires_at || part?.expires
            if (partId) {
              activeParticipationId = partId
              const startAtValue = serverStart ?? Date.now()
              try {
                dispatch(
                  setParticipation({
                    participationId: partId,
                    examId: resolvedExamId,
                    startAt: startAtValue,
                    expiresAt: serverExpires ?? null,
                  })
                )
                setJoinBlockedReason(null)
              } catch (e) {
                console.warn(
                  'Failed to dispatch recovered participation to redux',
                  e
                )
              }
              // proceed as joined
            } else {
              setJoinBlockedReason(
                'You must start the exam from the entry page.'
              )
              setIsJoined(false)
              return
            }
          } else {
            setJoinBlockedReason('Exam identifier is missing.')
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
        try {
          if (resolvedExamId) {
            const existing = await examService.getParticipation(
              resolvedExamId,
              activeParticipationId
            )
            const canResume = checkResumePermission({
              status: existing?.status,
              expiresAt: existing?.expiresAt || existing?.expires_at,
            })
            if (!canResume) {
              dispatch({ type: 'exam/clearParticipation' })
              navigate(resultPath, { replace: true })
              return
            }

            const existingExpires =
              existing?.expiresAt || existing?.expires_at || existing?.expires
            if (existingExpires) {
              dispatch(
                setParticipation({
                  participationId: activeParticipationId,
                  expiresAt: existingExpires,
                })
              )
            }
          }
        } catch (verificationError) {
          console.warn(
            'Failed to verify current participation status',
            verificationError
          )
          setJoinBlockedReason('Unable to verify current exam session state.')
          setIsJoined(false)
          return
        }
      }

      setIsJoined(true)
      setJoinBlockedReason(null)

      let effectiveStartAt: number | string | null = startAtRaw ?? null
      let effectiveExpiresAt: number | string | null = expiresAtRaw ?? null

      // Recover missing timing metadata from server so resume keeps the canonical countdown.
      if (
        (!effectiveStartAt || !effectiveExpiresAt) &&
        resolvedExamId &&
        activeParticipationId
      ) {
        try {
          const partData = await examService.getParticipation(
            resolvedExamId,
            activeParticipationId
          )
          const serverStart =
            partData?.startedAt ||
            partData?.startAt ||
            partData?.startTimestamp ||
            partData?.startedAtMs
          const serverExpires =
            partData?.expiresAt || partData?.expires_at || partData?.expires
          const serverCurrentChallenge =
            partData?.currentChallengeId || partData?.currentChallenge

          if (serverStart) {
            effectiveStartAt = serverStart
          }
          if (serverExpires) {
            effectiveExpiresAt = serverExpires
          }

          if (serverStart || serverExpires || serverCurrentChallenge) {
            const participationUpdate: {
              participationId: string
              startAt?: number | string | null
              expiresAt?: number | string | null
              currentChallengeId?: string | null
            } = {
              participationId: activeParticipationId,
            }

            if (serverStart) {
              participationUpdate.startAt = serverStart
            }
            if (serverExpires) {
              participationUpdate.expiresAt = serverExpires
            }
            if (serverCurrentChallenge) {
              participationUpdate.currentChallengeId = serverCurrentChallenge
            }

            dispatch(setParticipation(participationUpdate))
          }
        } catch (e) {
          console.warn('Failed to recover participation from server', e)
        }
      }

      let remaining = computeExamRemainingSeconds({
        startAt: effectiveStartAt,
        expiresAt: effectiveExpiresAt,
        durationMinutes: exam.duration || 0,
      })
      if (cancelled) return
      setTimeRemaining(remaining)

      // Check for 5 minute warning
      if (remaining === 5 * 60) {
        setShowTimeWarning(true)
        setTimeout(() => setShowTimeWarning(false), 5000)
      }

      // If time already up -> auto submit
      if (remaining <= 0) {
        void handleSubmitExam({ force: true })
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
          void handleSubmitExam({ force: true })
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
    exam?.endDate,
    examSlug,
    resolvedExamId,
    handleSubmitExam,
    dispatch,
    navigate,
    reduxParticipationId,
    reduxStartAt,
    reduxExpiresAt,
  ])

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
            {joinBlockedReason ||
              'You must join the exam first before accessing challenges.'}
          </p>
          <Button
            onClick={() => navigate(examWorkspaceBasePath)}
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
            onClick={() => navigate(examWorkspaceBasePath)}
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
              onClick={() => {
                if (isMobileWorkspace) {
                  setMobileWorkspacePanel('challenges')
                }
                setShowChallengeList(true)
              }}
              variant="secondary"
              size="sm"
              icon={<List size={16} />}
              aria-label="View all challenges"
            >
              View All Challenges
            </Button>
            <Button
              onClick={() => {
                void handleSubmitExam()
              }}
              variant="primary"
              size="sm"
              icon={<Send size={16} />}
              aria-label="Submit exam"
            >
              Submit Exam
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {isMobileWorkspace ? (
        <div
          className="flex min-h-0 flex-1 flex-col"
          style={{ borderTop: '1px solid var(--surface-border)' }}
        >
          <div
            className="sticky top-[73px] z-20 flex gap-2 overflow-x-auto border-b px-3 py-2"
            style={{
              backgroundColor: 'var(--exam-panel-bg)',
              borderColor: 'var(--surface-border)',
            }}
          >
            {(
              [
                { key: 'problem', label: 'Problem' },
                { key: 'editor', label: 'Editor' },
                { key: 'output', label: 'Output' },
                { key: 'challenges', label: 'Challenges' },
              ] as Array<{ key: MobileWorkspacePanel; label: string }>
            ).map(tab => (
              <button
                key={tab.key}
                type="button"
                className="rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
                style={{
                  borderColor:
                    mobileWorkspacePanel === tab.key
                      ? 'var(--accent)'
                      : 'var(--surface-border)',
                  backgroundColor:
                    mobileWorkspacePanel === tab.key
                      ? 'rgba(32, 215, 97, 0.14)'
                      : 'transparent',
                  color:
                    mobileWorkspacePanel === tab.key
                      ? 'var(--accent)'
                      : 'var(--muted-text)',
                }}
                onClick={() => {
                  setMobileWorkspacePanel(tab.key)
                  if (tab.key === 'challenges') {
                    setShowChallengeList(true)
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {mobileWorkspacePanel === 'problem' ? (
              <ExamProblemSection
                activeTab={activeTab}
                onTabChange={setActiveTab}
                problemData={problemData}
              />
            ) : null}

            {mobileWorkspacePanel === 'editor' ||
            mobileWorkspacePanel === 'output' ? (
              <div className="flex h-full min-h-0 flex-col">
                {mobileWorkspacePanel === 'output' ? (
                  <div
                    className="border-b px-3 py-2 text-xs"
                    style={{
                      borderColor: 'var(--surface-border)',
                      color: 'var(--muted-text)',
                    }}
                  >
                    Output is shown in the console area below the editor.
                  </div>
                ) : null}
                <div className="min-h-0 flex-1">
                  <CodeEditorSection
                    code={code}
                    onCodeChange={onCodeChange}
                    selectedLanguage={selectedLanguage}
                    onLanguageChange={setSelectedLanguage}
                    languageOptions={languageOptions}
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
            ) : null}

            {mobileWorkspacePanel === 'challenges' ? (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-300">
                Challenge list is opened as a bottom sheet.
              </div>
            ) : null}
          </div>
        </div>
      ) : (
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
              onCodeChange={onCodeChange}
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
              languageOptions={languageOptions}
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
      )}

      {showChallengeList &&
        exam &&
        exam.challenges &&
        exam.challenges.length > 0 && (
          <ChallengePicker
            mobile={isMobileWorkspace}
            challenges={exam.challenges}
            currentIndex={
              exam.challenges.findIndex(c => c.id === challengeId) >= 0
                ? exam.challenges.findIndex(c => c.id === challengeId)
                : 0
            }
            onClose={() => {
              setShowChallengeList(false)
              if (isMobileWorkspace) {
                setMobileWorkspacePanel('problem')
              }
            }}
            onSelectChallenge={index => {
              const selectedChallenge = exam.challenges[index]
              if (selectedChallenge) {
                navigate(
                  `${examWorkspaceBasePath}${examSlug ? '/challenges' : '/challenge'}/${selectedChallenge.id}`
                )
                setShowChallengeList(false)
                if (isMobileWorkspace) {
                  setMobileWorkspacePanel('problem')
                }
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

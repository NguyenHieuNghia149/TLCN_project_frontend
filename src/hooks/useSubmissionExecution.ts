import { useCallback, useEffect, useRef, useState } from 'react'

import { submissionsService } from '@/services/api/submissions.service'
import type { OutputState, TestCase } from '@/types/editor.types'
import type {
  RunOrSubmitPayload,
  SubmissionDetail,
  SubmissionStreamPayload,
  SupportedLanguage,
} from '@/types/submission.types'
import {
  createOutputStateFromSnapshot,
  isTerminalExecutionStatus,
  toExecutionSnapshot,
} from '@/utils/submissionExecution'

type ExecuteOptions = {
  sourceCode: string
  language: SupportedLanguage
  problemId: string
  participationId?: string
}

type SubmissionCompletionHandler = (
  detail: SubmissionDetail | SubmissionStreamPayload
) => void | Promise<void>

const INITIAL_OUTPUT: OutputState = {
  status: 'idle',
  message: 'Ready to run tests',
}

/**
 * Manages submission/run execution state, using SSE as the primary realtime transport.
 */
export function useSubmissionExecution(options: {
  testCases: TestCase[]
  onSubmitCompleted?: SubmissionCompletionHandler
}) {
  const { testCases, onSubmitCompleted } = options
  const [output, setOutput] = useState<OutputState>(INITIAL_OUTPUT)
  const pollTimerRef = useRef<number | null>(null)
  const streamRef = useRef<EventSource | null>(null)
  const streamFallbackTimerRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  const latestTestCasesRef = useRef(testCases)
  const latestResultsRef = useRef<OutputState['results']>(undefined)

  useEffect(() => {
    latestTestCasesRef.current = testCases
  }, [testCases])

  useEffect(() => {
    latestResultsRef.current = output.results
  }, [output.results])

  const clearPoll = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const clearStreamFallback = useCallback(() => {
    if (streamFallbackTimerRef.current) {
      window.clearTimeout(streamFallbackTimerRef.current)
      streamFallbackTimerRef.current = null
    }
  }, [])

  const closeStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.close()
      streamRef.current = null
    }
  }, [])

  const cleanupRealtime = useCallback(() => {
    clearPoll()
    clearStreamFallback()
    closeStream()
  }, [clearPoll, clearStreamFallback, closeStream])

  useEffect(() => cleanupRealtime, [cleanupRealtime])

  const applySnapshot = useCallback(
    (
      snapshot: SubmissionDetail | SubmissionStreamPayload,
      isSubmit: boolean
    ) => {
      const nextOutput = createOutputStateFromSnapshot({
        snapshot: toExecutionSnapshot(snapshot),
        testCases: latestTestCasesRef.current,
        isSubmit,
        previousResults: latestResultsRef.current,
      })
      setOutput(nextOutput)
      return nextOutput
    },
    []
  )

  const handleTerminalCompletion = useCallback(
    async (
      snapshot: SubmissionDetail | SubmissionStreamPayload,
      isSubmit: boolean
    ) => {
      completedRef.current = true
      cleanupRealtime()
      if (isSubmit && onSubmitCompleted) {
        await onSubmitCompleted(snapshot)
      }
    },
    [cleanupRealtime, onSubmitCompleted]
  )

  const hydrateSubmission = useCallback(
    async (submissionId: string, isSubmit: boolean) => {
      try {
        const detail = await submissionsService.getSubmission(submissionId)
        applySnapshot(detail, isSubmit)

        if (isTerminalExecutionStatus(detail.status)) {
          await handleTerminalCompletion(detail, isSubmit)
          return true
        }
      } catch {
        // hydration is best-effort; the SSE/poll fallback path handles final reporting
      }

      return false
    },
    [applySnapshot, handleTerminalCompletion]
  )

  const startPolling = useCallback(
    async (submissionId: string, isSubmit: boolean) => {
      const checkOnce = async () => {
        try {
          const detail = await submissionsService.getSubmission(submissionId)
          applySnapshot(detail, isSubmit)

          if (isTerminalExecutionStatus(detail.status)) {
            await handleTerminalCompletion(detail, isSubmit)
            return true
          }

          return false
        } catch (error) {
          setOutput({
            status: 'rejected',
            message:
              (error as { message?: string }).message ||
              'Failed to get submission status',
            error: (error as { message?: string }).message,
            isSubmit,
          })
          cleanupRealtime()
          completedRef.current = true
          return true
        }
      }

      clearPoll()
      const completed = await checkOnce()
      if (!completed && !completedRef.current) {
        pollTimerRef.current = window.setInterval(async () => {
          const done = await checkOnce()
          if (done) {
            clearPoll()
          }
        }, 2000)
      }
    },
    [applySnapshot, cleanupRealtime, clearPoll, handleTerminalCompletion]
  )

  const startStream = useCallback(
    (submissionId: string, isSubmit: boolean, fallbackDelayMs: number) => {
      closeStream()
      clearStreamFallback()

      let receivedMessage = false
      const eventSource =
        submissionsService.createSubmissionEventSource(submissionId)
      streamRef.current = eventSource

      const fallbackToPolling = () => {
        if (completedRef.current) {
          return
        }
        closeStream()
        void startPolling(submissionId, isSubmit)
      }

      streamFallbackTimerRef.current = window.setTimeout(() => {
        if (!receivedMessage) {
          fallbackToPolling()
        }
      }, fallbackDelayMs)

      eventSource.onmessage = async event => {
        receivedMessage = true
        clearStreamFallback()

        try {
          const payload = JSON.parse(event.data) as SubmissionStreamPayload
          applySnapshot(payload, isSubmit)

          if (isTerminalExecutionStatus(payload.status)) {
            await handleTerminalCompletion(payload, isSubmit)
          }
        } catch (error) {
          console.warn('Failed to parse submission SSE event:', error)
        }
      }

      eventSource.onerror = () => {
        fallbackToPolling()
      }
    },
    [
      applySnapshot,
      clearStreamFallback,
      closeStream,
      handleTerminalCompletion,
      startPolling,
    ]
  )

  const execute = useCallback(
    async (
      kind: 'run' | 'submit',
      payload: ExecuteOptions,
      fallbackDelayMs: number
    ) => {
      completedRef.current = false
      cleanupRealtime()
      setOutput({
        status: 'running',
        message: kind === 'submit' ? 'Submitting...' : 'Running tests...',
        isSubmit: kind === 'submit',
      })

      const requestPayload: RunOrSubmitPayload = {
        sourceCode: payload.sourceCode,
        language: payload.language,
        problemId: payload.problemId,
      }

      if (payload.participationId) {
        requestPayload.participationId = payload.participationId
      }

      try {
        const created =
          kind === 'submit'
            ? await submissionsService.submitCode(requestPayload)
            : await submissionsService.runCode(requestPayload)

        const submissionId = created.submissionId
        const completedDuringHydration = await hydrateSubmission(
          submissionId,
          kind === 'submit'
        )

        if (!completedDuringHydration) {
          startStream(submissionId, kind === 'submit', fallbackDelayMs)
        }
      } catch (error) {
        setOutput({
          status: 'rejected',
          message:
            (error as { message?: string }).message ||
            `${kind === 'submit' ? 'Submit' : 'Run'} failed. Please try again.`,
          error: (error as { message?: string }).message,
          isSubmit: kind === 'submit',
        })
      }
    },
    [cleanupRealtime, hydrateSubmission, startStream]
  )

  const run = useCallback(
    async (payload: ExecuteOptions) => {
      await execute('run', payload, 5000)
    },
    [execute]
  )

  const submit = useCallback(
    async (payload: ExecuteOptions) => {
      await execute('submit', payload, 5000)
    },
    [execute]
  )

  const resetOutput = useCallback(() => {
    completedRef.current = false
    cleanupRealtime()
    setOutput(INITIAL_OUTPUT)
  }, [cleanupRealtime])

  return {
    output,
    run,
    submit,
    resetOutput,
    setOutput,
  }
}

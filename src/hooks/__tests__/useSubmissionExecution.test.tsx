// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  SubmissionDetail,
  SubmissionStreamConnection,
} from '@/types/submission.types'

const submissionsServiceMock = vi.hoisted(() => ({
  runCode: vi.fn(),
  submitCode: vi.fn(),
  getSubmission: vi.fn(),
  createSubmissionEventSource: vi.fn(),
}))

vi.mock('@/services/api/submissions.service', () => ({
  submissionsService: submissionsServiceMock,
}))

import { useSubmissionExecution } from '@/hooks/useSubmissionExecution'

function createMockStream(): SubmissionStreamConnection {
  return {
    onmessage: null,
    onerror: null,
    close: vi.fn(),
  }
}

function createSubmissionDetail(status: string): SubmissionDetail {
  return {
    submissionId: 'submission-1',
    userId: 'user-1',
    problemId: 'problem-1',
    language: 'python',
    status,
    submittedAt: '2026-06-21T10:00:00.000Z',
  }
}

describe('useSubmissionExecution', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    submissionsServiceMock.runCode.mockReset()
    submissionsServiceMock.submitCode.mockReset()
    submissionsServiceMock.getSubmission.mockReset()
    submissionsServiceMock.createSubmissionEventSource.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('does not poll persisted submission status for run-code when the stream is silent', async () => {
    const stream = createMockStream()
    submissionsServiceMock.runCode.mockResolvedValue({
      submissionId: 'run-only-1',
      status: 'PENDING',
      message: 'Queued for execution',
    })
    submissionsServiceMock.createSubmissionEventSource.mockReturnValue(stream)

    const { result } = renderHook(() =>
      useSubmissionExecution({
        testCases: [],
      })
    )

    await act(async () => {
      await result.current.run({
        sourceCode: 'print(1)',
        language: 'python',
        problemId: 'problem-1',
      })
    })

    expect(
      submissionsServiceMock.createSubmissionEventSource
    ).toHaveBeenCalledWith('run-only-1')
    expect(
      submissionsServiceMock.createSubmissionEventSource.mock.calls[0]
    ).toHaveLength(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(submissionsServiceMock.getSubmission).not.toHaveBeenCalled()
    expect(result.current.output.status).toBe('running')
    expect(result.current.output.isSubmit).toBe(false)
  })

  it('retries the run-code stream on SSE errors without polling persisted status', async () => {
    const firstStream = createMockStream()
    const secondStream = createMockStream()

    submissionsServiceMock.runCode.mockResolvedValue({
      submissionId: 'run-only-1',
      status: 'PENDING',
      message: 'Queued for execution',
    })
    submissionsServiceMock.createSubmissionEventSource
      .mockReturnValueOnce(firstStream)
      .mockReturnValueOnce(secondStream)

    const { result } = renderHook(() =>
      useSubmissionExecution({
        testCases: [],
      })
    )

    await act(async () => {
      await result.current.run({
        sourceCode: 'print(1)',
        language: 'python',
        problemId: 'problem-1',
      })
    })

    act(() => {
      firstStream.onerror?.(new Event('error'))
    })

    expect(submissionsServiceMock.getSubmission).not.toHaveBeenCalled()
    expect(
      submissionsServiceMock.createSubmissionEventSource
    ).toHaveBeenNthCalledWith(1, 'run-only-1')
    expect(
      submissionsServiceMock.createSubmissionEventSource.mock.calls[0]
    ).toHaveLength(1)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000)
    })

    expect(
      submissionsServiceMock.createSubmissionEventSource
    ).toHaveBeenCalledTimes(2)
    expect(
      submissionsServiceMock.createSubmissionEventSource
    ).toHaveBeenNthCalledWith(2, 'run-only-1')
    expect(
      submissionsServiceMock.createSubmissionEventSource.mock.calls[1]
    ).toHaveLength(1)
    expect(result.current.output.status).toBe('running')
    expect(result.current.output.isSubmit).toBe(false)
  })

  it('still falls back to persisted polling for submit-code when the stream is silent', async () => {
    const stream = createMockStream()
    submissionsServiceMock.submitCode.mockResolvedValue({
      submissionId: 'submission-1',
      status: 'PENDING',
      queuePosition: 1,
      estimatedWaitTime: 30,
    })
    submissionsServiceMock.createSubmissionEventSource.mockReturnValue(stream)
    submissionsServiceMock.getSubmission
      .mockResolvedValueOnce(createSubmissionDetail('PENDING'))
      .mockResolvedValueOnce(createSubmissionDetail('ACCEPTED'))

    const { result } = renderHook(() =>
      useSubmissionExecution({
        testCases: [],
      })
    )

    await act(async () => {
      await result.current.submit({
        sourceCode: 'print(1)',
        language: 'python',
        problemId: 'problem-1',
      })
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(submissionsServiceMock.getSubmission).toHaveBeenCalledTimes(2)
    expect(result.current.output.status).toBe('accepted')
  })
})

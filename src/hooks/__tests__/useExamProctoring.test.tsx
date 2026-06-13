// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ProctoringSettings } from '@/types/exam.types'

const examServiceMock = vi.hoisted(() => ({
  getProctoringSettings: vi.fn(),
  acceptProctoringConsent: vi.fn(),
  submitProctoringPrecheck: vi.fn(),
  verifyProctoringBypass: vi.fn(),
  createProctoringSocketToken: vi.fn(),
  submitProctoringFinalFlush: vi.fn(),
}))

const socketMock = vi.hoisted(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  sendBatch: vi.fn(),
  requestFinalFlush: vi.fn(),
  onSessionRejected: vi.fn(),
}))

vi.mock('@/services/api/exam.service', () => ({
  examService: examServiceMock,
}))

vi.mock('@/services/proctoring/proctoringSocketClient', () => ({
  ProctoringSocketClient: vi.fn(() => socketMock),
}))

import { useExamProctoring } from '@/hooks/useExamProctoring'

function makeSettings(overrides: Partial<ProctoringSettings> = {}) {
  return {
    examId: 'exam-1',
    enabled: true,
    requireCamera: false,
    requireScreenShare: false,
    requireFullscreen: false,
    requireMonitorDisplaySurface: false,
    precheckValiditySeconds: 300,
    heartbeatIntervalSeconds: 60,
    missedHeartbeatGraceMultiplier: 3,
    screenShareResumeTimeoutSeconds: 30,
    fullscreenResumeTimeoutSeconds: 15,
    allowedEventTypesJson: ['heartbeat', 'paste'],
    riskWeightsJson: {},
    riskThresholdsJson: {},
    clipboardPolicy: 'log_only',
    aiAnomalyEnabled: true,
    aiShadowMode: true,
    aiJobWindowSeconds: 300,
    consentNoticeVersion: 'phase-1',
    legalLinksJson: {},
    dataRetentionDays: 180,
    dataDeletionSlaDays: 20,
    sensitiveDataDeletionTargetHours: 72,
    ...overrides,
  } satisfies ProctoringSettings
}

describe('useExamProctoring', () => {
  beforeEach(() => {
    window.sessionStorage.clear()

    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        randomUUID: () => 'uuid-1',
      },
    })
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: vi.fn(),
    })

    examServiceMock.getProctoringSettings.mockResolvedValue(makeSettings())
    examServiceMock.acceptProctoringConsent.mockResolvedValue({
      id: 'consent-1',
      status: 'accepted',
    })
    examServiceMock.submitProctoringPrecheck.mockResolvedValue({
      id: 'precheck-1',
      passed: true,
      expiresAt: '2099-06-12T10:00:00.000Z',
    })
    examServiceMock.createProctoringSocketToken.mockResolvedValue({
      token: 'socket-token-1',
      expiresAt: '2099-06-12T10:00:00.000Z',
    })
    examServiceMock.submitProctoringFinalFlush.mockResolvedValue({
      receiptId: 'receipt-1',
      status: 'persisted',
    })
    socketMock.sendBatch.mockResolvedValue(false)
    socketMock.requestFinalFlush.mockResolvedValue(false)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('loads settings, gates start on consent and precheck, and final-flushes queued metadata', async () => {
    const { result, unmount } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
        participationId: 'participation-1',
        userId: 'candidate-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await waitFor(() => {
      expect(examServiceMock.createProctoringSocketToken).toHaveBeenCalledWith(
        'participation-1',
        { clientSessionId: 'client-uuid-1' }
      )
      expect(socketMock.connect).toHaveBeenCalledWith(
        {
          participationId: 'participation-1',
          clientSessionId: 'client-uuid-1',
          userId: 'candidate-1',
          lastSeenClientSeq: 0,
        },
        { proctoringToken: 'socket-token-1' }
      )
    })
    expect(result.current.startReady).toBe(false)

    await act(async () => {
      await result.current.acceptConsent()
    })

    expect(examServiceMock.acceptProctoringConsent).toHaveBeenCalledWith(
      'spring-midterm',
      expect.objectContaining({
        accepted: true,
        clientSessionId: 'client-uuid-1',
        entrySessionId: 'entry-1',
        participationId: 'participation-1',
        acceptedCapabilitiesJson: {
          camera: false,
          screenShare: false,
          fullscreen: false,
        },
      })
    )

    await act(async () => {
      await result.current.runPrecheck()
    })

    expect(result.current.startReady).toBe(true)
    expect(result.current.startPayload).toMatchObject({
      clientSessionId: 'client-uuid-1',
      consentRecordId: 'consent-1',
      precheckId: 'precheck-1',
    })

    act(() => {
      result.current.recordTelemetry('paste', {
        textLength: 7,
        clipboardText: 'secret clipboard text',
      })
    })

    await act(async () => {
      await expect(result.current.finalFlush('attempt-1')).resolves.toEqual({
        submitAttemptId: 'attempt-1',
        finalFlushReceiptId: 'receipt-1',
      })
    })

    expect(socketMock.requestFinalFlush).toHaveBeenCalledWith(
      expect.objectContaining({
        participationId: 'participation-1',
        clientSessionId: 'client-uuid-1',
        submitAttemptId: 'attempt-1',
        expectedEventCount: 1,
      })
    )
    expect(examServiceMock.submitProctoringFinalFlush).toHaveBeenCalledWith(
      'participation-1',
      expect.objectContaining({
        submitAttemptId: 'attempt-1',
        events: [
          expect.objectContaining({
            payloadJson: {
              eventName: 'paste',
              textLength: 7,
            },
          }),
        ],
      })
    )

    unmount()
    expect(socketMock.disconnect).toHaveBeenCalledTimes(1)
  })
})

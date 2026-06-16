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
import { proctoringMediaSession } from '@/services/proctoring/proctoringMediaSession'

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
    proctoringMediaSession.stopAllMedia()

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

  it('checkDevices does not call requestFullscreen (separated gesture)', async () => {
    examServiceMock.getProctoringSettings.mockResolvedValue(
      makeSettings({ requireFullscreen: true })
    )

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await result.current.acceptConsent()
    })

    // Device check should NOT call requestFullscreen
    const requestFullscreenSpy = vi.spyOn(
      document.documentElement,
      'requestFullscreen'
    )

    await act(async () => {
      await result.current.checkDevices()
    })

    expect(requestFullscreenSpy).not.toHaveBeenCalled()
    requestFullscreenSpy.mockRestore()
  })

  it('omits null participation id when accepting consent for an entry session', async () => {
    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
        participationId: null,
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await result.current.acceptConsent()
    })

    expect(examServiceMock.acceptProctoringConsent).toHaveBeenCalledWith(
      'spring-midterm',
      expect.objectContaining({
        accepted: true,
        clientSessionId: 'client-uuid-1',
        entrySessionId: 'entry-1',
      })
    )
    expect(
      examServiceMock.acceptProctoringConsent.mock.calls[0][1]
    ).not.toHaveProperty('participationId')
  })

  it('omits null participation id when verifying bypass for an entry session', async () => {
    examServiceMock.verifyProctoringBypass.mockResolvedValue({
      bypassCodeId: 'bypass-1',
      status: 'used',
    })

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
        participationId: null,
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await result.current.verifyBypass('BP-CODE-123')
    })

    expect(examServiceMock.verifyProctoringBypass).toHaveBeenCalledWith(
      'spring-midterm',
      expect.objectContaining({
        bypassCode: 'BP-CODE-123',
        clientSessionId: 'client-uuid-1',
        entrySessionId: 'entry-1',
      })
    )
    expect(
      examServiceMock.verifyProctoringBypass.mock.calls[0][1]
    ).not.toHaveProperty('participationId')
  })

  it('checkDevices works immediately after acceptConsent without waiting for re-render', async () => {
    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await result.current.acceptConsent()
    })

    await act(async () => {
      const snapshot = await result.current.checkDevices()
      expect(snapshot).not.toBeNull()
    })
  })

  it('runPrecheck works immediately after acceptConsent without waiting for re-render', async () => {
    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await result.current.acceptConsent()
    })

    await act(async () => {
      const precheck = await result.current.runPrecheck()
      expect(precheck).not.toBeNull()
    })
  })

  it('enterPrecheckFullscreen calls requestFullscreen with fresh gesture', async () => {
    examServiceMock.getProctoringSettings.mockResolvedValue(
      makeSettings({ requireFullscreen: true })
    )

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    const requestFullscreenSpy = vi.spyOn(
      document.documentElement,
      'requestFullscreen'
    )
    requestFullscreenSpy.mockResolvedValue(undefined)

    // Mock document.fullscreenElement
    const originalFullscreenElement = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'fullscreenElement'
    )
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.documentElement,
    })

    await act(async () => {
      const ok = await result.current.enterPrecheckFullscreen()
      expect(ok).toBe(true)
    })

    expect(requestFullscreenSpy).toHaveBeenCalledTimes(1)

    // Cleanup
    requestFullscreenSpy.mockRestore()
    if (originalFullscreenElement) {
      Object.defineProperty(
        document,
        'fullscreenElement',
        originalFullscreenElement
      )
    }
  })

  it('submitPrecheckPrecheck sends fullscreenActive from document state', async () => {
    examServiceMock.getProctoringSettings.mockResolvedValue(
      makeSettings({
        requireFullscreen: true,
        requireCamera: false,
        requireScreenShare: false,
      })
    )

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await result.current.acceptConsent()
    })

    // Mock fullscreenActive as true
    const originalFullscreenElement = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'fullscreenElement'
    )
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.documentElement,
    })

    await act(async () => {
      await result.current.runPrecheck()
    })

    expect(examServiceMock.submitProctoringPrecheck).toHaveBeenCalledWith(
      'spring-midterm',
      expect.objectContaining({
        fullscreenActive: true,
      })
    )

    if (originalFullscreenElement) {
      Object.defineProperty(
        document,
        'fullscreenElement',
        originalFullscreenElement
      )
    }
  })

  it('runPrecheck sends fullscreenActive false when fullscreenElement is null', async () => {
    examServiceMock.getProctoringSettings.mockResolvedValue(
      makeSettings({
        requireFullscreen: true,
        requireCamera: false,
        requireScreenShare: false,
      })
    )

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await result.current.acceptConsent()
    })

    // Ensure fullscreenElement is null
    const originalFullscreenElement = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'fullscreenElement'
    )
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => null,
    })

    await act(async () => {
      await result.current.runPrecheck()
    })

    expect(examServiceMock.submitProctoringPrecheck).toHaveBeenCalledWith(
      'spring-midterm',
      expect.objectContaining({
        fullscreenActive: false,
      })
    )

    if (originalFullscreenElement) {
      Object.defineProperty(
        document,
        'fullscreenElement',
        originalFullscreenElement
      )
    }
  })

  it('runPrecheck sends fullscreenActive false when requireFullscreen is false (regardless of state)', async () => {
    examServiceMock.getProctoringSettings.mockResolvedValue(
      makeSettings({ requireFullscreen: false })
    )

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await result.current.acceptConsent()
    })

    // Mock fullscreen as active (should not matter)
    const originalFullscreenElement = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'fullscreenElement'
    )
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.documentElement,
    })

    await act(async () => {
      await result.current.runPrecheck()
    })

    expect(examServiceMock.submitProctoringPrecheck).toHaveBeenCalledWith(
      'spring-midterm',
      expect.objectContaining({
        fullscreenActive: false,
      })
    )

    if (originalFullscreenElement) {
      Object.defineProperty(
        document,
        'fullscreenElement',
        originalFullscreenElement
      )
    }
  })

  it('requestScreenShare updates snapshot so runPrecheck sends correct displaySurface and monitorValidated', async () => {
    examServiceMock.getProctoringSettings.mockResolvedValue(
      makeSettings({
        requireCamera: true,
        requireScreenShare: true,
        requireMonitorDisplaySurface: true,
        requireFullscreen: false,
      })
    )

    const mockDisplayStream = {
      getVideoTracks: () => [
        {
          getSettings: () => ({ displaySurface: 'monitor' }),
          addEventListener: vi.fn(),
        },
      ],
      getTracks: () => [
        {
          getSettings: () => ({ displaySurface: 'monitor' }),
          addEventListener: vi.fn(),
          stop: vi.fn(),
        },
      ],
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getVideoTracks: () => [],
          getTracks: () => [],
        }),
        getDisplayMedia: vi.fn().mockResolvedValue(mockDisplayStream),
      },
    })

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await result.current.acceptConsent()
    })

    await act(async () => {
      const snapshot = await result.current.checkDevices()
      // cameraPermissionGranted is false because checkDevices skips camera when requireCamera is true
      expect(snapshot?.cameraPermissionGranted).toBe(false)
    })

    await act(async () => {
      const cameraOk = await result.current.requestCamera()
      expect(cameraOk).toBe(true)
    })

    await act(async () => {
      const ok = await result.current.requestScreenShare()
      expect(ok).toBe(true)
    })

    await act(async () => {
      await result.current.runPrecheck()
    })

    expect(examServiceMock.submitProctoringPrecheck).toHaveBeenCalledWith(
      'spring-midterm',
      expect.objectContaining({
        displaySurface: 'monitor',
        monitorValidated: true,
        getDisplayMediaSupported: true,
      })
    )
  })

  it('screen stream persists in media session after hook unmount', async () => {
    examServiceMock.getProctoringSettings.mockResolvedValue(
      makeSettings({ requireScreenShare: true })
    )

    const mockTrackStop = vi.fn()
    const mockDisplayStream = {
      getVideoTracks: () => [
        {
          getSettings: () => ({ displaySurface: 'monitor' }),
          addEventListener: vi.fn(),
        },
      ],
      getTracks: () => [
        {
          getSettings: () => ({ displaySurface: 'monitor' }),
          addEventListener: vi.fn(),
          stop: mockTrackStop,
        },
      ],
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(),
        getDisplayMedia: vi.fn().mockResolvedValue(mockDisplayStream),
      },
    })

    const { result, unmount } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await result.current.requestScreenShare()
    })

    expect(proctoringMediaSession.isScreenShareActive()).toBe(true)

    unmount()

    expect(proctoringMediaSession.isScreenShareActive()).toBe(true)
    expect(mockTrackStop).not.toHaveBeenCalled()

    proctoringMediaSession.stopAllMedia()
  })

  it('camera stream persists in media session after hook unmount', async () => {
    examServiceMock.getProctoringSettings.mockResolvedValue(
      makeSettings({ requireCamera: true })
    )

    const mockTrackStop = vi.fn()
    const mockCameraStream = {
      getVideoTracks: () => [
        {
          getSettings: () => ({}),
          addEventListener: vi.fn(),
          stop: mockTrackStop,
        },
      ],
      getTracks: () => [
        {
          getSettings: () => ({}),
          addEventListener: vi.fn(),
          stop: mockTrackStop,
        },
      ],
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockCameraStream),
        getDisplayMedia: vi.fn(),
      },
    })

    const { result, unmount } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await result.current.acceptConsent()
    })

    await act(async () => {
      await result.current.requestCamera()
    })

    expect(proctoringMediaSession.isCameraActive()).toBe(true)

    unmount()

    expect(proctoringMediaSession.isCameraActive()).toBe(true)
    expect(mockTrackStop).not.toHaveBeenCalled()

    proctoringMediaSession.stopAllMedia()
  })

  it('stopAllMedia cleans up camera and screen streams', async () => {
    examServiceMock.getProctoringSettings.mockResolvedValue(
      makeSettings({ requireCamera: true, requireScreenShare: true })
    )

    const mockCameraStream = {
      getVideoTracks: () => [
        { getSettings: () => ({}), addEventListener: vi.fn(), stop: vi.fn() },
      ],
      getTracks: () => [
        { getSettings: () => ({}), addEventListener: vi.fn(), stop: vi.fn() },
      ],
    }
    const mockDisplayStream = {
      getVideoTracks: () => [
        {
          getSettings: () => ({ displaySurface: 'monitor' }),
          addEventListener: vi.fn(),
          stop: vi.fn(),
        },
      ],
      getTracks: () => [
        {
          getSettings: () => ({ displaySurface: 'monitor' }),
          addEventListener: vi.fn(),
          stop: vi.fn(),
        },
      ],
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockCameraStream),
        getDisplayMedia: vi.fn().mockResolvedValue(mockDisplayStream),
      },
    })

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await result.current.acceptConsent()
    })

    await act(async () => {
      await result.current.requestCamera()
    })

    await act(async () => {
      await result.current.requestScreenShare()
    })

    expect(proctoringMediaSession.isCameraActive()).toBe(true)
    expect(proctoringMediaSession.isScreenShareActive()).toBe(true)

    act(() => {
      result.current.stopAllMedia()
    })

    expect(proctoringMediaSession.isCameraActive()).toBe(false)
    expect(proctoringMediaSession.isScreenShareActive()).toBe(false)
  })

  it('workspace hook reuses clientSessionId stored by entry page via participation-scoped key', async () => {
    examServiceMock.getProctoringSettings.mockResolvedValue(makeSettings())

    // Step 1: Entry page hook creates clientSessionId
    const { result: entryResult, unmount: entryUnmount } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    await waitFor(() => {
      expect(entryResult.current.settings?.enabled).toBe(true)
    })

    const entryClientSessionId = entryResult.current.clientSessionId
    expect(entryClientSessionId).toBeTruthy()

    // Step 2: Simulate startEntrySessionNow storing the ID with participation-scoped key
    const participationId = 'participation-123'
    window.sessionStorage.setItem(
      `proctoring:clientSessionId:spring-midterm:${participationId}`,
      entryClientSessionId
    )

    entryUnmount()

    // Step 3: Workspace hook mounts with participationId
    const { result: workspaceResult } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        participationId,
        userId: 'candidate-1',
      })
    )

    await waitFor(() => {
      expect(workspaceResult.current.settings?.enabled).toBe(true)
    })

    // Step 4: Workspace hook should reuse the same clientSessionId
    expect(workspaceResult.current.clientSessionId).toBe(entryClientSessionId)

    // Step 5: Verify startPayload uses the same clientSessionId (finalFlush uses the same hook state)
    await act(async () => {
      await workspaceResult.current.acceptConsent()
    })

    await act(async () => {
      await workspaceResult.current.runPrecheck()
    })

    expect(workspaceResult.current.startPayload.clientSessionId).toBe(
      entryClientSessionId
    )
  })
})

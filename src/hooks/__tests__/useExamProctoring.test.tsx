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

type MockTrackEventName = 'ended' | 'mute' | 'unmute'

type MockVideoTrack = {
  addEventListener: ReturnType<typeof vi.fn>
  onended: (() => void) | null
  onmute: (() => void) | null
  onunmute: (() => void) | null
  removeEventListener: ReturnType<typeof vi.fn>
  dispatch: (eventName: MockTrackEventName) => void
  getSettings: () => MediaTrackSettings
  muted: boolean
  readyState: 'live' | 'ended'
  stop: ReturnType<typeof vi.fn>
}

function createMockVideoTrack(): MockVideoTrack {
  const listeners: Partial<Record<MockTrackEventName, Set<() => void>>> = {}
  const track = {
    muted: false,
    readyState: 'live' as 'live' | 'ended',
    onended: null as (() => void) | null,
    onmute: null as (() => void) | null,
    onunmute: null as (() => void) | null,
    addEventListener: vi.fn(
      (eventName: MockTrackEventName, listener: () => void) => {
        listeners[eventName] ??= new Set()
        listeners[eventName]?.add(listener)
      }
    ),
    removeEventListener: vi.fn(
      (eventName: MockTrackEventName, listener: () => void) => {
        listeners[eventName]?.delete(listener)
      }
    ),
    dispatch: (eventName: MockTrackEventName) => {
      if (eventName === 'ended') {
        track.readyState = 'ended'
      }
      if (eventName === 'mute') {
        track.muted = true
      }
      if (eventName === 'unmute') {
        track.muted = false
      }
      if (eventName === 'ended') {
        track.onended?.()
      }
      if (eventName === 'mute') {
        track.onmute?.()
      }
      if (eventName === 'unmute') {
        track.onunmute?.()
      }
      listeners[eventName]?.forEach(listener => listener())
    },
    getSettings: () => ({}),
    stop: vi.fn(() => {
      track.readyState = 'ended'
    }),
  }

  return track
}

function createMockCameraStream(
  track: MockVideoTrack,
  active = true
): MediaStream {
  return {
    active,
    getVideoTracks: () => [track as unknown as MediaStreamTrack],
    getTracks: () => [track as unknown as MediaStreamTrack],
  } as MediaStream
}

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
    allowedEventTypesJson: ['heartbeat', 'clipboard_event'],
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
      result.current.recordTelemetry('clipboard_event', {
        action: 'paste',
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
              eventName: 'clipboard_event',
              action: 'paste',
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

  it('records copy as canonical clipboard_event metadata', async () => {
    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        participationId: 'participation-1',
        userId: 'candidate-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    act(() => {
      window.dispatchEvent(new Event('copy'))
    })

    await act(async () => {
      await result.current.finalFlush('attempt-copy')
    })

    expect(examServiceMock.submitProctoringFinalFlush).toHaveBeenCalledWith(
      'participation-1',
      expect.objectContaining({
        submitAttemptId: 'attempt-copy',
        events: [
          expect.objectContaining({
            payloadJson: expect.objectContaining({
              eventName: 'clipboard_event',
              action: 'copy',
            }),
          }),
        ],
      })
    )
  })

  it('records cut as canonical clipboard_event metadata', async () => {
    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        participationId: 'participation-1',
        userId: 'candidate-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    act(() => {
      window.dispatchEvent(new Event('cut'))
    })

    await act(async () => {
      await result.current.finalFlush('attempt-cut')
    })

    expect(examServiceMock.submitProctoringFinalFlush).toHaveBeenCalledWith(
      'participation-1',
      expect.objectContaining({
        submitAttemptId: 'attempt-cut',
        events: [
          expect.objectContaining({
            payloadJson: expect.objectContaining({
              eventName: 'clipboard_event',
              action: 'cut',
            }),
          }),
        ],
      })
    )
  })

  it('strips raw clipboard fields before flush', async () => {
    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        participationId: 'participation-1',
        userId: 'candidate-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    act(() => {
      result.current.recordTelemetry('clipboard_event', {
        action: 'paste',
        textLength: 7,
        clipboardText: 'secret clipboard text',
        rawClipboardText: 'secret clipboard text',
        text: 'secret clipboard text',
        rawText: 'secret clipboard text',
        content: 'secret clipboard text',
      })
    })

    await act(async () => {
      await result.current.finalFlush('attempt-strip')
    })

    const flushCalls = examServiceMock.submitProctoringFinalFlush.mock.calls
    const lastFlushCall = flushCalls[flushCalls.length - 1]
    const payloadJson = lastFlushCall?.[1]?.events?.[0]?.payloadJson

    expect(payloadJson).toMatchObject({
      eventName: 'clipboard_event',
      action: 'paste',
      textLength: 7,
    })
    expect(payloadJson).not.toHaveProperty('clipboardText')
    expect(payloadJson).not.toHaveProperty('rawClipboardText')
    expect(payloadJson).not.toHaveProperty('text')
    expect(payloadJson).not.toHaveProperty('rawText')
    expect(payloadJson).not.toHaveProperty('content')
  })

  it('strips camera device identity fields before flush', async () => {
    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        participationId: 'participation-1',
        userId: 'candidate-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    act(() => {
      result.current.recordTelemetry('camera_stopped', {
        reason: 'track_ended',
        deviceId: 'device-1',
        groupId: 'group-1',
        label: 'Built-in Camera',
        trackId: 'track-1',
      })
    })

    await act(async () => {
      await result.current.finalFlush('attempt-camera-sanitize')
    })

    const flushCalls = examServiceMock.submitProctoringFinalFlush.mock.calls
    const lastFlushCall = flushCalls[flushCalls.length - 1]
    const payloadJson = lastFlushCall?.[1]?.events?.[0]?.payloadJson

    expect(payloadJson).toMatchObject({
      eventName: 'camera_stopped',
      reason: 'track_ended',
    })
    expect(payloadJson).not.toHaveProperty('deviceId')
    expect(payloadJson).not.toHaveProperty('groupId')
    expect(payloadJson).not.toHaveProperty('label')
    expect(payloadJson).not.toHaveProperty('trackId')
  })

  it('records camera_started after camera permission success', async () => {
    const track = createMockVideoTrack()
    const stream = createMockCameraStream(track)

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    })

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        participationId: 'participation-1',
        userId: 'candidate-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await expect(result.current.requestCamera()).resolves.toBe(true)
    })

    await act(async () => {
      await result.current.finalFlush('attempt-camera-started')
    })

    expect(examServiceMock.submitProctoringFinalFlush).toHaveBeenCalledWith(
      'participation-1',
      expect.objectContaining({
        submitAttemptId: 'attempt-camera-started',
        events: [
          expect.objectContaining({
            payloadJson: expect.objectContaining({
              eventName: 'camera_started',
            }),
          }),
        ],
      })
    )
  })

  it('records camera_stopped after the camera track ends', async () => {
    const track = createMockVideoTrack()
    const stream = createMockCameraStream(track)

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    })

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        participationId: 'participation-1',
        userId: 'candidate-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await expect(result.current.requestCamera()).resolves.toBe(true)
    })

    act(() => {
      track.dispatch('ended')
    })

    await waitFor(() => {
      expect(result.current.cameraActive).toBe(false)
    })

    await act(async () => {
      await result.current.finalFlush('attempt-camera-stopped')
    })

    expect(examServiceMock.submitProctoringFinalFlush).toHaveBeenCalledWith(
      'participation-1',
      expect.objectContaining({
        submitAttemptId: 'attempt-camera-stopped',
        events: expect.arrayContaining([
          expect.objectContaining({
            payloadJson: expect.objectContaining({
              eventName: 'camera_stopped',
              reason: 'track_ended',
              trackState: 'ended',
            }),
          }),
        ]),
      })
    )
  })

  it('records camera_track_muted and camera_track_unmuted from track events', async () => {
    const track = createMockVideoTrack()
    const stream = createMockCameraStream(track)

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(stream),
      },
    })

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        participationId: 'participation-1',
        userId: 'candidate-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await expect(result.current.requestCamera()).resolves.toBe(true)
    })

    act(() => {
      track.dispatch('mute')
      track.dispatch('unmute')
    })

    await act(async () => {
      await result.current.finalFlush('attempt-camera-muted')
    })

    expect(examServiceMock.submitProctoringFinalFlush).toHaveBeenCalledWith(
      'participation-1',
      expect.objectContaining({
        submitAttemptId: 'attempt-camera-muted',
        events: expect.arrayContaining([
          expect.objectContaining({
            payloadJson: expect.objectContaining({
              eventName: 'camera_track_muted',
            }),
          }),
          expect.objectContaining({
            payloadJson: expect.objectContaining({
              eventName: 'camera_track_unmuted',
            }),
          }),
        ]),
      })
    )
  })

  it('records camera_permission_denied when getUserMedia is rejected with NotAllowedError', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi
          .fn()
          .mockRejectedValue(new DOMException('Denied', 'NotAllowedError')),
      },
    })

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        participationId: 'participation-1',
        userId: 'candidate-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await expect(result.current.requestCamera()).resolves.toBe(false)
    })

    await act(async () => {
      await result.current.finalFlush('attempt-camera-permission-denied')
    })

    expect(examServiceMock.submitProctoringFinalFlush).toHaveBeenCalledWith(
      'participation-1',
      expect.objectContaining({
        submitAttemptId: 'attempt-camera-permission-denied',
        events: [
          expect.objectContaining({
            payloadJson: expect.objectContaining({
              eventName: 'camera_permission_denied',
            }),
          }),
        ],
      })
    )
  })

  it('records camera_error when getUserMedia fails with a non-permission error', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi
          .fn()
          .mockRejectedValue(new Error('Camera disconnected')),
      },
    })

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        participationId: 'participation-1',
        userId: 'candidate-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    await act(async () => {
      await expect(result.current.requestCamera()).resolves.toBe(false)
    })

    await act(async () => {
      await result.current.finalFlush('attempt-camera-error')
    })

    expect(examServiceMock.submitProctoringFinalFlush).toHaveBeenCalledWith(
      'participation-1',
      expect.objectContaining({
        submitAttemptId: 'attempt-camera-error',
        events: [
          expect.objectContaining({
            payloadJson: expect.objectContaining({
              eventName: 'camera_error',
            }),
          }),
        ],
      })
    )
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

  it('regression: camera+fullscreen required, screen share disabled still setups and starts', async () => {
    examServiceMock.getProctoringSettings.mockResolvedValue(
      makeSettings({
        requireCamera: true,
        requireScreenShare: false,
        requireFullscreen: true,
      })
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
      },
    })

    const requestFullscreenSpy = vi.spyOn(
      document.documentElement,
      'requestFullscreen'
    )
    requestFullscreenSpy.mockResolvedValue(undefined)

    const originalFullscreenElement = Object.getOwnPropertyDescriptor(
      Document.prototype,
      'fullscreenElement'
    )
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.documentElement,
    })

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
        participationId: 'participation-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settings?.enabled).toBe(true)
    })

    expect(result.current.screenShareActive).toBe(false)
    expect(result.current.startReady).toBe(false)

    await act(async () => {
      await result.current.acceptConsent()
    })

    await act(async () => {
      const cameraOk = await result.current.requestCamera()
      expect(cameraOk).toBe(true)
    })

    await act(async () => {
      const fsOk = await result.current.enterPrecheckFullscreen()
      expect(fsOk).toBe(true)
    })

    await act(async () => {
      await result.current.runPrecheck()
    })

    expect(result.current.startReady).toBe(true)
    expect(result.current.screenShareActive).toBe(false)

    expect(examServiceMock.acceptProctoringConsent).toHaveBeenCalledWith(
      'spring-midterm',
      expect.objectContaining({
        acceptedCapabilitiesJson: {
          camera: true,
          screenShare: false,
          fullscreen: true,
        },
      })
    )

    requestFullscreenSpy.mockRestore()
    if (originalFullscreenElement) {
      Object.defineProperty(
        document,
        'fullscreenElement',
        originalFullscreenElement
      )
    }
    proctoringMediaSession.stopAllMedia()
  })

  it('settingsLoading starts true and becomes false after settings resolve', async () => {
    // Delay settings resolution so we can observe the loading state
    let resolveSettings: (value: ProctoringSettings) => void
    examServiceMock.getProctoringSettings.mockReturnValue(
      new Promise<ProctoringSettings>(resolve => {
        resolveSettings = resolve
      })
    )

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    // settingsLoading should be true on initial render
    expect(result.current.settingsLoading).toBe(true)
    expect(result.current.settingsError).toBeNull()
    expect(result.current.settings).toBeNull()

    // Resolve settings
    await act(async () => {
      resolveSettings!(makeSettings())
    })

    await waitFor(() => {
      expect(result.current.settingsLoading).toBe(false)
    })

    expect(result.current.settingsError).toBeNull()
    expect(result.current.settings?.enabled).toBe(true)
  })

  it('settings load failure sets settingsError and keeps settingsLoading false', async () => {
    examServiceMock.getProctoringSettings.mockRejectedValue(
      new Error('Network error')
    )

    const { result } = renderHook(() =>
      useExamProctoring({
        examSlug: 'spring-midterm',
        entrySessionId: 'entry-1',
      })
    )

    await waitFor(() => {
      expect(result.current.settingsLoading).toBe(false)
    })

    expect(result.current.settingsError).toBe(
      'Failed to load proctoring settings. Please refresh the page and try again.'
    )
    expect(result.current.settings).toBeNull()
    expect(result.current.proctoringRequired).toBe(false)
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

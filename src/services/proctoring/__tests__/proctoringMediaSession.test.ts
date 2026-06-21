// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  proctoringMediaSession,
  useProctoringMediaSession,
} from '@/services/proctoring/proctoringMediaSession'

import { act, cleanup, renderHook } from '@testing-library/react'

function createMockStream(trackLabel = 'mock-track') {
  const trackStop = vi.fn()
  const trackAddEventListener = vi.fn()
  const track = {
    stop: trackStop,
    addEventListener: trackAddEventListener,
    getSettings: () => ({ displaySurface: 'monitor' }),
    label: trackLabel,
  }
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
    active: true,
    _trackStop: trackStop,
    _trackAddEventListener: trackAddEventListener,
  }
  return stream as typeof stream & MediaStream
}

describe('proctoringMediaSession', () => {
  beforeEach(() => {
    proctoringMediaSession.stopAllMedia()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    proctoringMediaSession.stopAllMedia()
    cleanup()
  })

  it('starts with no active streams', () => {
    expect(proctoringMediaSession.getCameraStream()).toBeNull()
    expect(proctoringMediaSession.getScreenStream()).toBeNull()
    expect(proctoringMediaSession.isCameraActive()).toBe(false)
    expect(proctoringMediaSession.isScreenShareActive()).toBe(false)
  })

  it('setCameraStream stores stream and reports active', () => {
    const stream = createMockStream()
    proctoringMediaSession.setCameraStream(stream)
    expect(proctoringMediaSession.getCameraStream()).toBe(stream)
    expect(proctoringMediaSession.isCameraActive()).toBe(true)
  })

  it('setScreenStream stores stream and reports active', () => {
    const stream = createMockStream()
    proctoringMediaSession.setScreenStream(stream)
    expect(proctoringMediaSession.getScreenStream()).toBe(stream)
    expect(proctoringMediaSession.isScreenShareActive()).toBe(true)
  })

  it('stopAllMedia stops all tracks and clears streams', () => {
    const cameraStream = createMockStream('camera')
    const screenStream = createMockStream('screen')
    proctoringMediaSession.setCameraStream(cameraStream)
    proctoringMediaSession.setScreenStream(screenStream)

    proctoringMediaSession.stopAllMedia()

    expect(cameraStream._trackStop).toHaveBeenCalled()
    expect(screenStream._trackStop).toHaveBeenCalled()
    expect(proctoringMediaSession.getCameraStream()).toBeNull()
    expect(proctoringMediaSession.getScreenStream()).toBeNull()
    expect(proctoringMediaSession.isCameraActive()).toBe(false)
    expect(proctoringMediaSession.isScreenShareActive()).toBe(false)
  })

  it('survives hook unmount/remount — streams persist', () => {
    const stream = createMockStream()
    proctoringMediaSession.setScreenStream(stream)

    const { unmount } = renderHook(() => useProctoringMediaSession())
    const { result } = renderHook(() => useProctoringMediaSession())
    unmount()

    expect(proctoringMediaSession.getScreenStream()).toBe(stream)
    expect(result.current.screenShareActive).toBe(true)
  })

  it('useProctoringMediaSession reflects current state and subscribes to changes', () => {
    const { result } = renderHook(() => useProctoringMediaSession())

    expect(result.current.cameraActive).toBe(false)
    expect(result.current.screenShareActive).toBe(false)
    expect(result.current.cameraStream).toBeNull()

    act(() => {
      proctoringMediaSession.setCameraStream(createMockStream())
    })

    expect(result.current.cameraActive).toBe(true)
    expect(result.current.cameraStream).not.toBeNull()

    act(() => {
      proctoringMediaSession.stopAllMedia()
    })

    expect(result.current.cameraActive).toBe(false)
    expect(result.current.cameraStream).toBeNull()
  })

  it('screen track ended event updates session state', () => {
    const stream = createMockStream()
    proctoringMediaSession.setScreenStream(stream)
    expect(proctoringMediaSession.isScreenShareActive()).toBe(true)

    const endHandler = stream._trackAddEventListener.mock.calls.find(
      (call: unknown[]) => call[0] === 'ended'
    )
    expect(endHandler).toBeDefined()
    if (endHandler) {
      endHandler[1]()
    }

    expect(proctoringMediaSession.isScreenShareActive()).toBe(false)
  })
})

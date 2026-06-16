import { useCallback, useEffect, useSyncExternalStore } from 'react'

type MediaSessionSnapshot = {
  cameraStream: MediaStream | null
  screenStream: MediaStream | null
  cameraActive: boolean
  screenShareActive: boolean
}

type Listener = () => void

class ProctoringMediaSession {
  private cameraStream: MediaStream | null = null
  private screenStream: MediaStream | null = null
  private listeners = new Set<Listener>()
  private cachedSnapshot: MediaSessionSnapshot = {
    cameraStream: null,
    screenStream: null,
    cameraActive: false,
    screenShareActive: false,
  }

  private rebuildSnapshot(): void {
    const cameraActive =
      this.cameraStream !== null && this.cameraStream.active !== false
    const screenShareActive =
      this.screenStream !== null && this.screenStream.active !== false
    if (
      this.cachedSnapshot.cameraStream === this.cameraStream &&
      this.cachedSnapshot.screenStream === this.screenStream &&
      this.cachedSnapshot.cameraActive === cameraActive &&
      this.cachedSnapshot.screenShareActive === screenShareActive
    ) {
      return
    }
    this.cachedSnapshot = {
      cameraStream: this.cameraStream,
      screenStream: this.screenStream,
      cameraActive,
      screenShareActive,
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit(): void {
    this.rebuildSnapshot()
    for (const listener of this.listeners) {
      listener()
    }
  }

  setCameraStream(stream: MediaStream | null): void {
    if (this.cameraStream && this.cameraStream !== stream) {
      this.cameraStream.getTracks().forEach(track => track.stop())
    }
    this.cameraStream = stream
    if (stream) {
      for (const track of stream.getVideoTracks()) {
        track.addEventListener(
          'ended',
          () => {
            if (this.cameraStream === stream) {
              this.cameraStream = null
              this.emit()
            }
          },
          { once: true }
        )
      }
    }
    this.emit()
  }

  setScreenStream(stream: MediaStream | null): void {
    if (this.screenStream && this.screenStream !== stream) {
      this.screenStream.getTracks().forEach(track => track.stop())
    }
    this.screenStream = stream
    if (stream) {
      for (const track of stream.getVideoTracks()) {
        track.addEventListener(
          'ended',
          () => {
            if (this.screenStream === stream) {
              this.screenStream = null
              this.emit()
            }
          },
          { once: true }
        )
      }
    }
    this.emit()
  }

  getCameraStream(): MediaStream | null {
    return this.cameraStream
  }

  getScreenStream(): MediaStream | null {
    return this.screenStream
  }

  isCameraActive(): boolean {
    return this.cameraStream !== null && this.cameraStream.active !== false
  }

  isScreenShareActive(): boolean {
    return this.screenStream !== null && this.screenStream.active !== false
  }

  stopAllMedia(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop())
      this.cameraStream = null
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop())
      this.screenStream = null
    }
    this.emit()
  }

  getSnapshot(): MediaSessionSnapshot {
    this.rebuildSnapshot()
    return this.cachedSnapshot
  }
}

export const proctoringMediaSession = new ProctoringMediaSession()

export function useProctoringMediaSession(): MediaSessionSnapshot {
  const subscribe = useCallback(
    (callback: () => void) => proctoringMediaSession.subscribe(callback),
    []
  )
  const getSnapshot = useCallback(
    () => proctoringMediaSession.getSnapshot(),
    []
  )
  const getServerSnapshot = useCallback(
    (): MediaSessionSnapshot => ({
      cameraStream: null,
      screenStream: null,
      cameraActive: false,
      screenShareActive: false,
    }),
    []
  )

  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  useEffect(() => {
    return () => {}
  }, [])

  return snapshot
}

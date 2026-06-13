import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { examService } from '@/services/api/exam.service'
import { ProctoringSocketClient } from '@/services/proctoring/proctoringSocketClient'
import {
  ProctoringTelemetryQueue,
  type ProctoringClientEventName,
} from '@/services/proctoring/proctoringTelemetryQueue'
import type {
  ProctoringBypassGrant,
  ProctoringConsentRecord,
  ProctoringPrecheckRecord,
  ProctoringSettings,
  ProctoringStartPayload,
} from '@/types/exam.types'

type UseExamProctoringOptions = {
  examSlug: string
  entrySessionId?: string | null
  participationId?: string | null
  userId?: string | null
}

type BrowserPrecheckSnapshot = {
  browserName?: string
  browserVersion?: string
  osName?: string
  getUserMediaSupported: boolean
  cameraPermissionGranted: boolean
  getDisplayMediaSupported: boolean
  displaySurface?: string
  monitorValidated: boolean
  fullscreenSupported: boolean
  browserSupported: boolean
}

const CLIENT_SEQ_PREFIX = 'proctoring:clientSeq'
const CLIENT_SESSION_PREFIX = 'proctoring:clientSessionId'
const BYPASS_PREFIX = 'proctoring:bypassGrant'

function readStorage(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable in hardened browser modes.
  }
}

function removeStorage(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    // Ignore storage cleanup failures.
  }
}

function createClientSessionId(): string {
  const uuid =
    globalThis.crypto && 'randomUUID' in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `client-${uuid}`
}

function storageScope(options: UseExamProctoringOptions): string {
  return [
    options.examSlug || 'unknown-exam',
    options.entrySessionId || options.participationId || 'pending-session',
  ].join(':')
}

function parseBypassGrant(raw: string | null): ProctoringBypassGrant | null {
  if (!raw) return null
  try {
    const grant = JSON.parse(raw) as ProctoringBypassGrant
    if (!grant.bypassCodeId || grant.status !== 'used') {
      return null
    }
    if (grant.expiresAt && new Date(grant.expiresAt).getTime() <= Date.now()) {
      return null
    }
    return grant
  } catch {
    return null
  }
}

function getDisplaySurface(track: MediaStreamTrack): string {
  try {
    const settings = track.getSettings() as MediaTrackSettings & {
      displaySurface?: string
    }
    return settings.displaySurface || 'surface_unknown'
  } catch {
    return 'surface_unknown'
  }
}

async function stopStream(stream: MediaStream | null): Promise<void> {
  stream?.getTracks().forEach(track => track.stop())
}

async function collectBrowserPrecheck(
  settings: ProctoringSettings | null
): Promise<BrowserPrecheckSnapshot> {
  const mediaDevices = navigator.mediaDevices as
    | (MediaDevices & {
        getDisplayMedia?: (
          constraints?: DisplayMediaStreamOptions
        ) => Promise<MediaStream>
      })
    | undefined
  const getUserMediaSupported = Boolean(mediaDevices?.getUserMedia)
  const getDisplayMediaSupported = Boolean(mediaDevices?.getDisplayMedia)
  const fullscreenSupported = Boolean(
    document.documentElement.requestFullscreen
  )
  let cameraPermissionGranted = !settings?.requireCamera
  let displaySurface = 'surface_unknown'
  let monitorValidated = !settings?.requireMonitorDisplaySurface

  if (settings?.requireCamera && mediaDevices?.getUserMedia) {
    let cameraStream: MediaStream | null = null
    try {
      cameraStream = await mediaDevices.getUserMedia({
        video: true,
        audio: false,
      })
      cameraPermissionGranted = true
    } catch {
      cameraPermissionGranted = false
    } finally {
      await stopStream(cameraStream)
    }
  }

  if (settings?.requireScreenShare && mediaDevices?.getDisplayMedia) {
    let displayStream: MediaStream | null = null
    try {
      displayStream = await mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      })
      const [track] = displayStream.getVideoTracks()
      displaySurface = track ? getDisplaySurface(track) : 'surface_unknown'
      monitorValidated =
        !settings.requireMonitorDisplaySurface || displaySurface === 'monitor'
    } catch {
      displaySurface = 'surface_unknown'
      monitorValidated = false
    } finally {
      await stopStream(displayStream)
    }
  }

  return {
    browserName: navigator.userAgent ? 'browser' : undefined,
    browserVersion: navigator.userAgent,
    osName: navigator.platform,
    getUserMediaSupported,
    cameraPermissionGranted,
    getDisplayMediaSupported,
    displaySurface,
    monitorValidated,
    fullscreenSupported,
    browserSupported: true,
  }
}

export function useExamProctoring(options: UseExamProctoringOptions) {
  const scope = storageScope(options)
  const clientSessionKey = `${CLIENT_SESSION_PREFIX}:${scope}`
  const clientSeqKey = `${CLIENT_SEQ_PREFIX}:${scope}`
  const bypassKey = `${BYPASS_PREFIX}:${scope}`

  const [clientSessionId] = useState(() => {
    const existing = readStorage(clientSessionKey)
    if (existing) return existing
    const created = createClientSessionId()
    writeStorage(clientSessionKey, created)
    return created
  })
  const [settings, setSettings] = useState<ProctoringSettings | null>(null)
  const [consentRecord, setConsentRecord] =
    useState<ProctoringConsentRecord | null>(null)
  const [precheckRecord, setPrecheckRecord] =
    useState<ProctoringPrecheckRecord | null>(null)
  const [bypassGrant, setBypassGrant] = useState<ProctoringBypassGrant | null>(
    () => parseBypassGrant(readStorage(bypassKey))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [screenShareActive, setScreenShareActive] = useState(false)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const socketClientRef = useRef<ProctoringSocketClient | null>(null)

  const initialClientSeq = Number(readStorage(clientSeqKey) ?? '0') || 0
  const telemetryQueue = useMemo(
    () =>
      new ProctoringTelemetryQueue({
        participationId:
          options.participationId || options.entrySessionId || 'pending',
        clientSessionId,
        entrySessionId: options.entrySessionId,
        initialClientSeq,
        onClientSeq: clientSeq => writeStorage(clientSeqKey, String(clientSeq)),
      }),
    [
      clientSessionId,
      clientSeqKey,
      initialClientSeq,
      options.entrySessionId,
      options.participationId,
    ]
  )

  useEffect(() => {
    if (!options.examSlug) return
    let cancelled = false

    const loadSettings = async () => {
      try {
        const result = await examService.getProctoringSettings(options.examSlug)
        if (!cancelled) {
          setSettings(result)
        }
      } catch {
        if (!cancelled) {
          setSettings(null)
        }
      }
    }

    void loadSettings()
    return () => {
      cancelled = true
    }
  }, [options.examSlug])

  const recordTelemetry = useCallback(
    (
      eventName: ProctoringClientEventName,
      payload: Record<string, unknown> = {}
    ) => {
      if (!options.participationId) return
      const frame = telemetryQueue.enqueue(eventName, payload)
      void socketClientRef.current
        ?.sendBatch(telemetryQueue.snapshot())
        .then(accepted => {
          if (accepted) {
            telemetryQueue.clearThrough(frame.clientSeq)
          }
        })
        .catch((err: Error) => {
          console.error(err)
        })
    },
    [options.participationId, telemetryQueue]
  )

  useEffect(() => {
    if (!options.participationId || !options.userId) {
      return
    }

    let cancelled = false
    const socketClient = new ProctoringSocketClient()
    socketClientRef.current = socketClient
    const connectWithFreshToken = async () => {
      try {
        const token = await examService.createProctoringSocketToken(
          options.participationId as string,
          { clientSessionId }
        )
        if (cancelled) return
        socketClient.connect(
          {
            participationId: options.participationId as string,
            clientSessionId,
            userId: options.userId as string,
            lastSeenClientSeq: initialClientSeq,
          },
          { proctoringToken: token.token }
        )
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to create proctoring socket token'
          )
        }
      }
    }
    socketClient.onSessionRejected(() => {
      void connectWithFreshToken()
    })
    void connectWithFreshToken()

    return () => {
      cancelled = true
      socketClient.disconnect()
      if (socketClientRef.current === socketClient) {
        socketClientRef.current = null
      }
    }
  }, [
    clientSessionId,
    initialClientSeq,
    options.participationId,
    options.userId,
  ])

  useEffect(() => {
    if (!options.participationId) return

    const onBlur = () => recordTelemetry('focus_lost')
    const onFocus = () => recordTelemetry('focus_returned')
    const onVisibilityChange = () => {
      recordTelemetry(
        document.visibilityState === 'hidden'
          ? 'visibility_hidden'
          : 'visibility_visible',
        { visibilityState: document.visibilityState }
      )
    }
    const onFullscreenChange = () => {
      recordTelemetry(
        document.fullscreenElement ? 'fullscreen_enter' : 'fullscreen_exit'
      )
    }
    const onOffline = () => recordTelemetry('network_offline')
    const onOnline = () => recordTelemetry('network_online')
    const onPaste = (event: ClipboardEvent) => {
      const clipboardData = event.clipboardData
      const text = clipboardData?.getData('text/plain') ?? ''
      recordTelemetry('paste', {
        textLength: text.length,
        mimeTypes: clipboardData ? Array.from(clipboardData.types) : [],
      })
    }

    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    window.addEventListener('paste', onPaste)

    const heartbeatId = window.setInterval(
      () => {
        recordTelemetry('heartbeat', {
          online: navigator.onLine,
          visibilityState: document.visibilityState,
        })
      },
      Math.max(1000, (settings?.heartbeatIntervalSeconds ?? 10) * 1000)
    )

    return () => {
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('paste', onPaste)
      window.clearInterval(heartbeatId)
    }
  }, [
    options.participationId,
    recordTelemetry,
    settings?.heartbeatIntervalSeconds,
  ])

  const acceptConsent = useCallback(async () => {
    if (!options.examSlug) return null
    setLoading(true)
    setError(null)
    try {
      const result = await examService.acceptProctoringConsent(
        options.examSlug,
        {
          accepted: true,
          clientSessionId,
          entrySessionId: options.entrySessionId,
          participationId: options.participationId,
          acceptedCapabilitiesJson: {
            camera: Boolean(settings?.requireCamera),
            screenShare: Boolean(settings?.requireScreenShare),
            fullscreen: Boolean(settings?.requireFullscreen),
          },
        }
      )
      setConsentRecord(result)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record consent')
      return null
    } finally {
      setLoading(false)
    }
  }, [
    clientSessionId,
    options.entrySessionId,
    options.examSlug,
    options.participationId,
    settings?.requireCamera,
    settings?.requireFullscreen,
    settings?.requireScreenShare,
  ])

  const runPrecheck = useCallback(async () => {
    if (!options.examSlug || !consentRecord?.id) return null
    setLoading(true)
    setError(null)
    try {
      const snapshot = await collectBrowserPrecheck(settings)
      const result = await examService.submitProctoringPrecheck(
        options.examSlug,
        {
          consentRecordId: consentRecord.id,
          clientSessionId,
          ...snapshot,
        }
      )
      setPrecheckRecord(result)
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run precheck')
      return null
    } finally {
      setLoading(false)
    }
  }, [clientSessionId, consentRecord?.id, options.examSlug, settings])

  const verifyBypass = useCallback(
    async (bypassCode: string) => {
      if (!options.examSlug) return null
      setLoading(true)
      setError(null)
      try {
        const result = await examService.verifyProctoringBypass(
          options.examSlug,
          {
            bypassCode,
            clientSessionId,
            entrySessionId: options.entrySessionId,
            participationId: options.participationId,
          }
        )
        setBypassGrant(result)
        writeStorage(bypassKey, JSON.stringify(result))
        return result
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to verify bypass')
        return null
      } finally {
        setLoading(false)
      }
    },
    [
      bypassKey,
      clientSessionId,
      options.entrySessionId,
      options.examSlug,
      options.participationId,
    ]
  )

  const markStartSucceeded = useCallback(() => {
    setBypassGrant(null)
    removeStorage(bypassKey)
  }, [bypassKey])

  const requestScreenShare = useCallback(async () => {
    const mediaDevices = navigator.mediaDevices as
      | (MediaDevices & {
          getDisplayMedia?: (
            constraints?: DisplayMediaStreamOptions
          ) => Promise<MediaStream>
        })
      | undefined
    if (!mediaDevices?.getDisplayMedia) {
      recordTelemetry('screen_share_ended', { reason: 'unsupported' })
      return false
    }

    try {
      const stream = await mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      })
      await stopStream(screenStreamRef.current)
      screenStreamRef.current = stream
      setScreenShareActive(true)
      stream.getTracks().forEach(track => {
        track.addEventListener(
          'ended',
          () => {
            setScreenShareActive(false)
            recordTelemetry('screen_share_ended', {
              displaySurface: getDisplaySurface(track),
            })
          },
          { once: true }
        )
      })
      return true
    } catch {
      setScreenShareActive(false)
      return false
    }
  }, [recordTelemetry])

  useEffect(() => {
    return () => {
      void stopStream(screenStreamRef.current)
    }
  }, [])

  const finalFlush = useCallback(
    async (submitAttemptId: string) => {
      if (!options.participationId) {
        return { submitAttemptId }
      }
      const result = await telemetryQueue.finalFlush({
        submitAttemptId,
        wsFlush: request =>
          socketClientRef.current?.requestFinalFlush(request) ??
          Promise.resolve(false),
        httpFlush: request =>
          examService.submitProctoringFinalFlush(
            options.participationId as string,
            request
          ),
      })
      return { submitAttemptId, ...result }
    },
    [options.participationId, telemetryQueue]
  )

  const proctoringRequired = Boolean(settings?.enabled)
  const consentAccepted = Boolean(consentRecord?.id)
  const precheckPassed = Boolean(
    precheckRecord?.passed &&
    (!precheckRecord.expiresAt ||
      new Date(precheckRecord.expiresAt).getTime() > Date.now())
  )
  const bypassActive = Boolean(bypassGrant?.bypassCodeId)
  const startReady =
    !proctoringRequired || (consentAccepted && (precheckPassed || bypassActive))
  const startPayload: ProctoringStartPayload = {
    clientSessionId,
    consentRecordId: consentRecord?.id,
    precheckId: precheckPassed ? precheckRecord?.id : undefined,
    bypassCodeId: bypassActive ? bypassGrant?.bypassCodeId : undefined,
  }
  const screenShareBlocked = Boolean(
    settings?.enabled &&
    settings.requireScreenShare &&
    options.participationId &&
    !screenShareActive
  )

  return {
    settings,
    clientSessionId,
    consentRecord,
    consentAccepted,
    precheckRecord,
    precheckPassed,
    bypassGrant,
    bypassActive,
    loading,
    error,
    proctoringRequired,
    startReady,
    startPayload,
    telemetryQueue,
    screenShareActive,
    screenShareBlocked,
    acceptConsent,
    runPrecheck,
    verifyBypass,
    markStartSucceeded,
    requestScreenShare,
    recordTelemetry,
    finalFlush,
  }
}

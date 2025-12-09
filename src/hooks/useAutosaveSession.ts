import { useEffect, useRef, useCallback } from 'react'
import useDebouncedCallback from './useDebouncedCallback'
import { examService } from '@/services/api/exam.service'

type AutosaveOptions = {
  delay?: number
  enabled?: boolean
}

/**
 * Hook: useAutosaveSession
 * - Debounces autosave calls to the server using `examService.syncSession`.
 * - Flushes pending save when challenge changes or on unmount.
 * - Attempts best-effort sendBeacon on unload.
 */
export default function useAutosaveSession(
  participationId: string | null | undefined,
  challengeId: string | null | undefined,
  getPayload: () => { sourceCode?: string; language?: string } | null,
  options: AutosaveOptions = {}
) {
  const { delay = 5000 } = options
  const { enabled = true } = options
  const prevChallengeRef = useRef<string | null>(null)

  const syncFn = useCallback(
    async (pid: string, payload: Record<string, unknown>) => {
      try {
        console.log(`[Autosave] Syncing session ${pid} with payload:`, payload)
        await examService.syncSession(pid, payload)
        console.log(`[Autosave] Sync completed successfully`)
      } catch (err) {
        console.error(`[Autosave] Sync failed:`, err)
        // swallow - autosave is best-effort
        // caller may log if desired
      }
    },
    []
  )

  const {
    callback: debouncedSync,
    flush,
    cancel,
  } = useDebouncedCallback(
    async (pid: string, payload: Record<string, unknown>) => {
      await syncFn(pid, payload)
    },
    delay
  )

  // Trigger autosave when code changes via debounced callback
  useEffect(() => {
    if (!enabled) return
    if (!participationId || !challengeId) return
    const p = getPayload()
    if (!p) return
    debouncedSync(participationId, {
      [challengeId]: { ...p, updatedAt: new Date().toISOString() },
    })
    // cancel will be called on unmount by cleanup below if needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participationId, challengeId, getPayload, enabled])

  // When challengeId changes, flush pending save for previous challenge
  useEffect(() => {
    const prev = prevChallengeRef.current
    if (prev && participationId) {
      // flush any pending save for previous
      flush()
    }
    prevChallengeRef.current = challengeId ?? null
    return () => {
      // nothing here
    }
    // flush and participationId are stable from hook scope
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId])

  // Best-effort beforeunload using sendBeacon
  useEffect(() => {
    const onBeforeUnload = () => {
      if (!enabled) return
      const pid = participationId
      const cur = prevChallengeRef.current || challengeId
      if (!pid || !cur) return
      const p = getPayload()
      if (!p) return
      const body = JSON.stringify({
        sessionId: pid,
        answers: { [cur]: { ...p, updatedAt: new Date().toISOString() } },
        clientTimestamp: new Date().toISOString(),
      })
      if (typeof navigator !== 'undefined') {
        type BeaconNav = {
          sendBeacon?: (url: string, data?: BodyInit | null) => boolean
        }
        const nav = navigator as unknown as BeaconNav
        if (nav.sendBeacon) {
          const url = '/api/exams/session/sync'
          const blob = new Blob([body], { type: 'application/json' })
          nav.sendBeacon(url, blob)
        } else {
          // no-op: synchronous XHR in beforeunload is discouraged in modern browsers
        }
      } else {
        // no-op: synchronous XHR in beforeunload is discouraged in modern browsers
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [participationId, challengeId, getPayload, enabled])

  // Provide helpers to flush/cancel from caller
  return { flush, cancel }
}

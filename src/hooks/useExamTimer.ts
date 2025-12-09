import { useEffect, useRef, useState, useCallback } from 'react'

export type TimeSource = {
  startAt?: number | string | null
  expiresAt?: number | string | null
  durationMinutes?: number
}

export function parseTimestamp(value?: number | string | null): number | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'number') return value
  const parsed = Date.parse(String(value))
  return Number.isNaN(parsed) ? null : parsed
}

export function computeRemainingSeconds({
  startAt,
  expiresAt,
  durationMinutes,
}: TimeSource): number {
  const expiresMs = parseTimestamp(expiresAt)
  if (expiresMs !== null) {
    return Math.max(0, Math.floor((expiresMs - Date.now()) / 1000))
  }

  const startMs = parseTimestamp(startAt)
  const totalSeconds = (durationMinutes || 0) * 60
  if (startMs !== null) {
    const elapsed = Math.floor((Date.now() - startMs) / 1000)
    return Math.max(0, totalSeconds - elapsed)
  }

  return Math.max(0, totalSeconds)
}

export function useExamTimer(
  opts: TimeSource & {
    enabled?: boolean
    tickIntervalMs?: number
    onExpire?: () => void
  }
) {
  const { enabled = true, tickIntervalMs = 1000, onExpire } = opts
  const [remaining, setRemaining] = useState(() =>
    computeRemainingSeconds(opts)
  )
  const timerRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    const r = computeRemainingSeconds(opts)
    setRemaining(r)
    if (r <= 0 && onExpire) onExpire()
  }, [opts, onExpire])

  useEffect(() => {
    if (!enabled) return
    // set initial
    tick()
    timerRef.current = window.setInterval(tick, tickIntervalMs)
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [tick, enabled, tickIntervalMs])

  return { remaining, isExpired: remaining <= 0 }
}

export default useExamTimer

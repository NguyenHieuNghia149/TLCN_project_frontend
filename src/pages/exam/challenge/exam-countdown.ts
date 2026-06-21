export type ExamCountdownInput = {
  nowMs?: number
  startAt?: number | string | null
  expiresAt?: number | string | null
  durationMinutes?: number
}

function parseTimestamp(value?: number | string | null): number | null {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const asNumber = Number(value)
  if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) {
    return asNumber
  }

  const parsed = Date.parse(String(value))
  return Number.isNaN(parsed) ? null : parsed
}

export function computeExamRemainingSeconds({
  nowMs = Date.now(),
  startAt,
  expiresAt,
  durationMinutes = 0,
}: ExamCountdownInput): number {
  const expiresMs = parseTimestamp(expiresAt)
  if (expiresMs !== null) {
    return Math.max(0, Math.floor((expiresMs - nowMs) / 1000))
  }

  const totalSeconds = Math.max(0, Math.floor(durationMinutes * 60))
  const startMs = parseTimestamp(startAt)
  if (startMs !== null) {
    const elapsed = Math.floor((nowMs - startMs) / 1000)
    return Math.max(0, totalSeconds - elapsed)
  }

  return totalSeconds
}

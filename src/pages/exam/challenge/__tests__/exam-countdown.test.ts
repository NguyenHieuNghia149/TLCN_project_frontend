import { describe, expect, it } from 'vitest'

import { computeExamRemainingSeconds } from '@/pages/exam/challenge/exam-countdown'

describe('computeExamRemainingSeconds', () => {
  it('prioritizes expiresAt over startAt so resume does not reset timer', () => {
    const nowMs = Date.parse('2026-04-08T10:00:00.000Z')
    const expiresAt = new Date(nowMs + 3250 * 1000).toISOString() // 54:10

    const remaining = computeExamRemainingSeconds({
      nowMs,
      startAt: nowMs, // reset-like local value
      expiresAt,
      durationMinutes: 60,
    })

    expect(remaining).toBe(3250)
  })

  it('falls back to startAt + duration when expiresAt is missing', () => {
    const nowMs = Date.parse('2026-04-08T10:30:00.000Z')

    const remaining = computeExamRemainingSeconds({
      nowMs,
      startAt: Date.parse('2026-04-08T10:00:00.000Z'),
      durationMinutes: 60,
    })

    expect(remaining).toBe(1800)
  })
})

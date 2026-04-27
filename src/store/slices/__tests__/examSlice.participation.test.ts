import { describe, expect, it } from 'vitest'

import examReducer, { setParticipation } from '@/store/slices/examSlice'

describe('examSlice setParticipation', () => {
  it('preserves existing optional participation fields on partial update', () => {
    const seeded = examReducer(
      undefined,
      setParticipation({
        participationId: 'part-1',
        examId: 'exam-1',
        startAt: 1710000000000,
        expiresAt: 1710003600000,
        currentChallengeId: 'challenge-1',
      })
    )

    const next = examReducer(
      seeded,
      setParticipation({
        participationId: 'part-1',
        startAt: 1710000010000,
      })
    )

    expect(next.currentParticipationExamId).toBe('exam-1')
    expect(next.currentParticipationStartAt).toBe(1710000010000)
    expect(next.currentParticipationExpiresAt).toBe(1710003600000)
    expect(next.currentParticipationChallengeId).toBe('challenge-1')
  })

  it('allows explicitly clearing an optional participation field', () => {
    const seeded = examReducer(
      undefined,
      setParticipation({
        participationId: 'part-1',
        examId: 'exam-1',
        startAt: 1710000000000,
        expiresAt: 1710003600000,
      })
    )

    const next = examReducer(
      seeded,
      setParticipation({
        participationId: 'part-1',
        expiresAt: null,
      })
    )

    expect(next.currentParticipationExamId).toBe('exam-1')
    expect(next.currentParticipationStartAt).toBe(1710000000000)
    expect(next.currentParticipationExpiresAt).toBeNull()
  })
})

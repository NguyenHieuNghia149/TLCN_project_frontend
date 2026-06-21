import { describe, expect, it } from 'vitest'

import {
  isLegacyExamId,
  resolveLegacyRedirectTarget,
} from '@/pages/exam/legacy/legacy-exam-redirect'

describe('resolveLegacyRedirectTarget', () => {
  it('detects legacy UUID exam identifiers', () => {
    expect(isLegacyExamId('779ef365-0bda-4e9f-9ca7-859a741cae51')).toBe(true)
    expect(isLegacyExamId('spring-midterm-2026')).toBe(false)
    expect(isLegacyExamId('')).toBe(false)
  })

  it('returns client manage result path for admin-results mode', () => {
    expect(
      resolveLegacyRedirectTarget({
        mode: 'admin-results',
        examId: 'exam-1',
      })
    ).toBe('/exam/exam-1/results/manage')
  })

  it('returns null when exam slug is missing for learner legacy routes', () => {
    expect(
      resolveLegacyRedirectTarget({
        mode: 'results',
        examId: 'exam-1',
        slug: null,
      })
    ).toBeNull()
  })

  it('maps legacy learner result and challenge routes to canonical slug routes', () => {
    expect(
      resolveLegacyRedirectTarget({
        mode: 'results',
        examId: 'exam-1',
        slug: 'my-exam',
      })
    ).toBe('/exam/my-exam/results')

    expect(
      resolveLegacyRedirectTarget({
        mode: 'challenge',
        examId: 'exam-1',
        challengeId: 'challenge-1',
        slug: 'my-exam',
      })
    ).toBe('/exam/my-exam/challenges/challenge-1')
  })
})

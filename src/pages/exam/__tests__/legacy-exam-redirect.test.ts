import { describe, expect, it } from 'vitest'

import { resolveLegacyRedirectTarget } from '@/pages/exam/legacy/legacy-exam-redirect'

describe('resolveLegacyRedirectTarget', () => {
  it('returns admin result path for admin-results mode', () => {
    expect(
      resolveLegacyRedirectTarget({
        mode: 'admin-results',
        examId: 'exam-1',
      })
    ).toBe('/admin/exams/exam-1/results')
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

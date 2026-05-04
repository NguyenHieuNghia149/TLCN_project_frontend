import { describe, expect, it } from 'vitest'

import { normalizeSubmissionDetails } from '@/pages/exam/results/submission-detail-view-model'

describe('normalizeSubmissionDetails', () => {
  it('maps canonical payload into a structured view model', () => {
    const result = normalizeSubmissionDetails({
      id: 'participation-1',
      totalScore: 75,
      duration: 58,
      startedAt: '2026-04-07T01:00:00.000Z',
      submittedAt: '2026-04-07T02:00:00.000Z',
      user: {
        firstname: 'Nguyen',
        lastname: 'Nghia',
        email: 'nghia@example.com',
      },
      solutions: [
        {
          challengeId: 'challenge-1',
          challengeTitle: 'Climbing Stairs',
          language: 'python',
          code: 'print("ok")',
          score: 20,
          submittedAt: '2026-04-07T01:30:00.000Z',
          results: [
            { testCaseId: 't1', passed: true },
            { testCaseId: 't2', passed: false },
          ],
        },
      ],
    })

    expect(result).toEqual({
      participationId: 'participation-1',
      userName: 'Nguyen Nghia',
      email: 'nghia@example.com',
      startedAt: '2026-04-07T01:00:00.000Z',
      submittedAt: '2026-04-07T02:00:00.000Z',
      durationMinutes: 58,
      totalScore: 75,
      solutions: [
        {
          challengeId: 'challenge-1',
          challengeTitle: 'Climbing Stairs',
          language: 'python',
          code: 'print("ok")',
          score: 20,
          submittedAt: '2026-04-07T01:30:00.000Z',
          passedCount: 1,
          totalTests: 2,
        },
      ],
    })
  })

  it('returns null for invalid payload', () => {
    expect(normalizeSubmissionDetails(null)).toBeNull()
    expect(normalizeSubmissionDetails('invalid')).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'

import { canResumeExamWorkspace } from '@/pages/exam/challenge/exam-workspace-access'

describe('canResumeExamWorkspace', () => {
  it('returns false when participation is already submitted', () => {
    const result = canResumeExamWorkspace({
      participationStatus: 'SUBMITTED',
      examEndDate: '2030-01-01T10:00:00.000Z',
      nowMs: new Date('2030-01-01T09:00:00.000Z').getTime(),
    })

    expect(result).toBe(false)
  })

  it('returns false when exam has ended', () => {
    const result = canResumeExamWorkspace({
      participationStatus: 'IN_PROGRESS',
      examEndDate: '2030-01-01T10:00:00.000Z',
      nowMs: new Date('2030-01-01T10:00:01.000Z').getTime(),
    })

    expect(result).toBe(false)
  })

  it('returns true for active in-progress participation inside exam window', () => {
    const result = canResumeExamWorkspace({
      participationStatus: 'IN_PROGRESS',
      examEndDate: '2030-01-01T10:00:00.000Z',
      participationExpiresAt: '2030-01-01T09:30:00.000Z',
      nowMs: new Date('2030-01-01T09:00:00.000Z').getTime(),
    })

    expect(result).toBe(true)
  })
})

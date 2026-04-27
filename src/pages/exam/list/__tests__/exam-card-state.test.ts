import { describe, expect, it } from 'vitest'

import { getLearnerExamCardState } from '@/pages/exam/list/exam-card-state'

describe('getLearnerExamCardState', () => {
  it('marks closed exam as non-enterable', () => {
    const state = getLearnerExamCardState({
      examStatus: 'published',
      startDate: '2030-01-01T08:00:00.000Z',
      endDate: '2030-01-01T10:00:00.000Z',
      nowMs: new Date('2030-01-01T11:00:00.000Z').getTime(),
    })

    expect(state.lifecycle).toBe('closed')
    expect(state.canEnter).toBe(false)
  })

  it('marks active exam as enterable', () => {
    const state = getLearnerExamCardState({
      examStatus: 'published',
      startDate: '2030-01-01T08:00:00.000Z',
      endDate: '2030-01-01T10:00:00.000Z',
      nowMs: new Date('2030-01-01T09:00:00.000Z').getTime(),
    })

    expect(state.lifecycle).toBe('active')
    expect(state.canEnter).toBe(true)
  })

  it('blocks enter for cancelled exam regardless of time', () => {
    const state = getLearnerExamCardState({
      examStatus: 'cancelled',
      startDate: '2030-01-01T08:00:00.000Z',
      endDate: '2030-01-01T10:00:00.000Z',
      nowMs: new Date('2030-01-01T09:00:00.000Z').getTime(),
    })

    expect(state.lifecycle).toBe('cancelled')
    expect(state.canEnter).toBe(false)
  })
})

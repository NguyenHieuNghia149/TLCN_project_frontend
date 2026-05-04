import { describe, expect, it } from 'vitest'

import {
  getLearnerExamCardState,
  getLearnerExamPrimaryAction,
} from '@/pages/exam/list/exam-card-state'

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

describe('getLearnerExamPrimaryAction', () => {
  it('continues only when the learner has an in-progress attempt', () => {
    const action = getLearnerExamPrimaryAction({
      lifecycle: 'active',
      latestParticipationStatus: 'IN_PROGRESS',
      hasInProgressParticipation: true,
      attemptsUsed: 1,
      maxAttempts: 2,
    })

    expect(action.kind).toBe('continue')
    expect(action.label).toBe('Continue Exam')
  })

  it('shows results for an active exam after the final submitted attempt', () => {
    const action = getLearnerExamPrimaryAction({
      lifecycle: 'active',
      latestParticipationStatus: 'SUBMITTED',
      hasInProgressParticipation: false,
      hasCompletedParticipation: true,
      attemptsUsed: 2,
      maxAttempts: 2,
    })

    expect(action.kind).toBe('results')
    expect(action.label).toBe('View Results')
  })

  it('allows a new attempt after a submitted attempt when attempts remain', () => {
    const action = getLearnerExamPrimaryAction({
      lifecycle: 'active',
      latestParticipationStatus: 'SUBMITTED',
      hasInProgressParticipation: false,
      hasCompletedParticipation: true,
      attemptsUsed: 1,
      maxAttempts: 2,
    })

    expect(action.kind).toBe('enter')
    expect(action.label).toBe('Enter Exam')
  })
})

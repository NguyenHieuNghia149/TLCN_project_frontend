import { describe, expect, it } from 'vitest'

import type { ExamAccessState, PublicExamLanding } from '@/types/exam.types'
import {
  computeEntryBlockReasons,
  resolveEntryPanelKind,
} from '@/pages/exam/access/exam-entry-reasons'

function makeExam(
  overrides: Partial<PublicExamLanding> = {}
): PublicExamLanding {
  return {
    id: 'exam-1',
    slug: 'exam-1',
    title: 'Exam',
    status: 'published',
    accessMode: 'hybrid',
    startDate: '2026-04-10T08:00:00.000Z',
    endDate: '2026-04-10T10:00:00.000Z',
    registrationOpenAt: null,
    registrationCloseAt: null,
    duration: 120,
    maxAttempts: 1,
    challengeCount: 3,
    allowExternalCandidates: true,
    selfRegistrationApprovalMode: 'manual',
    selfRegistrationPasswordRequired: false,
    isRegistrationOpen: true,
    canUseInviteLink: true,
    ...overrides,
  }
}

function makeAccessState(
  overrides: Partial<ExamAccessState> = {}
): ExamAccessState {
  return {
    examId: 'exam-1',
    participantId: 'participant-1',
    entrySessionId: 'entry-1',
    participationId: null,
    approvalStatus: 'approved',
    accessStatus: 'eligible',
    entrySessionStatus: 'eligible',
    canStart: true,
    examStartsAt: '2026-04-10T08:00:00.000Z',
    participationExpiresAt: null,
    requiresLogin: false,
    requiresOtp: false,
    requiresPassword: false,
    ...overrides,
  }
}

describe('exam entry reason priority', () => {
  it('picks exam cancelled as primary reason when multiple reasons exist', () => {
    const exam = makeExam({
      status: 'cancelled',
      startDate: '2026-04-10T08:00:00.000Z',
      endDate: '2026-04-10T10:00:00.000Z',
    })
    const accessState = makeAccessState({
      accessStatus: 'revoked',
      entrySessionStatus: 'expired',
    })

    const result = computeEntryBlockReasons(
      exam,
      accessState,
      new Date('2026-04-10T11:00:00.000Z').getTime()
    )

    expect(result.primaryReason).toBe('Exam has been cancelled.')
    expect(result.allReasons).toEqual([
      'Exam has been cancelled.',
      'Your access to this exam has been revoked.',
      'Exam has ended.',
      'Entry session has expired. Please verify again.',
    ])
  })

  it('maps completed access state to attempts exhausted reason', () => {
    const exam = makeExam({
      startDate: '2026-04-10T08:00:00.000Z',
      endDate: '2026-04-10T10:00:00.000Z',
    })
    const accessState = makeAccessState({
      accessStatus: 'completed',
      canStart: false,
    })

    const result = computeEntryBlockReasons(
      exam,
      accessState,
      new Date('2026-04-10T09:00:00.000Z').getTime()
    )

    expect(result.primaryReason).toBe('No attempts remaining.')
    expect(result.allReasons).toEqual(['No attempts remaining.'])
  })
})

describe('entry panel mapping', () => {
  it('maps opened and verified to verification panel', () => {
    expect(resolveEntryPanelKind('opened')).toBe('verification')
    expect(resolveEntryPanelKind('verified')).toBe('verification')
  })

  it('maps eligible and started to lobby panel', () => {
    expect(resolveEntryPanelKind('eligible')).toBe('lobby')
    expect(resolveEntryPanelKind('started')).toBe('lobby')
  })

  it('maps expired to expired panel and null to none', () => {
    expect(resolveEntryPanelKind('expired')).toBe('expired')
    expect(resolveEntryPanelKind(null)).toBe('none')
  })
})

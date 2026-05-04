import { describe, expect, it } from 'vitest'

import {
  resolveWizardStepIndex,
  syncWizardSearchParams,
} from '@/pages/admin/exam/admin-exam-wizard.query'

const STEP_KEYS = [
  'basic',
  'access',
  'participants',
  'challenges',
  'notifications',
  'review',
] as const

describe('admin exam wizard URL behavior', () => {
  it('resolves valid step index and falls back to basic for invalid step', () => {
    expect(resolveWizardStepIndex('participants', STEP_KEYS)).toBe(2)
    expect(resolveWizardStepIndex('unknown', STEP_KEYS)).toBe(0)
    expect(resolveWizardStepIndex(null, STEP_KEYS)).toBe(0)
  })

  it('clears participantId when step is not participants', () => {
    const current = new URLSearchParams({
      step: 'participants',
      participantId: 'p-123',
      q: 'search',
    })

    const next = syncWizardSearchParams(current, 'access')

    expect(next.get('step')).toBe('access')
    expect(next.get('participantId')).toBeNull()
    expect(next.get('q')).toBe('search')
  })

  it('keeps participantId when step remains participants', () => {
    const current = new URLSearchParams({
      step: 'participants',
      participantId: 'p-123',
    })

    const next = syncWizardSearchParams(current, 'participants')

    expect(next.get('step')).toBe('participants')
    expect(next.get('participantId')).toBe('p-123')
  })
})

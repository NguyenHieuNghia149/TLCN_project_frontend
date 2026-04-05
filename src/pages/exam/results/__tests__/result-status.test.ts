import { describe, expect, it } from 'vitest'

import {
  normalizeAdminResultStatus,
  normalizeLearnerResultStatus,
} from '@/pages/exam/results/result-status'

describe('normalizeAdminResultStatus', () => {
  it('respects explicit backend scoreStatus', () => {
    expect(normalizeAdminResultStatus('failed', 100)).toBe('failed')
    expect(normalizeAdminResultStatus('pending', 0)).toBe('pending')
    expect(normalizeAdminResultStatus('scored', null)).toBe('scored')
  })

  it('falls back to scored when numeric score exists and status missing', () => {
    expect(normalizeAdminResultStatus(undefined, 0)).toBe('scored')
    expect(normalizeAdminResultStatus(null, 42)).toBe('scored')
  })

  it('falls back to pending when status and score are missing', () => {
    expect(normalizeAdminResultStatus(undefined, null)).toBe('pending')
  })
})

describe('normalizeLearnerResultStatus', () => {
  it('keeps pending and failed semantics regardless of score payload', () => {
    expect(normalizeLearnerResultStatus('pending', 100)).toEqual({
      status: 'pending',
      score: null,
    })
    expect(normalizeLearnerResultStatus('failed', 100)).toEqual({
      status: 'failed',
      score: null,
    })
  })

  it('supports scored zero as valid scored state', () => {
    expect(normalizeLearnerResultStatus('scored', 0)).toEqual({
      status: 'scored',
      score: 0,
    })
  })

  it('falls back to pending when status missing and score missing', () => {
    expect(normalizeLearnerResultStatus(undefined, null)).toEqual({
      status: 'pending',
      score: null,
    })
  })
})

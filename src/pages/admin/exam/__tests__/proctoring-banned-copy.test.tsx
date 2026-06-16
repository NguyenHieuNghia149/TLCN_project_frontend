// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ProctoringBypassPanel from '@/pages/exam/access/components/ProctoringBypassPanel'
import ProctoringConsentPanel from '@/pages/exam/access/components/ProctoringConsentPanel'
import ProctoringPrecheckPanel from '@/pages/exam/access/components/ProctoringPrecheckPanel'
import ProctoringReviewPanel from '@/pages/admin/exam/components/ProctoringReviewPanel'
import type { AdminProctoringReview } from '@/types/exam.types'

const BANNED_TERMS = [
  'Cheating Probability',
  'Suspected Cheating',
  'Serious Violation',
  'gian lận',
  'cố ý',
  'tra cứu',
]

const consentSettings = {
  enabled: true,
  requireCamera: true,
  requireScreenShare: false,
  requireFullscreen: true,
  requireMonitorDisplaySurface: false,
  consentNoticeVersion: 'v1',
  dataRetentionDays: 90,
  dataDeletionSlaDays: 30,
  sensitiveDataDeletionTargetHours: 24,
  legalLinksJson: {},
}

function makeReview(): AdminProctoringReview {
  return {
    summary: {
      id: 's-1',
      examId: 'e-1',
      participationId: 'p-1',
      riskScore: 10,
      riskLevel: 'low',
      eventCountsJson: {},
      velocityJson: {},
      finalFlushStatus: 'persisted',
      deterministicSchemaVersion: 'v1',
      computedAt: '2026-06-12T10:00:00.000Z',
      reviewerDecision: 'pending',
      reviewerId: null,
      reviewerNotes: null,
      reviewedAt: null,
    },
    timeline: { items: [], total: 0, limit: 50, offset: 0 },
    evidence: {
      consent: [],
      precheck: [],
      bypass: [],
      finalFlush: [],
      dataRequests: [],
    },
    aiAdvisory: {
      visible: true,
      status: 'visible',
      modelVersion: 'iforest-v1',
      latestRiskLevel: 'high',
      maxAnomalyScore: 0.82,
      windows: [],
    },
  }
}

describe('P1.T10.10 — banned accusation terms absent from proctoring views', () => {
  it('ProctoringConsentPanel has no accusation terms', () => {
    render(
      <ProctoringConsentPanel
        settings={consentSettings}
        consentAccepted={false}
        loading={false}
        onAccept={vi.fn()}
      />
    )
    for (const term of BANNED_TERMS) {
      expect(screen.queryByText(term, { exact: false })).not.toBeInTheDocument()
    }
    expect(screen.getByText(/Proctoring consent/i)).toBeInTheDocument()
  })

  it('ProctoringPrecheckPanel has no accusation terms', () => {
    render(
      <ProctoringPrecheckPanel
        consentAccepted={true}
        precheckPassed={false}
        bypassActive={false}
        loading={false}
        failureReasons={[]}
        onCheckDevices={vi.fn().mockResolvedValue({})}
        onEnterFullscreen={vi.fn().mockResolvedValue(true)}
        onRunPrecheck={vi.fn()}
      />
    )
    for (const term of BANNED_TERMS) {
      expect(screen.queryByText(term, { exact: false })).not.toBeInTheDocument()
    }
    expect(screen.getByText(/Device precheck/i)).toBeInTheDocument()
  })

  it('ProctoringBypassPanel has no accusation terms', () => {
    render(
      <ProctoringBypassPanel
        consentAccepted={true}
        precheckPassed={false}
        bypassActive={false}
        loading={false}
        onVerify={vi.fn()}
      />
    )
    for (const term of BANNED_TERMS) {
      expect(screen.queryByText(term, { exact: false })).not.toBeInTheDocument()
    }
    expect(screen.getByText(/Bypass code/i)).toBeInTheDocument()
  })

  it('ProctoringReviewPanel has no accusation terms', () => {
    render(
      <ProctoringReviewPanel
        review={makeReview()}
        loading={false}
        actionLoading={false}
        onRefresh={vi.fn()}
        onRecompute={vi.fn()}
        onReview={vi.fn()}
      />
    )
    for (const term of BANNED_TERMS) {
      expect(screen.queryByText(term, { exact: false })).not.toBeInTheDocument()
    }
    expect(
      screen.getByText(/Deterministic proctoring review/i)
    ).toBeInTheDocument()
  })
})

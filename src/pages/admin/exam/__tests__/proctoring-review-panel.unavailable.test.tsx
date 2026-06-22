// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ProctoringReviewPanel from '@/pages/admin/exam/components/ProctoringReviewPanel'
import type { AdminProctoringReview } from '@/types/exam.types'

function makeReview(): AdminProctoringReview {
  return {
    summary: {
      id: 'summary-1',
      examId: 'exam-1',
      participationId: 'participation-1',
      riskScore: 12,
      riskLevel: 'low',
      eventCountsJson: {},
      velocityJson: {},
      finalFlushStatus: 'persisted',
      deterministicSchemaVersion: 'phase-1-deterministic-risk-v1',
      computedAt: '2026-06-22T12:00:00.000Z',
      reviewerDecision: 'pending',
      reviewerId: null,
      reviewerNotes: null,
      reviewedAt: null,
    },
    timeline: {
      items: [],
      total: 0,
      limit: 50,
      offset: 0,
    },
    evidence: {
      consent: [],
      precheck: [],
      bypass: [],
      finalFlush: [],
      dataRequests: [],
    },
    aiAdvisory: {
      visible: false,
      status: 'hidden_shadow_mode',
      windows: [],
    },
    llmSummary: {
      visible: false,
      status: 'unavailable',
      riskFacts: [],
      citations: [],
      missingDataNotes: [],
      modelNotes: [],
    },
  }
}

describe('ProctoringReviewPanel unavailable LLM summary messaging', () => {
  afterEach(() => {
    cleanup()
  })

  it('tells reviewers to recompute when no summary has been generated yet', () => {
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

    expect(
      screen.getByText(
        /No accepted LLM summary has been generated for this participation yet\. Use Recompute to queue one\./i
      )
    ).toBeInTheDocument()
  })
})

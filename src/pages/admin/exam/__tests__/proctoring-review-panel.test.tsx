// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ProctoringReviewPanel from '@/pages/admin/exam/components/ProctoringReviewPanel'
import type { AdminProctoringReview } from '@/types/exam.types'

function makeReview(): AdminProctoringReview {
  return {
    summary: {
      id: 'summary-1',
      examId: 'exam-1',
      participationId: 'participation-1',
      riskScore: 42,
      riskLevel: 'medium',
      eventCountsJson: { paste: 1 },
      velocityJson: { perMinute: 1 },
      finalFlushStatus: 'persisted',
      deterministicSchemaVersion: 'phase-1-deterministic-risk-v1',
      computedAt: '2026-06-12T10:00:00.000Z',
      reviewerDecision: 'pending',
      reviewerId: null,
      reviewerNotes: null,
      reviewedAt: null,
    },
    timeline: {
      items: [
        {
          id: 'event-1',
          type: 'telemetry.batch',
          eventName: 'paste',
          severity: 'info',
          clientSeq: 1,
          capturedAt: '2026-06-12T10:00:00.000Z',
          receivedAt: '2026-06-12T10:00:01.000Z',
          finalFlushReceiptId: 'receipt-1',
          payloadJson: { eventName: 'paste', textLength: 12 },
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    },
    evidence: {
      consent: [{ id: 'consent-1', status: 'accepted' }],
      precheck: [{ id: 'precheck-1', passed: true }],
      bypass: [],
      finalFlush: [{ id: 'receipt-1', status: 'persisted' }],
      dataRequests: [],
    },
    aiAdvisory: {
      visible: false,
      status: 'hidden_shadow_mode',
      windows: [],
    },
  }
}

describe('ProctoringReviewPanel', () => {
  afterEach(() => {
    cleanup()
  })

  it('shows deterministic evidence without AI results and saves a neutral review decision', async () => {
    const onReview = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <ProctoringReviewPanel
        review={makeReview()}
        loading={false}
        actionLoading={false}
        onRefresh={vi.fn()}
        onRecompute={vi.fn()}
        onReview={onReview}
      />
    )

    expect(
      screen.getByText(/deterministic proctoring review/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/medium/i)).toBeInTheDocument()
    expect(screen.getAllByText(/paste/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/final flush/i).length).toBeGreaterThan(0)
    expect(
      screen.queryByText(/ai result|ai score|llm/i)
    ).not.toBeInTheDocument()

    await user.selectOptions(
      screen.getByLabelText(/review decision/i),
      'no_action'
    )
    await user.type(screen.getByLabelText(/review notes/i), 'Reviewed.')
    await user.click(screen.getByRole('button', { name: /save review/i }))

    expect(onReview).toHaveBeenCalledWith({
      decision: 'no_action',
      notes: 'Reviewed.',
    })
  })

  it('shows gated advisory AI signal without accusation framing', () => {
    const review = makeReview()
    review.aiAdvisory = {
      visible: true,
      status: 'visible',
      modelVersion: 'iforest-v1',
      featureSchemaVersion: 'browser-window-v1',
      scoringSchemaVersion: 'anomaly-score-v1',
      latestRiskLevel: 'critical',
      maxAnomalyScore: 0.91,
      windows: [
        {
          windowId: 'window-1',
          windowStart: '2026-06-12T10:00:00.000Z',
          windowEnd: '2026-06-12T10:05:00.000Z',
          anomalyScore: 0.91,
          riskLevel: 'critical',
          explanationStatus: 'completed',
          topContributors: [
            {
              featureName: 'visibilityHiddenMs',
              numericValue: 120000,
              contribution: 0.72,
              direction: 'increased_risk',
              displayLabel: 'Page hidden duration',
            },
          ],
        },
      ],
    }

    render(
      <ProctoringReviewPanel
        review={review}
        loading={false}
        actionLoading={false}
        onRefresh={vi.fn()}
        onRecompute={vi.fn()}
        onReview={vi.fn()}
      />
    )

    expect(screen.getByText(/AI advisory signal/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Advisory only\. Human review remains required\./i)
    ).toBeInTheDocument()
    expect(screen.getByText(/iforest-v1/i)).toBeInTheDocument()
    expect(screen.getByText(/Page hidden duration/i)).toBeInTheDocument()
    expect(
      screen.queryByText(/cheat|fraud|guilty|caught/i)
    ).not.toBeInTheDocument()
  })

  it('shows LLM summary as disabled by default without accepted content', () => {
    const review = makeReview()
    review.llmSummary = {
      visible: false,
      status: 'hidden_disabled',
      riskFacts: [],
      citations: [],
      missingDataNotes: [],
      modelNotes: [],
    }

    render(
      <ProctoringReviewPanel
        review={review}
        loading={false}
        actionLoading={false}
        onRefresh={vi.fn()}
        onRecompute={vi.fn()}
        onReview={vi.fn()}
      />
    )

    expect(screen.getByText(/LLM review summary/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Assistive summary only\. Human review remains required\./i
      )
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Summary generation is disabled/i)
    ).toBeInTheDocument()
  })

  it('shows accepted LLM summary only as assistive review context', () => {
    const review = makeReview()
    review.llmSummary = {
      visible: true,
      status: 'accepted',
      summaryId: 'llm-summary-1',
      provider: 'local',
      modelVersion: 'summary-local-v1',
      promptVersion: 'proctoring-summary-v1',
      validationStatus: 'passed',
      validationScore: 0.94,
      summaryText: 'The timeline contains one focus change event.',
      riskFacts: [
        {
          type: 'focus_change',
          count: 1,
          totalDurationMs: 0,
          evidenceEventIds: ['event-1'],
        },
      ],
      citations: [{ eventId: 'event-1', reason: 'timeline evidence' }],
      missingDataNotes: [],
      modelNotes: ['Generated from minimized event metadata.'],
      completedAt: '2026-06-14T10:10:00.000Z',
    }

    render(
      <ProctoringReviewPanel
        review={review}
        loading={false}
        actionLoading={false}
        onRefresh={vi.fn()}
        onRecompute={vi.fn()}
        onReview={vi.fn()}
      />
    )

    expect(
      screen.getByText(/The timeline contains one focus change event/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Validation: passed/i)).toBeInTheDocument()
    expect(screen.getByText(/focus_change: 1/i)).toBeInTheDocument()
    expect(
      screen.queryByText(/cheat|fraud|guilty|caught/i)
    ).not.toBeInTheDocument()
  })
})

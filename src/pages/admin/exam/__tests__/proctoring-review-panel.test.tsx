// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

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
  }
}

describe('ProctoringReviewPanel', () => {
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
})

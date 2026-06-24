// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { render, screen, within } from '@testing-library/react'
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
      eventCountsJson: { focus_lost: 1 },
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
          eventName: 'camera_started',
          severity: 'info',
          clientSeq: 1,
          capturedAt: '2026-06-24T03:49:00.000Z',
          receivedAt: '2026-06-24T03:49:01.000Z',
          finalFlushReceiptId: null,
          payloadJson: { eventName: 'camera_started' },
        },
        {
          id: 'event-2',
          type: 'telemetry.batch',
          eventName: 'focus_lost',
          severity: 'warning',
          clientSeq: 2,
          capturedAt: '2026-06-24T03:52:00.000Z',
          receivedAt: '2026-06-24T03:52:01.000Z',
          finalFlushReceiptId: null,
          payloadJson: { eventName: 'focus_lost' },
        },
      ],
      total: 2,
      limit: 50,
      offset: 0,
    },
    evidence: {
      consent: [],
      precheck: [],
      bypass: [],
      finalFlush: [{ id: 'receipt-1', status: 'persisted' }],
      dataRequests: [],
    },
    aiAdvisory: {
      visible: false,
      status: 'hidden_shadow_mode',
      windows: [],
    },
    llmSummary: {
      visible: true,
      status: 'accepted',
      summaryId: 'llm-summary-1',
      provider: 'local',
      modelVersion: 'summary-local-v1',
      promptVersion: 'proctoring-summary-v1',
      validationStatus: 'passed',
      validationScore: 1,
      summaryText:
        'Review these signals: heartbeat x30, camera error x1, focus lost x1. Timeline highlights: 2026-06-24 03:49 camera started; 2026-06-24 03:52 focus lost. Missing data: no camera continuity events.',
      riskFacts: [
        {
          type: 'heartbeat',
          count: 30,
          totalDurationMs: 0,
          evidenceEventIds: ['event-1'],
        },
        {
          type: 'camera_error',
          count: 1,
          totalDurationMs: 0,
          evidenceEventIds: ['event-2'],
        },
        {
          type: 'focus_lost',
          count: 1,
          totalDurationMs: 0,
          evidenceEventIds: ['event-2'],
        },
      ],
      citations: [
        { eventId: 'event-1', reason: 'timeline evidence' },
        { eventId: 'event-2', reason: 'timeline evidence' },
      ],
      missingDataNotes: ['no camera continuity events'],
      modelNotes: [],
      completedAt: '2026-06-24T03:55:00.000Z',
    },
  }
}

describe('ProctoringReviewPanel LLM narrative', () => {
  it('renders a narrative summary above the evidence sections', () => {
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

    expect(screen.getByText('Narrative summary')).toBeInTheDocument()
    expect(
      screen.getByText(
        /This session recorded 30 heartbeat events, 1 camera error event, and 1 focus lost event\./i
      )
    ).toBeInTheDocument()
    const llmCard = screen
      .getByText(/LLM review summary/i)
      .closest('.rounded-lg')
    expect(llmCard).not.toBeNull()
    expect(
      within(llmCard as HTMLElement).getByText('Overview')
    ).toBeInTheDocument()
    expect(
      within(llmCard as HTMLElement).getByText('Timeline highlights')
    ).toBeInTheDocument()
    expect(
      within(llmCard as HTMLElement).getByText('Missing data')
    ).toBeInTheDocument()
  })
})

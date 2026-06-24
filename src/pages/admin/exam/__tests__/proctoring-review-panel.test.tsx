// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ProctoringReviewPanel from '@/pages/admin/exam/components/ProctoringReviewPanel'
import type {
  AdminProctoringEvidenceConfidence,
  AdminProctoringReview,
  AdminProctoringReviewLabelOutcome,
} from '@/types/exam.types'

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

  function getLlmSummaryCard() {
    const heading = screen.getByText(/LLM review summary/i)
    const card = heading.closest('.rounded-lg')
    expect(card).not.toBeNull()
    return card as HTMLElement
  }

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
    expect(screen.getAllByText(/medium/i).length).toBeGreaterThan(0)
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

  it('renders the Model evaluation label section and controls', () => {
    render(
      <ProctoringReviewPanel
        review={makeReview()}
        loading={false}
        actionLoading={false}
        onRefresh={vi.fn()}
        onRecompute={vi.fn()}
        onReview={vi.fn()}
        onLabel={vi.fn()}
      />
    )

    expect(screen.getByText(/Model evaluation label/i)).toBeInTheDocument()
    expect(
      screen.getByText(
        /Used for model evaluation only\. This helps compare AI signals with human review later\. It does not change the official exam result\./i
      )
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/^Review label$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Evidence confidence/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Label notes/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Save label/i })
    ).toBeInTheDocument()
  })

  it('renders the Official review decision section with helper text', () => {
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

    expect(screen.getByText('Official review decision')).toBeInTheDocument()
    expect(
      screen.getByText(
        /Official human-entered review status for this attempt\./i
      )
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/review decision/i)).toBeInTheDocument()
  })

  it('shows inline action status when provided', () => {
    render(
      <ProctoringReviewPanel
        review={makeReview()}
        loading={false}
        actionLoading={false}
        actionStatus={{
          type: 'success',
          message: 'Official review decision saved.',
        }}
        onRefresh={vi.fn()}
        onRecompute={vi.fn()}
        onReview={vi.fn()}
      />
    )

    expect(screen.getByRole('status')).toHaveTextContent(
      'Official review decision saved.'
    )
  })

  it('keeps review label and review decision in separate sections', () => {
    render(
      <ProctoringReviewPanel
        review={makeReview()}
        loading={false}
        actionLoading={false}
        onRefresh={vi.fn()}
        onRecompute={vi.fn()}
        onReview={vi.fn()}
        onLabel={vi.fn()}
      />
    )

    const reviewDecisionHeading = screen.getByText('Official review decision')
    const reviewLabelHeading = screen.getByText(/Model evaluation label/i)

    const decisionForm = reviewDecisionHeading.closest('form')
    const labelForm = reviewLabelHeading.closest('form')

    expect(decisionForm).toBeInTheDocument()
    expect(labelForm).toBeInTheDocument()
    expect(decisionForm).not.toBe(labelForm)

    expect(
      within(decisionForm as HTMLFormElement).getByText(
        /Official human-entered review status for this attempt\./i
      )
    ).toBeInTheDocument()
    expect(
      within(labelForm as HTMLFormElement).getByText(
        /Used for model evaluation only\. This helps compare AI signals with human review later\. It does not change the official exam result\./i
      )
    ).toBeInTheDocument()
  })

  it('changing label outcome, confidence and submitting calls onLabel with correct payload', async () => {
    const onLabel = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <ProctoringReviewPanel
        review={makeReview()}
        loading={false}
        actionLoading={false}
        onRefresh={vi.fn()}
        onRecompute={vi.fn()}
        onReview={vi.fn()}
        onLabel={onLabel}
      />
    )

    await user.selectOptions(
      screen.getByLabelText(/^Review label$/i),
      'no_action_needed' satisfies AdminProctoringReviewLabelOutcome
    )
    await user.selectOptions(
      screen.getByLabelText(/Evidence confidence/i),
      'high' satisfies AdminProctoringEvidenceConfidence
    )
    await user.type(screen.getByLabelText(/Label notes/i), 'Test label note.')
    await user.click(screen.getByRole('button', { name: /Save label/i }))

    expect(onLabel).toHaveBeenCalledWith({
      reviewOutcome: 'no_action_needed',
      evidenceConfidence: 'high',
      notes: 'Test label note.',
    })
  })

  it('empty label notes are sent as undefined', async () => {
    const onLabel = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <ProctoringReviewPanel
        review={makeReview()}
        loading={false}
        actionLoading={false}
        onRefresh={vi.fn()}
        onRecompute={vi.fn()}
        onReview={vi.fn()}
        onLabel={onLabel}
      />
    )

    await user.selectOptions(
      screen.getByLabelText(/^Review label$/i),
      'inconclusive' satisfies AdminProctoringReviewLabelOutcome
    )
    await user.selectOptions(
      screen.getByLabelText(/Evidence confidence/i),
      'low' satisfies AdminProctoringEvidenceConfidence
    )
    await user.click(screen.getByRole('button', { name: /Save label/i }))

    expect(onLabel).toHaveBeenCalledWith({
      reviewOutcome: 'inconclusive',
      evidenceConfidence: 'low',
      notes: undefined,
    })
  })

  it('existing Review decision submit still works when onLabel is present', async () => {
    const onReview = vi.fn().mockResolvedValue(undefined)
    const onLabel = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <ProctoringReviewPanel
        review={makeReview()}
        loading={false}
        actionLoading={false}
        onRefresh={vi.fn()}
        onRecompute={vi.fn()}
        onReview={onReview}
        onLabel={onLabel}
      />
    )

    await user.selectOptions(
      screen.getByLabelText(/review decision/i),
      'refer_for_policy_review'
    )
    await user.type(screen.getByLabelText(/review notes/i), 'Escalating.')
    await user.click(screen.getByRole('button', { name: /save review/i }))

    expect(onReview).toHaveBeenCalledWith({
      decision: 'refer_for_policy_review',
      notes: 'Escalating.',
    })
    expect(onLabel).not.toHaveBeenCalled()
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
      summaryText:
        'Review these signals: focus lost x1. Timeline highlights: 2026-06-12 10:00 candidate left the exam tab. Missing data: no camera continuity events.',
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

    const llmCard = getLlmSummaryCard()

    expect(within(llmCard).getByText('Narrative summary')).toBeInTheDocument()
    expect(
      within(llmCard).getByText(/use the evidence details below/i)
    ).toBeInTheDocument()
    expect(within(llmCard).getByText('Overview')).toBeInTheDocument()
    expect(within(llmCard).getByText(/focus lost x1/i)).toBeInTheDocument()
    expect(within(llmCard).getByText('Timeline highlights')).toBeInTheDocument()
    expect(
      within(llmCard).getByText(/2026-06-12 10:00 candidate left the exam tab/i)
    ).toBeInTheDocument()
    expect(within(llmCard).getByText('Missing data')).toBeInTheDocument()
    expect(
      within(llmCard).getByText(/no camera continuity events/i)
    ).toBeInTheDocument()
    expect(screen.getByText(/Validation: passed/i)).toBeInTheDocument()
    expect(screen.getByText(/focus_change: 1/i)).toBeInTheDocument()
    expect(
      screen.queryByText(/cheat|fraud|guilty|caught/i)
    ).not.toBeInTheDocument()
  })

  it('translates accepted LLM summary on demand without mutating the persisted english summary', async () => {
    const user = userEvent.setup()
    const onTranslateLlmSummary = vi
      .fn()
      .mockResolvedValue(
        'Can xem lai cac tin hieu sau: roi tab 2 lan; an tab 1 lan. Moc thoi gian noi bat: 2026-06-12 10:00 roi tab. Du lieu con thieu: khong co camera continuity.'
      )
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
      summaryText:
        'Review these signals: focus lost x2; hidden tab x1. Timeline highlights: 2026-06-12 10:00 focus lost. Missing data: no camera continuity.',
      riskFacts: [],
      citations: [],
      missingDataNotes: [],
      modelNotes: [],
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
        onTranslateLlmSummary={onTranslateLlmSummary}
      />
    )

    expect(screen.getByText(/focus lost x2/i)).toBeInTheDocument()
    expect(screen.getByText(/hidden tab x1/i)).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: /translate to vietnamese/i })
    )

    expect(onTranslateLlmSummary).toHaveBeenCalledWith({
      summaryText:
        'No structured risk facts were extracted, but the timeline still contains reviewable events. Key moments included 2026-06-12 10:00 paste. Use the evidence details below to confirm whether follow-up is needed.',
      targetLanguage: 'vi',
    })
    const llmCard = getLlmSummaryCard()
    expect(within(llmCard).getByText(/roi tab 2 lan/i)).toBeInTheDocument()
    expect(within(llmCard).getByText(/an tab 1 lan/i)).toBeInTheDocument()
    expect(within(llmCard).getByText('Timeline highlights')).toBeInTheDocument()
    expect(
      within(llmCard).getByText(/2026-06-12 10:00 focus lost/i)
    ).toBeInTheDocument()
    expect(within(llmCard).getByText(/focus lost x2/i)).toBeInTheDocument()
    expect(within(llmCard).getByText(/hidden tab x1/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /show english/i })
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /show english/i }))

    expect(screen.getByText(/focus lost x2/i)).toBeInTheDocument()
    expect(screen.queryByText(/roi tab 2 lan/i)).not.toBeInTheDocument()
  })

  it('evidence summary renders grouped readable groups with counts, latest time, labels, and badges', () => {
    const review = makeReview()
    review.timeline.items = [
      {
        id: 'event-1',
        type: 'telemetry.batch',
        eventName: 'camera_started',
        severity: 'info',
        clientSeq: 1,
        capturedAt: '2026-06-12T10:00:00.000Z',
        receivedAt: '2026-06-12T10:00:01.000Z',
        finalFlushReceiptId: null,
        payloadJson: {},
      },
      {
        id: 'event-2',
        type: 'telemetry.batch',
        eventName: 'camera_track_muted',
        severity: 'warning',
        clientSeq: 2,
        capturedAt: '2026-06-12T10:01:00.000Z',
        receivedAt: '2026-06-12T10:01:01.000Z',
        finalFlushReceiptId: null,
        payloadJson: {},
      },
      {
        id: 'event-3',
        type: 'telemetry.batch',
        eventName: 'clipboard_event',
        severity: 'info',
        clientSeq: 3,
        capturedAt: '2026-06-12T10:02:00.000Z',
        receivedAt: '2026-06-12T10:02:01.000Z',
        finalFlushReceiptId: null,
        payloadJson: { action: 'paste', textLength: 12 },
      },
      {
        id: 'event-4',
        type: 'telemetry.batch',
        eventName: 'bypass_code_used',
        severity: 'warning',
        clientSeq: 4,
        capturedAt: '2026-06-12T10:03:00.000Z',
        receivedAt: '2026-06-12T10:03:01.000Z',
        finalFlushReceiptId: null,
        payloadJson: {},
      },
    ]

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

    const summaryHeading = screen.getByText(/Evidence summary/i)
    expect(summaryHeading).toBeInTheDocument()

    const cameraCard = screen
      .getByText('Camera activity')
      .closest('.rounded-lg')
    expect(cameraCard).not.toBeNull()
    expect(cameraCard as HTMLElement).toHaveTextContent('2 events')
    expect(
      within(cameraCard as HTMLElement).getByText('Warning')
    ).toBeInTheDocument()
    expect(
      within(cameraCard as HTMLElement).getByText('Camera started')
    ).toBeInTheDocument()
    expect(
      within(cameraCard as HTMLElement).getByText('Camera was interrupted')
    ).toBeInTheDocument()
    expect(
      within(cameraCard as HTMLElement).getByText(/Latest:/i)
    ).toBeInTheDocument()

    const clipboardCard = screen
      .getByText('Clipboard activity')
      .closest('.rounded-lg')
    expect(clipboardCard).not.toBeNull()
    expect(clipboardCard as HTMLElement).toHaveTextContent('1 event')
    expect(
      within(clipboardCard as HTMLElement).getByText('Review')
    ).toBeInTheDocument()
    expect(
      within(clipboardCard as HTMLElement).getByText('Paste detected')
    ).toBeInTheDocument()

    const bypassCard = screen
      .getByText('Proctor bypass activity')
      .closest('.rounded-lg')
    expect(bypassCard).not.toBeNull()
    expect(bypassCard as HTMLElement).toHaveTextContent('1 event')
    expect(
      within(bypassCard as HTMLElement).getByText('Warning')
    ).toBeInTheDocument()
    expect(
      within(bypassCard as HTMLElement).getByText('Proctor bypass used')
    ).toBeInTheDocument()
  })

  it('shows review recommended when meaningful signals exist', () => {
    const review = makeReview()
    review.timeline.items = [
      {
        id: 'event-1',
        type: 'telemetry.batch',
        eventName: 'camera_track_muted',
        severity: 'warning',
        clientSeq: 1,
        capturedAt: '2026-06-12T10:00:00.000Z',
        receivedAt: '2026-06-12T10:00:01.000Z',
        finalFlushReceiptId: null,
        payloadJson: {},
      },
    ]

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

    const card = screen.getByText('Review attention').closest('.rounded-lg')
    expect(card).not.toBeNull()
    expect(card as HTMLElement).toHaveTextContent('Review recommended')
    expect(card as HTMLElement).toHaveTextContent(
      'Several browser or device signals changed during the session. Human review is required before any decision.'
    )
    expect(card as HTMLElement).not.toHaveTextContent(
      /cheating|fraud|caught|suspicious/i
    )
  })

  it('shows no immediate review attention when no meaningful signals exist', () => {
    const review = makeReview()
    review.timeline.items = [
      {
        id: 'event-1',
        type: 'telemetry.batch',
        eventName: 'camera_started',
        severity: 'info',
        clientSeq: 1,
        capturedAt: '2026-06-12T10:00:00.000Z',
        receivedAt: '2026-06-12T10:00:01.000Z',
        finalFlushReceiptId: null,
        payloadJson: {},
      },
      {
        id: 'event-2',
        type: 'telemetry.batch',
        eventName: 'camera_track_unmuted',
        severity: 'info',
        clientSeq: 2,
        capturedAt: '2026-06-12T10:01:00.000Z',
        receivedAt: '2026-06-12T10:01:01.000Z',
        finalFlushReceiptId: null,
        payloadJson: {},
      },
    ]

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

    const card = screen.getByText('Review attention').closest('.rounded-lg')
    expect(card).not.toBeNull()
    expect(card as HTMLElement).toHaveTextContent(
      'No immediate review attention'
    )
    expect(card as HTMLElement).toHaveTextContent(
      'No notable browser or device interruptions were recorded.'
    )
  })

  it('falls back to evidence final flush status when summary status is missing', () => {
    const review = makeReview()
    if (review.summary) {
      review.summary.finalFlushStatus = null
    }
    review.evidence.finalFlush = [
      {
        id: 'receipt-1',
        status: 'persisted',
        updatedAt: '2026-06-12T10:02:00.000Z',
      },
    ]

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

    expect(screen.getByText(/^Final flush$/i)).toBeInTheDocument()
    expect(screen.getAllByText(/persisted/i).length).toBeGreaterThan(0)
  })

  it('explains when LLM summary is unavailable instead of accepted', () => {
    const review = makeReview()
    review.llmSummary = {
      visible: false,
      status: 'unavailable',
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

    expect(
      screen.getByText(
        /No accepted LLM summary has been generated for this participation yet\. Use Recompute to queue one\./i
      )
    ).toBeInTheDocument()
  })

  it('review attention card does not change the official review decision', async () => {
    const onReview = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    const review = makeReview()
    if (review.summary) review.summary.reviewerDecision = 'needs_re_review'
    review.timeline.items = [
      {
        id: 'event-1',
        type: 'telemetry.batch',
        eventName: 'clipboard_event',
        severity: 'info',
        clientSeq: 1,
        capturedAt: '2026-06-12T10:00:00.000Z',
        receivedAt: '2026-06-12T10:00:01.000Z',
        finalFlushReceiptId: null,
        payloadJson: { action: 'paste' },
      },
    ]

    render(
      <ProctoringReviewPanel
        review={review}
        loading={false}
        actionLoading={false}
        onRefresh={vi.fn()}
        onRecompute={vi.fn()}
        onReview={onReview}
      />
    )

    expect(screen.getByLabelText(/review decision/i)).toHaveValue(
      'needs_re_review'
    )
    expect(screen.getByText(/Review recommended/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /save review/i }))

    expect(onReview).toHaveBeenCalledWith({
      decision: 'needs_re_review',
      notes: undefined,
    })
  })

  it('raw JSON payload is not visible by default in the notable events list', () => {
    const review = makeReview()
    review.timeline.items = [
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
    ]

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

    // Human-readable label is visible
    expect(screen.getAllByText(/Paste/i).length).toBeGreaterThan(0)

    // Raw JSON is NOT visible by default
    expect(screen.queryByText(/textLength/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\{"eventName":/i)).not.toBeInTheDocument()
  })

  it('summary is shown before technical event log and raw JSON is revealed only when expanded', async () => {
    const user = userEvent.setup()
    const review = makeReview()
    review.timeline.items = [
      {
        id: 'event-1',
        type: 'telemetry.batch',
        eventName: 'clipboard_event',
        severity: 'info',
        clientSeq: 1,
        capturedAt: '2026-06-12T10:00:00.000Z',
        receivedAt: '2026-06-12T10:00:01.000Z',
        finalFlushReceiptId: 'receipt-1',
        payloadJson: {
          eventName: 'clipboard_event',
          action: 'paste',
          textLength: 12,
        },
      },
    ]

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

    const summaryHeading = screen.getByText(/Evidence summary/i)
    const technicalLogButton = screen.getByRole('button', {
      name: /Technical event log/i,
    })

    expect(summaryHeading).toBeInTheDocument()
    expect(technicalLogButton).toBeInTheDocument()
    expect(summaryHeading.compareDocumentPosition(technicalLogButton)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )

    // Raw JSON is hidden initially
    expect(screen.queryByText(/textLength/)).not.toBeInTheDocument()

    // Click to expand
    await user.click(technicalLogButton)

    // Raw JSON is now visible
    expect(screen.getByText(/textLength/)).toBeInTheDocument()
    expect(
      screen.getByText(
        /\{"eventName":"clipboard_event","action":"paste","textLength":12\}/
      )
    ).toBeInTheDocument()
  })
})

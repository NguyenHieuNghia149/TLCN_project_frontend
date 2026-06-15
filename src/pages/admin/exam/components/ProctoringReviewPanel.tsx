import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'

import Button from '@/components/common/Button/Button'
import type {
  AdminProctoringReview,
  AdminProctoringReviewDecision,
} from '@/types/exam.types'

type ProctoringReviewPanelProps = {
  review: AdminProctoringReview | null
  loading: boolean
  actionLoading: boolean
  onRefresh: () => void
  onRecompute: () => void
  onReview: (payload: {
    decision: AdminProctoringReviewDecision
    notes?: string
  }) => Promise<void> | void
}

const decisionLabels: Record<AdminProctoringReviewDecision, string> = {
  pending: 'Pending review',
  no_action: 'No action needed',
  needs_re_review: 'Needs another review',
  refer_for_policy_review: 'Refer for policy review',
}

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString() : '--'
}

function compactJson(value: unknown) {
  if (!value || typeof value !== 'object') {
    return '--'
  }
  return JSON.stringify(value)
}

function formatScore(value: number | undefined) {
  return typeof value === 'number' ? value.toFixed(2) : '--'
}

const ProctoringReviewPanel: React.FC<ProctoringReviewPanelProps> = ({
  review,
  loading,
  actionLoading,
  onRefresh,
  onRecompute,
  onReview,
}) => {
  const [decision, setDecision] =
    useState<AdminProctoringReviewDecision>('pending')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const currentDecision = review?.summary?.reviewerDecision
    if (
      currentDecision === 'pending' ||
      currentDecision === 'no_action' ||
      currentDecision === 'needs_re_review' ||
      currentDecision === 'refer_for_policy_review'
    ) {
      setDecision(currentDecision)
    }
    setNotes(review?.summary?.reviewerNotes ?? '')
  }, [review?.summary?.reviewerDecision, review?.summary?.reviewerNotes])

  const evidenceCounts = useMemo(() => {
    return {
      consent: review?.evidence.consent.length ?? 0,
      precheck: review?.evidence.precheck.length ?? 0,
      bypass: review?.evidence.bypass.length ?? 0,
      finalFlush: review?.evidence.finalFlush.length ?? 0,
      dataRequests: review?.evidence.dataRequests.length ?? 0,
    }
  }, [review])

  if (loading) {
    return (
      <section className="rounded-xl border p-4">
        <p className="text-sm">Loading proctoring review...</p>
      </section>
    )
  }

  if (!review) {
    return (
      <section className="rounded-xl border p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm">No deterministic proctoring evidence found.</p>
          <Button size="sm" variant="secondary" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </section>
    )
  }

  const summary = review.summary

  return (
    <section className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">
            Deterministic proctoring review
          </h3>
          <p className="mt-1 text-xs opacity-75">
            Browser metadata evidence only. Review decisions are human-entered.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={actionLoading}
            onClick={onRefresh}
          >
            <span className="inline-flex items-center gap-2">
              <RefreshCw size={14} />
              Refresh
            </span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={actionLoading}
            onClick={onRecompute}
          >
            Recompute
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border p-3">
          <p className="text-xs uppercase opacity-70">Risk level</p>
          <p className="mt-1 text-lg font-semibold">
            {summary?.riskLevel ?? '--'}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs uppercase opacity-70">Risk score</p>
          <p className="mt-1 text-lg font-semibold">
            {summary?.riskScore ?? '--'}
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-xs uppercase opacity-70">Final flush</p>
          <p className="mt-1 text-lg font-semibold">
            {summary?.finalFlushStatus ?? '--'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs md:grid-cols-5">
        <span>Consent: {evidenceCounts.consent}</span>
        <span>Precheck: {evidenceCounts.precheck}</span>
        <span>Bypass: {evidenceCounts.bypass}</span>
        <span>Final flush: {evidenceCounts.finalFlush}</span>
        <span>Data requests: {evidenceCounts.dataRequests}</span>
      </div>

      {review.aiAdvisory ? (
        <div className="mt-4 rounded-lg border p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">AI advisory signal</p>
              <p className="mt-1 text-xs opacity-75">
                Advisory only. Human review remains required.
              </p>
            </div>
            <span className="text-xs opacity-70">
              {review.aiAdvisory.visible
                ? review.aiAdvisory.status
                : review.aiAdvisory.status.replace(/_/g, ' ')}
            </span>
          </div>
          {review.aiAdvisory.visible ? (
            <div className="mt-3 grid gap-3">
              <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-3">
                <span>Model: {review.aiAdvisory.modelVersion ?? '--'}</span>
                <span>
                  Max anomaly score:{' '}
                  {formatScore(review.aiAdvisory.maxAnomalyScore)}
                </span>
                <span>
                  Latest advisory level:{' '}
                  {review.aiAdvisory.latestRiskLevel ?? '--'}
                </span>
              </div>
              {review.aiAdvisory.windows.length > 0 ? (
                <div className="space-y-2">
                  {review.aiAdvisory.windows.map(window => (
                    <article
                      key={`${window.windowId}-${window.riskLevel}`}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">
                          {window.riskLevel} window
                        </span>
                        <span className="text-xs opacity-70">
                          {formatScore(window.anomalyScore)} -{' '}
                          {window.explanationStatus}
                        </span>
                      </div>
                      {window.topContributors.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs">
                          {window.topContributors.map(contributor => (
                            <li key={contributor.featureName}>
                              {contributor.displayLabel}:{' '}
                              {contributor.numericValue}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm opacity-75">
                  No high or critical advisory windows available.
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm opacity-75">
              Advisory signal is hidden for this review state.
            </p>
          )}
        </div>
      ) : null}

      {review.llmSummary ? (
        <div className="mt-4 rounded-lg border p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">LLM review summary</p>
              <p className="mt-1 text-xs opacity-75">
                Assistive summary only. Human review remains required.
              </p>
            </div>
            <span className="text-xs opacity-70">
              {review.llmSummary.status.replace(/_/g, ' ')}
            </span>
          </div>
          {!review.llmSummary.visible ? (
            <p className="mt-3 text-sm opacity-75">
              {review.llmSummary.status === 'hidden_disabled'
                ? 'Summary generation is disabled.'
                : 'Summary is hidden for this review state.'}
            </p>
          ) : review.llmSummary.status === 'accepted' ? (
            <div className="mt-3 grid gap-3 text-sm">
              <p>{review.llmSummary.summaryText ?? '--'}</p>
              <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-3">
                <span>Model: {review.llmSummary.modelVersion ?? '--'}</span>
                <span>
                  Validation: {review.llmSummary.validationStatus ?? '--'}
                </span>
                <span>
                  Score:{' '}
                  {formatScore(review.llmSummary.validationScore ?? undefined)}
                </span>
              </div>
              {review.llmSummary.riskFacts.length > 0 ? (
                <ul className="space-y-1 text-xs">
                  {review.llmSummary.riskFacts.map(fact => (
                    <li key={`${fact.type}-${fact.count}`}>
                      {fact.type}: {fact.count}
                    </li>
                  ))}
                </ul>
              ) : null}
              {review.llmSummary.citations.length > 0 ? (
                <p className="text-xs opacity-75">
                  Citations:{' '}
                  {review.llmSummary.citations
                    .map(citation => citation.eventId)
                    .join(', ')}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm opacity-75">
              Generated output failed validation and is not shown as an accepted
              summary.
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-sm font-semibold">Timeline</p>
        {review.timeline.items.length === 0 ? (
          <p className="mt-2 text-sm opacity-75">No timeline events found.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {review.timeline.items.map(item => (
              <article key={item.id} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{item.eventName}</span>
                  <span className="text-xs opacity-70">
                    Seq {item.clientSeq} - {formatDate(item.capturedAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs opacity-75">
                  {item.severity} - {compactJson(item.payloadJson)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      <form
        className="mt-4 grid gap-3"
        onSubmit={event => {
          event.preventDefault()
          void onReview({
            decision,
            notes: notes.trim() || undefined,
          })
        }}
      >
        <label className="grid gap-1 text-sm">
          Review decision
          <select
            className="rounded-lg border px-3 py-2"
            value={decision}
            onChange={event =>
              setDecision(event.target.value as AdminProctoringReviewDecision)
            }
            aria-label="Review decision"
          >
            {Object.entries(decisionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Review notes
          <textarea
            className="min-h-24 rounded-lg border px-3 py-2"
            value={notes}
            onChange={event => setNotes(event.target.value)}
            aria-label="Review notes"
          />
        </label>
        <div>
          <Button type="submit" size="sm" disabled={actionLoading}>
            Save review
          </Button>
        </div>
      </form>
    </section>
  )
}

export default ProctoringReviewPanel

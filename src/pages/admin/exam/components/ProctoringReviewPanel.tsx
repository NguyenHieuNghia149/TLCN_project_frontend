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

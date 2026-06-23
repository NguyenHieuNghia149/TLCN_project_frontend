import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'

import Button from '@/components/common/Button/Button'
import type {
  AdminProctoringEvidenceConfidence,
  AdminProctoringReview,
  AdminProctoringReviewDecision,
  AdminProctoringReviewLabelOutcome,
} from '@/types/exam.types'

type ProctoringReviewPanelProps = {
  review: AdminProctoringReview | null
  loading: boolean
  actionLoading: boolean
  actionStatus?: {
    type: 'success' | 'error'
    message: string
  } | null
  onRefresh: () => void
  onRecompute: () => void
  onReview: (payload: {
    decision: AdminProctoringReviewDecision
    notes?: string
  }) => Promise<void> | void
  onLabel?: (payload: {
    reviewOutcome: AdminProctoringReviewLabelOutcome
    evidenceConfidence: AdminProctoringEvidenceConfidence
    notes?: string
  }) => Promise<void> | void
  onTranslateLlmSummary?: (payload: {
    summaryText: string
    targetLanguage: 'vi'
  }) => Promise<string> | string
}

type CategoryInfo = {
  key: string
  label: string
  count: number
  status: 'info' | 'review' | 'warning'
  latestTimestamp: string | null
  details: Array<{
    key: string
    label: string
    count: number
  }>
}

type ReviewTimelineItem =
  NonNullable<AdminProctoringReview>['timeline']['items'][number]

const reviewLabelOutcomeLabels: Record<
  AdminProctoringReviewLabelOutcome,
  string
> = {
  no_action_needed: 'No action needed',
  follow_up_required: 'Follow-up required',
  policy_review_required: 'Policy review required',
  inconclusive: 'Inconclusive',
}

const evidenceConfidenceLabels: Record<
  AdminProctoringEvidenceConfidence,
  string
> = {
  low: 'Low confidence',
  medium: 'Medium confidence',
  high: 'High confidence',
}

const decisionLabels: Record<AdminProctoringReviewDecision, string> = {
  pending: 'Pending review',
  no_action: 'No action needed',
  needs_re_review: 'Needs another review',
  refer_for_policy_review: 'Refer for policy review',
}

const EVENT_CATEGORIES: Array<{
  pattern: RegExp
  key: string
  label: string
  status: 'info' | 'review' | 'warning'
}> = [
  {
    pattern: /^camera_/,
    key: 'camera',
    label: 'Camera activity',
    status: 'info',
  },
  {
    pattern: /^focus_/,
    key: 'focus',
    label: 'Exam tab focus changes',
    status: 'review',
  },
  {
    pattern: /^visibility_/,
    key: 'visibility',
    label: 'Exam tab visibility changes',
    status: 'review',
  },
  {
    pattern: /^fullscreen_/,
    key: 'fullscreen',
    label: 'Fullscreen activity',
    status: 'info',
  },
  {
    pattern: /^(clipboard_|paste|copy|cut)/,
    key: 'clipboard',
    label: 'Clipboard activity',
    status: 'review',
  },
  {
    pattern: /^bypass_code_used$/,
    key: 'bypass',
    label: 'Proctor bypass activity',
    status: 'warning',
  },
  {
    pattern: /^final_flush/,
    key: 'final_flush',
    label: 'Final telemetry sync',
    status: 'info',
  },
  {
    pattern: /^(heartbeat|network_)/,
    key: 'connection',
    label: 'Connection health',
    status: 'info',
  },
]

const EVENT_LABELS: Record<string, string> = {
  focus_lost: 'Candidate left the exam tab',
  focus_returned: 'Candidate returned to the exam tab',
  visibility_visible: 'Exam tab became visible',
  visibility_hidden: 'Exam tab was hidden',
  fullscreen_enter: 'Fullscreen mode started',
  fullscreen_exit: 'Fullscreen mode ended',
  camera_started: 'Camera started',
  camera_stopped: 'Camera stopped',
  camera_permission_denied: 'Camera permission denied',
  camera_track_muted: 'Camera was interrupted',
  camera_track_unmuted: 'Camera resumed',
  camera_error: 'Camera error',
  bypass_code_used: 'Proctor bypass used',
  final_flush: 'Final telemetry sync before submit',
  'final_flush.request': 'Final telemetry sync before submit',
}

const STATUS_ORDER: Record<CategoryInfo['status'], number> = {
  warning: 0,
  review: 1,
  info: 2,
}

const REVIEW_ATTENTION_EVENT_NAMES = new Set([
  'camera_stopped',
  'camera_track_muted',
  'camera_error',
  'camera_permission_denied',
  'clipboard_event',
  'bypass_code_used',
  'focus_lost',
  'visibility_hidden',
  'fullscreen_exit',
  'screen_share_ended',
])

function findCategory(eventName: string): (typeof EVENT_CATEGORIES)[number] {
  for (const cat of EVENT_CATEGORIES) {
    if (cat.pattern.test(eventName)) return cat
  }
  return {
    pattern: /.*/,
    key: 'other',
    label: 'Other browser event',
    status: 'info',
  }
}

function getClipboardActionLabel(
  payloadJson: Record<string, unknown>
): string | null {
  const action = payloadJson.action
  if (action === 'paste') return 'Paste detected'
  if (action === 'copy') return 'Copy detected'
  if (action === 'cut') return 'Cut detected'
  return null
}

function getEvidenceEventLabel(item: ReviewTimelineItem): string {
  if (item.eventName === 'clipboard_event') {
    return getClipboardActionLabel(item.payloadJson) ?? 'Clipboard activity'
  }

  return getEventLabel(item.eventName)
}

function getEvidenceEventStatus(
  item: ReviewTimelineItem
): CategoryInfo['status'] {
  if (
    item.eventName === 'camera_stopped' ||
    item.eventName === 'camera_track_muted' ||
    item.eventName === 'camera_error' ||
    item.eventName === 'camera_permission_denied' ||
    item.eventName === 'bypass_code_used'
  ) {
    return 'warning'
  }

  if (item.eventName === 'clipboard_event') {
    return 'review'
  }

  return findCategory(item.eventName).status
}

function getEventLabel(eventName: string): string {
  return (
    EVENT_LABELS[eventName] ??
    eventName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  )
}

function formatDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString() : '--'
}

function formatScore(value: number | undefined) {
  return typeof value === 'number' ? value.toFixed(2) : '--'
}

function getRiskTone(riskLevel: string | null | undefined) {
  const normalized = String(riskLevel ?? '').toLowerCase()
  if (normalized === 'critical') {
    return {
      card: 'border-rose-300 bg-rose-50',
      text: 'text-rose-700',
      badge: 'Critical',
      badgeClass: 'bg-rose-100 text-rose-700',
    }
  }
  if (normalized === 'high') {
    return {
      card: 'border-amber-300 bg-amber-50',
      text: 'text-amber-700',
      badge: 'High',
      badgeClass: 'bg-amber-100 text-amber-700',
    }
  }
  if (normalized === 'medium') {
    return {
      card: 'border-sky-300 bg-sky-50',
      text: 'text-sky-700',
      badge: 'Medium',
      badgeClass: 'bg-sky-100 text-sky-700',
    }
  }
  return {
    card: 'border-emerald-300 bg-emerald-50',
    text: 'text-emerald-700',
    badge: 'Low',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  }
}

function getFinalFlushStatusLabel(review: AdminProctoringReview | null) {
  if (review?.summary?.finalFlushStatus) {
    return review.summary.finalFlushStatus
  }

  const receipts = Array.isArray(review?.evidence?.finalFlush)
    ? review?.evidence?.finalFlush
    : []
  const latestReceipt = [...receipts]
    .filter(
      item =>
        item && typeof item === 'object' && typeof item.status === 'string'
    )
    .sort((a, b) => {
      const aTime =
        typeof a.updatedAt === 'string'
          ? a.updatedAt
          : typeof a.createdAt === 'string'
            ? a.createdAt
            : ''
      const bTime =
        typeof b.updatedAt === 'string'
          ? b.updatedAt
          : typeof b.createdAt === 'string'
            ? b.createdAt
            : ''
      return bTime.localeCompare(aTime)
    })[0]

  return typeof latestReceipt?.status === 'string' ? latestReceipt.status : '--'
}

const ProctoringReviewPanel: React.FC<ProctoringReviewPanelProps> = ({
  review,
  loading,
  actionLoading,
  actionStatus,
  onRefresh,
  onRecompute,
  onReview,
  onLabel,
  onTranslateLlmSummary,
}) => {
  const [decision, setDecision] =
    useState<AdminProctoringReviewDecision>('pending')
  const [notes, setNotes] = useState('')
  const [reviewOutcome, setReviewOutcome] =
    useState<AdminProctoringReviewLabelOutcome>('inconclusive')
  const [evidenceConfidence, setEvidenceConfidence] =
    useState<AdminProctoringEvidenceConfidence>('medium')
  const [labelNotes, setLabelNotes] = useState('')
  const [technicalLogOpen, setTechnicalLogOpen] = useState(false)
  const [translatedLlmSummaryText, setTranslatedLlmSummaryText] = useState<
    string | null
  >(null)
  const [showTranslatedLlmSummary, setShowTranslatedLlmSummary] =
    useState(false)
  const [translationLoading, setTranslationLoading] = useState(false)
  const [translationError, setTranslationError] = useState<string | null>(null)

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

    const currentLabel = review?.reviewLabel
    if (currentLabel) {
      setReviewOutcome(currentLabel.reviewOutcome)
      setEvidenceConfidence(currentLabel.evidenceConfidence)
      setLabelNotes(currentLabel.notes ?? '')
    } else {
      setReviewOutcome('inconclusive')
      setEvidenceConfidence('medium')
      setLabelNotes('')
    }
  }, [
    review?.summary?.reviewerDecision,
    review?.summary?.reviewerNotes,
    review?.reviewLabel,
  ])

  useEffect(() => {
    setTranslatedLlmSummaryText(null)
    setShowTranslatedLlmSummary(false)
    setTranslationLoading(false)
    setTranslationError(null)
  }, [review?.llmSummary?.summaryId, review?.llmSummary?.summaryText])

  const categorizedEvents: CategoryInfo[] = useMemo(() => {
    const items = review?.timeline?.items ?? []
    const bypassRecords = review?.evidence?.bypass ?? []
    const groups = new Map<
      string,
      {
        key: string
        label: string
        count: number
        status: CategoryInfo['status']
        latestTimestamp: string | null
        details: Map<string, { key: string; label: string; count: number }>
      }
    >()

    for (const item of items) {
      const cat = findCategory(item.eventName)
      const itemStatus = getEvidenceEventStatus(item)
      const detailLabel = getEvidenceEventLabel(item)
      const detailKey = `${item.eventName}:${detailLabel}`
      const existing = groups.get(cat.key) ?? {
        key: cat.key,
        label: cat.label,
        count: 0,
        status: cat.status,
        latestTimestamp: null as string | null,
        details: new Map<
          string,
          { key: string; label: string; count: number }
        >(),
      }
      existing.count++
      if (STATUS_ORDER[itemStatus] < STATUS_ORDER[existing.status]) {
        existing.status = itemStatus
      }
      if (
        item.capturedAt &&
        (!existing.latestTimestamp ||
          item.capturedAt > existing.latestTimestamp)
      ) {
        existing.latestTimestamp = item.capturedAt
      }
      const detail = existing.details.get(detailKey) ?? {
        key: detailKey,
        label: detailLabel,
        count: 0,
      }
      detail.count++
      existing.details.set(detailKey, detail)
      groups.set(cat.key, existing)
    }

    for (const bypass of bypassRecords) {
      const bypassKey = 'bypass'
      const bypassId = String(bypass.bypassCodeId ?? '')
      const bypassTime =
        typeof bypass.usedAt === 'string' ? bypass.usedAt : null
      const existing = groups.get(bypassKey) ?? {
        key: bypassKey,
        label: 'Proctor bypass activity',
        count: 0,
        status: 'warning' as CategoryInfo['status'],
        latestTimestamp: null as string | null,
        details: new Map<
          string,
          { key: string; label: string; count: number }
        >(),
      }
      existing.count++
      const detailKey = `bypass:${bypassId || 'unknown'}`
      const detail = existing.details.get(detailKey) ?? {
        key: detailKey,
        label: `Proctor bypass used${bypassTime ? ` (${new Date(bypassTime).toLocaleString()})` : ''}`,
        count: 0,
      }
      detail.count++
      existing.details.set(detailKey, detail)
      if (
        bypassTime &&
        (!existing.latestTimestamp || bypassTime > existing.latestTimestamp)
      ) {
        existing.latestTimestamp = bypassTime
      }
      groups.set(bypassKey, existing)
    }

    return Array.from(groups.values())
      .map(group => ({
        key: group.key,
        label: group.label,
        count: group.count,
        status: group.status,
        latestTimestamp: group.latestTimestamp,
        details: Array.from(group.details.values()).sort(
          (a, b) => b.count - a.count || a.label.localeCompare(b.label)
        ),
      }))
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  }, [review])

  const notableEvents = useMemo(() => {
    const items = review?.timeline?.items ?? []
    return [...items]
      .sort((a, b) => {
        const aTime = a.capturedAt ?? ''
        const bTime = b.capturedAt ?? ''
        return bTime.localeCompare(aTime) || b.clientSeq - a.clientSeq
      })
      .slice(0, 10)
  }, [review])

  const hasReviewAttentionSignals = useMemo(() => {
    const items = review?.timeline?.items ?? []
    const hasAttentionEvent = items.some(item =>
      REVIEW_ATTENTION_EVENT_NAMES.has(item.eventName)
    )
    const hasHighRisk =
      review?.summary?.riskLevel === 'high' ||
      review?.summary?.riskLevel === 'critical'
    const hasBypassRecord = (review?.evidence?.bypass ?? []).length > 0
    return hasAttentionEvent || hasHighRisk || hasBypassRecord
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
  const riskTone = getRiskTone(summary?.riskLevel)
  const finalFlushStatus = getFinalFlushStatusLabel(review)
  const sourceLlmSummaryText = review?.llmSummary?.summaryText ?? null
  const displayedLlmSummaryText =
    showTranslatedLlmSummary && translatedLlmSummaryText
      ? translatedLlmSummaryText
      : (sourceLlmSummaryText ?? '--')

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

      {actionStatus ? (
        <div
          className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
            actionStatus.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
          role="status"
        >
          {actionStatus.message}
        </div>
      ) : null}

      <section className="mt-4 rounded-2xl border p-4">
        <p className="text-sm font-semibold">Overview</p>
        <p className="mt-1 text-xs opacity-75">
          Fast triage summary for reviewers before reading deeper evidence.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className={`rounded-lg border p-3 ${riskTone.card}`}>
            <p className="text-xs uppercase opacity-70">Risk level</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${riskTone.badgeClass}`}
              >
                {riskTone.badge}
              </span>
            </div>
            <p className={`mt-2 text-lg font-semibold ${riskTone.text}`}>
              {summary?.riskLevel ?? '--'}
            </p>
          </div>
          <div className={`rounded-lg border p-3 ${riskTone.card}`}>
            <p className="text-xs uppercase opacity-70">Risk score</p>
            <p className={`mt-2 text-lg font-semibold ${riskTone.text}`}>
              {summary?.riskScore ?? '--'}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase opacity-70">Final flush</p>
            <p className="mt-1 text-lg font-semibold">{finalFlushStatus}</p>
          </div>
        </div>

        <div
          className={`mt-4 rounded-lg border p-3 ${
            hasReviewAttentionSignals
              ? 'border-amber-200 bg-amber-50/80'
              : 'border-emerald-200 bg-emerald-50/70'
          }`}
        >
          <p className="text-sm font-semibold">Review attention</p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {hasReviewAttentionSignals
              ? 'Review recommended'
              : 'No immediate review attention'}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {hasReviewAttentionSignals
              ? 'Several browser or device signals changed during the session. Human review is required before any decision.'
              : 'No notable browser or device interruptions were recorded.'}
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border p-4">
        <p className="text-sm font-semibold">Evidence</p>
        <p className="mt-1 text-xs opacity-75">
          Grouped telemetry evidence, recent highlights, and the raw technical
          log.
        </p>

        {/* Evidence summary */}
        {categorizedEvents.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold">Evidence summary</p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categorizedEvents.map(cat => (
                <div key={cat.key} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{cat.label}</span>
                    {cat.status === 'warning' && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        Warning
                      </span>
                    )}
                    {cat.status === 'review' && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                        Review
                      </span>
                    )}
                    {cat.status === 'info' && (
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        Info
                      </span>
                    )}
                  </div>
                  <p className="mt-1 opacity-75">
                    {cat.count} event{cat.count !== 1 ? 's' : ''}
                  </p>
                  {cat.latestTimestamp && (
                    <p className="opacity-60">
                      Latest: {formatDate(cat.latestTimestamp)}
                    </p>
                  )}
                  <div className="mt-2 space-y-1">
                    {cat.details.map(detail => (
                      <p
                        key={detail.key}
                        className="flex items-start justify-between gap-2 opacity-80"
                      >
                        <span>{detail.label}</span>
                        <span className="whitespace-nowrap opacity-60">
                          {detail.count}x
                        </span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notable events */}
        {notableEvents.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold">Notable events</p>
            <p className="mt-0.5 text-xs opacity-75">
              Showing the {Math.min(notableEvents.length, 10)} most recent event
              {notableEvents.length !== 1 ? 's' : ''}.
            </p>
            <div className="mt-2 space-y-1">
              {notableEvents.map(item => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-xs"
                >
                  <span className="font-medium">
                    {getEvidenceEventLabel(item)}
                  </span>
                  <span className="opacity-60">
                    Seq {item.clientSeq} - {formatDate(item.capturedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical event log (collapsible) */}
        {review.timeline.items.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg border p-3 text-left text-sm font-semibold hover:bg-gray-50"
              onClick={() => setTechnicalLogOpen(o => !o)}
            >
              {technicalLogOpen ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              Technical event log ({review.timeline.items.length} events)
            </button>
            {technicalLogOpen && (
              <div className="mt-2 space-y-2">
                {review.timeline.items.map(item => (
                  <article
                    key={item.id}
                    className="rounded-lg border p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{item.eventName}</span>
                      <span className="text-xs opacity-70">
                        Seq {item.clientSeq} - {formatDate(item.capturedAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs opacity-75">
                      {item.severity} -{' '}
                      {item.payloadJson &&
                      typeof item.payloadJson === 'object' &&
                      Object.keys(item.payloadJson).length > 0
                        ? JSON.stringify(item.payloadJson)
                        : '--'}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mt-4 rounded-2xl border p-4">
        <p className="text-sm font-semibold">AI Summary</p>
        <p className="mt-1 text-xs opacity-75">
          Assistive AI layers only. Final review decisions remain human-entered.
        </p>

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
                {review.aiAdvisory.status === 'hidden_shadow_mode'
                  ? 'AI advisory is hidden because shadow mode is enabled.'
                  : 'AI advisory is hidden until visibility gates pass.'}
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
                  ? 'Summary generation is disabled in current proctoring settings.'
                  : review.llmSummary.status === 'unavailable'
                    ? 'No accepted LLM summary has been generated for this participation yet. Use Recompute to queue one.'
                    : 'Summary is hidden for this review state.'}
              </p>
            ) : review.llmSummary.status === 'accepted' ? (
              <div className="mt-3 grid gap-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p>{displayedLlmSummaryText}</p>
                  {onTranslateLlmSummary && sourceLlmSummaryText ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={actionLoading || translationLoading}
                      onClick={() => {
                        if (showTranslatedLlmSummary) {
                          setShowTranslatedLlmSummary(false)
                          setTranslationError(null)
                          return
                        }

                        if (translatedLlmSummaryText) {
                          setShowTranslatedLlmSummary(true)
                          setTranslationError(null)
                          return
                        }

                        setTranslationLoading(true)
                        setTranslationError(null)
                        Promise.resolve(
                          onTranslateLlmSummary({
                            summaryText: sourceLlmSummaryText,
                            targetLanguage: 'vi',
                          })
                        )
                          .then(translatedText => {
                            setTranslatedLlmSummaryText(translatedText)
                            setShowTranslatedLlmSummary(true)
                          })
                          .catch((error: unknown) => {
                            setTranslationError(
                              error instanceof Error && error.message.trim()
                                ? error.message
                                : 'Unable to translate this summary right now.'
                            )
                          })
                          .finally(() => {
                            setTranslationLoading(false)
                          })
                      }}
                    >
                      {translationLoading
                        ? 'Translating...'
                        : showTranslatedLlmSummary
                          ? 'Show English'
                          : 'Translate to Vietnamese'}
                    </Button>
                  ) : null}
                </div>
                {translationError ? (
                  <p className="text-xs text-rose-700">{translationError}</p>
                ) : null}
                <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-3">
                  <span>Model: {review.llmSummary.modelVersion ?? '--'}</span>
                  <span>
                    Validation: {review.llmSummary.validationStatus ?? '--'}
                  </span>
                  <span>
                    Score:{' '}
                    {formatScore(
                      review.llmSummary.validationScore ?? undefined
                    )}
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
                Generated output failed validation and is not shown as an
                accepted summary.
              </p>
            )}
          </div>
        ) : null}
      </section>

      {/* Official review decision — moved above model evaluation label */}
      <form
        className="mt-4 grid gap-3 rounded-lg border p-4"
        onSubmit={event => {
          event.preventDefault()
          void onReview({
            decision,
            notes: notes.trim() || undefined,
          })
        }}
      >
        <div>
          <p className="text-sm font-semibold">Official review decision</p>
          <p className="mt-0.5 text-xs opacity-75">
            Official human-entered review status for this attempt.
          </p>
        </div>
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

      {/* Model evaluation label — moved below official review decision */}
      <form
        className="mt-4 grid gap-3 rounded-lg border p-4"
        onSubmit={event => {
          event.preventDefault()
          void onLabel?.({
            reviewOutcome,
            evidenceConfidence,
            notes: labelNotes.trim() || undefined,
          })
        }}
      >
        <div>
          <p className="text-sm font-semibold">Model evaluation label</p>
          <p className="mt-0.5 text-xs opacity-75">
            Used for model evaluation only. This helps compare AI signals with
            human review later. It does not change the official exam result.
          </p>
        </div>
        <label className="grid gap-1 text-sm">
          Review label
          <select
            className="rounded-lg border px-3 py-2"
            value={reviewOutcome}
            onChange={event =>
              setReviewOutcome(
                event.target.value as AdminProctoringReviewLabelOutcome
              )
            }
            aria-label="Review label"
          >
            {Object.entries(reviewLabelOutcomeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Evidence confidence
          <select
            className="rounded-lg border px-3 py-2"
            value={evidenceConfidence}
            onChange={event =>
              setEvidenceConfidence(
                event.target.value as AdminProctoringEvidenceConfidence
              )
            }
            aria-label="Evidence confidence"
          >
            {Object.entries(evidenceConfidenceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Label notes
          <textarea
            className="min-h-24 rounded-lg border px-3 py-2"
            value={labelNotes}
            onChange={event => setLabelNotes(event.target.value)}
            aria-label="Label notes"
          />
        </label>
        <div>
          <Button type="submit" size="sm" disabled={actionLoading || !onLabel}>
            Save label
          </Button>
        </div>
      </form>
    </section>
  )
}

export default ProctoringReviewPanel

import type { ExamAccessState, PublicExamLanding } from '@/types/exam.types'

export type EntryReason = {
  key:
    | 'exam_cancelled'
    | 'access_revoked'
    | 'approval_pending'
    | 'approval_rejected'
    | 'exam_not_started'
    | 'exam_ended'
    | 'attempts_exhausted'
    | 'entry_session_expired'
  label: string
  priority: number
}

export type EntryPanelKind = 'verification' | 'lobby' | 'expired' | 'none'

export function resolveEntryPanelKind(
  entrySessionStatus: ExamAccessState['entrySessionStatus']
): EntryPanelKind {
  if (entrySessionStatus === 'opened' || entrySessionStatus === 'verified') {
    return 'verification'
  }
  if (entrySessionStatus === 'eligible' || entrySessionStatus === 'started') {
    return 'lobby'
  }
  if (entrySessionStatus === 'expired') {
    return 'expired'
  }
  return 'none'
}

export function computeEntryBlockReasons(
  exam: PublicExamLanding | null,
  accessState: ExamAccessState | null,
  nowMs = Date.now()
): {
  primaryReason: string | null
  allReasons: string[]
} {
  if (!exam || !accessState) {
    return {
      primaryReason: null,
      allReasons: [],
    }
  }

  const reasons: EntryReason[] = []

  if (exam.status === 'cancelled') {
    reasons.push({
      key: 'exam_cancelled',
      label: 'Exam has been cancelled.',
      priority: 1,
    })
  }

  if (accessState.accessStatus === 'revoked') {
    reasons.push({
      key: 'access_revoked',
      label: 'Your access to this exam has been revoked.',
      priority: 2,
    })
  }

  if (accessState.approvalStatus === 'pending') {
    reasons.push({
      key: 'approval_pending',
      label: 'Your registration is pending approval.',
      priority: 3,
    })
  } else if (accessState.approvalStatus === 'rejected') {
    reasons.push({
      key: 'approval_rejected',
      label: 'Your registration was rejected.',
      priority: 3,
    })
  }

  if (nowMs < new Date(exam.startDate).getTime()) {
    reasons.push({
      key: 'exam_not_started',
      label: 'Exam has not started yet.',
      priority: 4,
    })
  }

  if (nowMs > new Date(exam.endDate).getTime()) {
    reasons.push({
      key: 'exam_ended',
      label: 'Exam has ended.',
      priority: 5,
    })
  }

  if (accessState.accessStatus === 'completed') {
    reasons.push({
      key: 'attempts_exhausted',
      label: 'No attempts remaining.',
      priority: 6,
    })
  }

  if (accessState.entrySessionStatus === 'expired') {
    reasons.push({
      key: 'entry_session_expired',
      label: 'Entry session has expired. Please verify again.',
      priority: 7,
    })
  }

  const sorted = [...reasons].sort(
    (left, right) => left.priority - right.priority
  )

  return {
    primaryReason: sorted[0]?.label ?? null,
    allReasons: sorted.map(item => item.label),
  }
}

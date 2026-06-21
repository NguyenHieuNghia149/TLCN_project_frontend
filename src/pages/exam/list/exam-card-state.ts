type LearnerExamStatus = 'draft' | 'published' | 'archived' | 'cancelled'

export type LearnerExamLifecycle =
  | 'draft'
  | 'cancelled'
  | 'archived'
  | 'upcoming'
  | 'active'
  | 'closed'

export type LearnerExamParticipationStatus =
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'EXPIRED'
  | 'ABANDONED'

export type LearnerExamPrimaryAction =
  | { kind: 'enter'; label: 'Enter Exam' | 'View Details'; disabled: false }
  | { kind: 'continue'; label: 'Continue Exam'; disabled: false }
  | { kind: 'results'; label: 'View Results'; disabled: false }
  | {
      kind: 'disabled'
      label:
        | 'Not Started'
        | 'Ended'
        | 'Archived'
        | 'Cancelled'
        | 'Draft'
        | 'Unavailable'
      disabled: true
    }

export type LearnerExamCardState = {
  lifecycle: LearnerExamLifecycle
  canEnter: boolean
  badgeLabel: string
  ctaLabel: string
}

export function getLearnerExamCardState(input: {
  examStatus?: LearnerExamStatus
  startDate: string
  endDate: string
  nowMs?: number
}): LearnerExamCardState {
  const nowMs = input.nowMs ?? Date.now()
  const startMs = new Date(input.startDate).getTime()
  const endMs = new Date(input.endDate).getTime()
  const status = input.examStatus ?? 'published'

  if (status === 'cancelled') {
    return {
      lifecycle: 'cancelled',
      canEnter: false,
      badgeLabel: 'Cancelled',
      ctaLabel: 'Unavailable',
    }
  }

  if (status === 'archived') {
    return {
      lifecycle: 'archived',
      canEnter: false,
      badgeLabel: 'Archived',
      ctaLabel: 'Unavailable',
    }
  }

  if (status === 'draft') {
    return {
      lifecycle: 'draft',
      canEnter: false,
      badgeLabel: 'Draft',
      ctaLabel: 'Not published',
    }
  }

  if (nowMs < startMs) {
    return {
      lifecycle: 'upcoming',
      canEnter: false,
      badgeLabel: 'Upcoming',
      ctaLabel: 'Not started',
    }
  }

  if (nowMs > endMs) {
    return {
      lifecycle: 'closed',
      canEnter: false,
      badgeLabel: 'Closed',
      ctaLabel: 'Closed',
    }
  }

  return {
    lifecycle: 'active',
    canEnter: true,
    badgeLabel: 'Active',
    ctaLabel: 'Enter exam',
  }
}

export function getLearnerExamPrimaryAction(input: {
  lifecycle: LearnerExamLifecycle
  attemptsUsed?: number
  maxAttempts?: number
  latestParticipationStatus?: LearnerExamParticipationStatus | null
  hasInProgressParticipation?: boolean
  hasCompletedParticipation?: boolean
}): LearnerExamPrimaryAction {
  const latestStatus = input.latestParticipationStatus ?? null
  const attemptsUsed = Number(input.attemptsUsed ?? 0)
  const maxAttempts = Number(input.maxAttempts ?? 1)
  const hasInProgressParticipation =
    input.hasInProgressParticipation || latestStatus === 'IN_PROGRESS'
  const hasCompletedParticipation =
    input.hasCompletedParticipation ||
    latestStatus === 'SUBMITTED' ||
    latestStatus === 'EXPIRED'
  const hasAnyParticipation =
    hasInProgressParticipation || hasCompletedParticipation || attemptsUsed > 0
  const hasReachedAttemptLimit = maxAttempts > 0 && attemptsUsed >= maxAttempts

  switch (input.lifecycle) {
    case 'active':
      if (hasInProgressParticipation) {
        return { kind: 'continue', label: 'Continue Exam', disabled: false }
      }
      if (hasCompletedParticipation && hasReachedAttemptLimit) {
        return { kind: 'results', label: 'View Results', disabled: false }
      }
      return { kind: 'enter', label: 'Enter Exam', disabled: false }
    case 'upcoming':
      return { kind: 'enter', label: 'View Details', disabled: false }
    case 'closed':
      return hasAnyParticipation
        ? { kind: 'results', label: 'View Results', disabled: false }
        : { kind: 'disabled', label: 'Ended', disabled: true }
    case 'archived':
      return hasAnyParticipation
        ? { kind: 'results', label: 'View Results', disabled: false }
        : { kind: 'disabled', label: 'Archived', disabled: true }
    case 'cancelled':
      return { kind: 'disabled', label: 'Cancelled', disabled: true }
    case 'draft':
      return { kind: 'disabled', label: 'Draft', disabled: true }
    default:
      return { kind: 'disabled', label: 'Unavailable', disabled: true }
  }
}

type LearnerExamStatus = 'draft' | 'published' | 'archived' | 'cancelled'

export type LearnerExamLifecycle =
  | 'draft'
  | 'cancelled'
  | 'archived'
  | 'upcoming'
  | 'active'
  | 'closed'

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

import type { Exam } from '@/types/exam.types'

/**
 * Learner list must not expose invite-only exams.
 * Invite-only access is link-driven via invite resolve flow.
 */
export function filterVisibleListExams(
  exams: Exam[],
  canManageExam: boolean
): Exam[] {
  if (canManageExam) {
    return exams
  }

  return exams.filter(item => item.accessMode !== 'invite_only')
}


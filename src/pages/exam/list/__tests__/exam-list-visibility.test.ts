import { describe, expect, it } from 'vitest'

import { filterVisibleListExams } from '@/pages/exam/list/exam-list-visibility'
import type { Exam } from '@/types/exam.types'

const buildExam = (
  id: string,
  accessMode: Exam['accessMode']
): Exam =>
  ({
    id,
    title: `Exam ${id}`,
    slug: `exam-${id}`,
    duration: 60,
    challenges: [],
    startDate: '2030-01-01T08:00:00.000Z',
    endDate: '2030-01-01T10:00:00.000Z',
    isVisible: true,
    maxAttempts: 1,
    status: 'published',
    accessMode,
    createdAt: '2030-01-01T00:00:00.000Z',
    updatedAt: '2030-01-01T00:00:00.000Z',
  }) satisfies Exam

describe('filterVisibleListExams', () => {
  it('hides invite-only exams for learner list', () => {
    const exams = [
      buildExam('open', 'open_registration'),
      buildExam('invite', 'invite_only'),
      buildExam('hybrid', 'hybrid'),
    ]

    const visible = filterVisibleListExams(exams, false)
    expect(visible.map(item => item.id)).toEqual(['open', 'hybrid'])
  })

  it('keeps invite-only exams for owner/teacher list', () => {
    const exams = [
      buildExam('open', 'open_registration'),
      buildExam('invite', 'invite_only'),
    ]

    const visible = filterVisibleListExams(exams, true)
    expect(visible.map(item => item.id)).toEqual(['open', 'invite'])
  })
})


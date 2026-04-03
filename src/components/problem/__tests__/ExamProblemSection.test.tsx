// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ExamProblemSection from '@/components/problem/ExamProblemSection'
import type { ProblemDetailResponse } from '@/types/challenge.types'

const problemData: ProblemDetailResponse['data'] = {
  problem: {
    id: 'problem-1',
    title: 'Two Sum',
    description: '<p>Find two numbers.</p>',
    difficulty: 'easy',
    constraint: '1 <= n <= 1000',
    tags: ['array', 'hash-table'],
    totalPoints: 100,
    isSolved: true,
  },
  testcases: [],
  solution: {
    id: 'solution-1',
    title: 'Hash Map',
    description: 'Use a hash map.',
    videoUrl: '',
    imageUrl: '',
    isVisible: true,
    createdAt: '2026-04-03T00:00:00.000Z',
    updatedAt: '2026-04-03T00:00:00.000Z',
    solutionApproaches: [],
  },
}

describe('ExamProblemSection', () => {
  it('renders a clean solved label without mojibake text', () => {
    const { container } = render(
      <ExamProblemSection
        activeTab="question"
        onTabChange={() => {}}
        problemData={problemData}
      />
    )

    expect(screen.getByText('Solved')).toBeInTheDocument()
    expect(container.textContent).not.toContain('âœ')
  })
})

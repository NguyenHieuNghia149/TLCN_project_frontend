// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ProblemSection from '@/components/problem/ProblemSection'
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
    solutionApproaches: [
      {
        id: 'approach-1',
        title: 'Hash Map',
        description: 'Store seen values in a map.',
        codeVariants: [{ language: 'cpp', sourceCode: 'cpp code' }],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        explanation: 'Iterate once and check complements.',
        order: 0,
        createdAt: '2026-04-03T00:00:00.000Z',
        updatedAt: '2026-04-03T00:00:00.000Z',
      },
    ],
  },
}

describe('ProblemSection', () => {
  it('renders a clean solved label without corrupted leading characters', () => {
    render(
      <ProblemSection
        activeTab="question"
        onTabChange={() => {}}
        problemData={problemData}
      />
    )

    expect(screen.getByText('Solved')).toBeInTheDocument()
    expect(screen.queryByText('? Solved')).not.toBeInTheDocument()
  })

  it('renders the solution complexity section without replacement characters', () => {
    const { container } = render(
      <ProblemSection
        activeTab="solution"
        onTabChange={() => {}}
        problemData={problemData}
        solutionLanguageOptions={[
          { value: 'cpp', label: 'C++', monacoLanguage: 'cpp' },
        ]}
        preferredSolutionLanguage="cpp"
      />
    )

    expect(container.textContent).not.toContain('�')
  })
})

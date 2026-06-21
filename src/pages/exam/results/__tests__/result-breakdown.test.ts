import { describe, expect, it } from 'vitest'

import { normalizeLearnerBreakdown } from '@/pages/exam/results/result-breakdown'

describe('normalizeLearnerBreakdown', () => {
  it('maps canonical perProblem payload', () => {
    const result = normalizeLearnerBreakdown({
      perProblem: [
        {
          problemId: 'p1',
          challengeTitle: 'Two Sum',
          obtained: 80,
          maxPoints: 100,
        },
      ],
    })

    expect(result).toEqual([
      {
        problemId: 'p1',
        challengeTitle: 'Two Sum',
        obtained: 80,
        maxPoints: 100,
      },
    ])
  })

  it('reads challenge max from legacy max key variants', () => {
    const result = normalizeLearnerBreakdown({
      perProblem: [
        {
          problemId: 'p1',
          challengeTitle: 'Two Sum',
          score: 10,
          maxScore: 50,
        },
        {
          problemId: 'p2',
          challengeTitle: 'DP',
          score: 30,
          totalPoints: 80,
        },
      ],
    })

    expect(result).toEqual([
      {
        problemId: 'p1',
        challengeTitle: 'Two Sum',
        obtained: 10,
        maxPoints: 50,
      },
      {
        problemId: 'p2',
        challengeTitle: 'DP',
        obtained: 30,
        maxPoints: 80,
      },
    ])
  })

  it('falls back to legacy solutions payload', () => {
    const result = normalizeLearnerBreakdown({
      solutions: [
        {
          challengeId: 'c1',
          challengeTitle: 'Array Rotate',
          score: 25,
          maxPoints: 40,
        },
      ],
    })

    expect(result).toEqual([
      {
        problemId: 'c1',
        challengeTitle: 'Array Rotate',
        obtained: 25,
        maxPoints: 40,
      },
    ])
  })

  it('keeps every canonical perProblem row so untouched exam challenges show 0 over max points', () => {
    const result = normalizeLearnerBreakdown({
      solutions: [
        {
          challengeId: 'c1',
          score: 20,
          code: 'print(1)',
        },
      ],
      perProblem: [
        {
          problemId: 'c1',
          challengeTitle: 'Arrays',
          obtained: 20,
          maxPoints: 50,
        },
        {
          problemId: 'c2',
          challengeTitle: 'Graphs',
          obtained: 0,
          maxPoints: 75,
        },
      ],
    })

    expect(result).toEqual([
      {
        problemId: 'c1',
        challengeTitle: 'Arrays',
        obtained: 20,
        maxPoints: 50,
      },
      {
        problemId: 'c2',
        challengeTitle: 'Graphs',
        obtained: 0,
        maxPoints: 75,
      },
    ])
  })

  it('hides untouched challenges in legacy solutions payload', () => {
    const result = normalizeLearnerBreakdown({
      solutions: [
        {
          challengeId: 'c1',
          challengeTitle: 'Touched',
          score: 0,
          code: 'print(1)',
          results: [{ testCaseId: 't1', passed: false }],
        },
        {
          challengeId: 'c2',
          challengeTitle: 'Untouched',
          score: 0,
          code: '',
          results: [],
        },
      ],
    })

    expect(result).toEqual([
      {
        problemId: 'c1',
        challengeTitle: 'Touched',
        obtained: 0,
        maxPoints: null,
      },
    ])
  })

  it('returns empty list for invalid payload', () => {
    expect(normalizeLearnerBreakdown(null)).toEqual([])
    expect(normalizeLearnerBreakdown({})).toEqual([])
  })
})

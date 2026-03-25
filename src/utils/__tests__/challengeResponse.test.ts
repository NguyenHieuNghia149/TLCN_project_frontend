import { describe, expect, it } from 'vitest'

import {
  normalizeChallengeTestCase,
  normalizeExamChallengeResponse,
  normalizeProblemDetailResponse,
} from '@/utils/challengeResponse'

describe('challengeResponse normalization', () => {
  it('converts backend testcase payloads into the frontend JSON-first contract', () => {
    const normalized = normalizeChallengeTestCase({
      id: 'tc-1',
      input: 'nums: [2,7,11,15]\ntarget: 9',
      output: '[0,1]',
      inputJson: { nums: [2, 7, 11, 15], target: 9 },
      outputJson: [0, 1],
      isPublic: true,
      point: 10,
      createdAt: '2026-03-25T00:00:00.000Z',
      updatedAt: '2026-03-25T00:00:00.000Z',
    })

    expect(normalized).toEqual({
      id: 'tc-1',
      inputJson: { nums: [2, 7, 11, 15], target: 9 },
      outputJson: [0, 1],
      displayInput: 'nums: [2,7,11,15]\ntarget: 9',
      displayOutput: '[0,1]',
      isPublic: true,
      point: 10,
      createdAt: '2026-03-25T00:00:00.000Z',
      updatedAt: '2026-03-25T00:00:00.000Z',
    })
  })

  it('normalizes the full problem detail response and strips raw input/output fields', () => {
    const response = normalizeProblemDetailResponse({
      success: true,
      data: {
        problem: {
          id: 'problem-1',
          title: 'Two Sum',
          description: 'desc',
          difficulty: 'easy',
          constraint: '',
          tags: [],
          totalPoints: 10,
        },
        testcases: [
          {
            id: 'tc-1',
            input: '1',
            output: '2',
            inputJson: { value: 1 },
            outputJson: 2,
            isPublic: true,
            point: 10,
            createdAt: '2026-03-25T00:00:00.000Z',
            updatedAt: '2026-03-25T00:00:00.000Z',
          },
        ],
        solution: {
          id: 'solution-1',
          title: 'Solution',
          description: 'desc',
          videoUrl: '',
          imageUrl: '',
          isVisible: true,
          solutionApproaches: [],
          createdAt: '2026-03-25T00:00:00.000Z',
          updatedAt: '2026-03-25T00:00:00.000Z',
        },
      },
    })

    expect(response.data.testcases[0]).toMatchObject({
      id: 'tc-1',
      inputJson: { value: 1 },
      outputJson: 2,
      displayInput: '1',
      displayOutput: '2',
    })
    expect('input' in response.data.testcases[0]).toBe(false)
    expect('output' in response.data.testcases[0]).toBe(false)
  })

  it('normalizes exam challenge payloads to the same testcase contract', () => {
    const response = normalizeExamChallengeResponse({
      success: true,
      data: {
        id: 'problem-1',
        title: 'Two Sum',
        description: 'desc',
        difficulty: 'easy',
        topic: 'array',
        totalPoints: 10,
        constraint: '',
        tags: [],
        orderIndex: 0,
        testcases: [
          {
            id: 'tc-1',
            input: '1',
            output: '2',
            inputJson: { value: 1 },
            outputJson: 2,
            isPublic: true,
            point: 10,
            createdAt: '2026-03-25T00:00:00.000Z',
            updatedAt: '2026-03-25T00:00:00.000Z',
          },
        ],
      },
    })

    expect(response.data.testcases[0]).toMatchObject({
      id: 'tc-1',
      inputJson: { value: 1 },
      outputJson: 2,
      displayInput: '1',
      displayOutput: '2',
    })
    expect('input' in response.data.testcases[0]).toBe(false)
    expect('output' in response.data.testcases[0]).toBe(false)
  })
})

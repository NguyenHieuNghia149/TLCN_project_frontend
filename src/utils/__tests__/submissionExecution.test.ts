import type { TestCase } from '@/types/editor.types'
import {
  coerceSandboxResults,
  createOutputStateFromSnapshot,
  normalizeExecutionStatus,
} from '@/utils/submissionExecution'
import { describe, expect, it } from 'vitest'

const testCases: TestCase[] = [
  {
    id: 'case-1',
    name: 'Case 1',
    input: '1',
    expectedOutput: '2',
    isPublic: true,
  },
  {
    id: 'case-2',
    name: 'Case 2',
    input: '3',
    expectedOutput: '4',
    isPublic: false,
  },
]

describe('submissionExecution utilities', () => {
  it('normalizes backend execution statuses', () => {
    expect(normalizeExecutionStatus('ACCEPTED')).toBe('accepted')
    expect(normalizeExecutionStatus('CE')).toBe('compilation_error')
    expect(normalizeExecutionStatus('runtime_error')).toBe('runtime_error')
  })

  it('coerces testcase results and maps testcaseId to the visible index', () => {
    const results = coerceSandboxResults(
      [
        {
          testcaseId: 'case-2',
          stdin: 'stdin-value',
          expected: 'expected-value',
          stdout: 'stdout-value',
          passed: true,
          time: 12,
          isPublic: false,
        },
      ],
      testCases
    )

    expect(results).toEqual([
      {
        index: 1,
        input: 'stdin-value',
        expectedOutput: 'expected-value',
        actualOutput: 'stdout-value',
        ok: true,
        stderr: '',
        executionTime: 12,
        isPublic: false,
      },
    ])
  })

  it('uses only visible testcase counts for run output', () => {
    const output = createOutputStateFromSnapshot({
      snapshot: {
        status: 'RUNNING',
        result: {
          passed: 2,
          total: 2,
          results: [
            {
              index: 0,
              input: '1',
              expectedOutput: '2',
              actualOutput: '2',
              ok: true,
              stderr: '',
              executionTime: 1,
            },
            {
              index: 1,
              input: '3',
              expectedOutput: '4',
              actualOutput: '4',
              ok: true,
              stderr: '',
              executionTime: 1,
              isPublic: false,
            },
          ],
        },
      },
      testCases,
      isSubmit: false,
    })

    expect(output.message).toBe('Running... 1/1 passed')
    expect(output.passedTests).toBe(1)
    expect(output.totalTests).toBe(1)
    expect(output.results).toHaveLength(1)
  })

  it('uses full testcase summary for submit output while only exposing visible results', () => {
    const output = createOutputStateFromSnapshot({
      snapshot: {
        status: 'WRONG_ANSWER',
        result: {
          passed: 1,
          total: 2,
          results: [
            {
              index: 0,
              input: '1',
              expectedOutput: '2',
              actualOutput: '2',
              ok: true,
              stderr: '',
              executionTime: 1,
            },
            {
              index: 1,
              input: '3',
              expectedOutput: '4',
              actualOutput: '5',
              ok: false,
              stderr: 'wrong answer',
              executionTime: 1,
              isPublic: false,
            },
          ],
        },
      },
      testCases,
      isSubmit: true,
    })

    expect(output.status).toBe('rejected')
    expect(output.message).toBe('Status: wrong_answer � 1/2')
    expect(output.passedTests).toBe(1)
    expect(output.totalTests).toBe(2)
    expect(output.results).toHaveLength(1)
    expect(output.normalizedStatus).toBe('wrong')
  })
})

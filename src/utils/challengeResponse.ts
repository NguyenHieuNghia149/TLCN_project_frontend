import type { ProblemDetailResponse, TestCase } from '@/types/challenge.types'
import type { ExamChallengeResponse } from '@/types/exam.types'

export type RawChallengeTestCase = Omit<
  TestCase,
  | 'inputJson'
  | 'outputJson'
  | 'displayInput'
  | 'displayOutput'
  | 'createdAt'
  | 'updatedAt'
> & {
  input?: string | null
  output?: string | null
  inputJson?: Record<string, unknown> | null
  outputJson?: unknown
  createdAt?: string
  updatedAt?: string
}

export type RawProblemDetailResponse = Omit<ProblemDetailResponse, 'data'> & {
  data: Omit<ProblemDetailResponse['data'], 'testcases'> & {
    testcases: RawChallengeTestCase[]
  }
}

export type RawExamChallengeResponse = Omit<ExamChallengeResponse, 'data'> & {
  data: Omit<ExamChallengeResponse['data'], 'testcases'> & {
    testcases: RawChallengeTestCase[]
  }
}

function coerceInputJson(
  value: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value
  }

  return {}
}

function stringifyDisplayValue(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }

  if (value === null || value === undefined) {
    return ''
  }

  try {
    const serialized = JSON.stringify(value)
    return typeof serialized === 'string' ? serialized : ''
  } catch {
    return String(value)
  }
}

/**
 * Normalizes backend testcase payloads into the JSON-first frontend contract.
 */
export function normalizeChallengeTestCase(
  testCase: RawChallengeTestCase
): TestCase {
  return {
    id: testCase.id,
    inputJson: coerceInputJson(testCase.inputJson),
    outputJson: testCase.outputJson ?? null,
    displayInput: testCase.input ?? stringifyDisplayValue(testCase.inputJson),
    displayOutput:
      testCase.output ?? stringifyDisplayValue(testCase.outputJson),
    isPublic: testCase.isPublic,
    point: testCase.point,
    createdAt: testCase.createdAt ?? '',
    updatedAt: testCase.updatedAt ?? '',
  }
}

/**
 * Normalizes problem detail API responses before the rest of the frontend consumes them.
 */
export function normalizeProblemDetailResponse(
  response: RawProblemDetailResponse
): ProblemDetailResponse {
  return {
    ...response,
    data: {
      ...response.data,
      testcases: response.data.testcases.map(normalizeChallengeTestCase),
    },
  }
}

/**
 * Normalizes exam challenge API responses to the same testcase contract as challenge detail.
 */
export function normalizeExamChallengeResponse(
  response: RawExamChallengeResponse
): ExamChallengeResponse {
  return {
    ...response,
    data: {
      ...response.data,
      testcases: response.data.testcases.map(normalizeChallengeTestCase),
    },
  }
}

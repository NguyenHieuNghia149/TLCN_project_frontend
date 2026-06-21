import type {
  CodeVariant,
  ProblemDetailResponse,
  SolutionApproach,
  TestCase,
} from '@/types/challenge.types'
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

type RawSolutionApproach = Omit<SolutionApproach, 'codeVariants'> & {
  codeVariants?: CodeVariant[] | null
  sourceCode?: string | null
  language?: string | null
}

export type RawProblemDetailResponse = Omit<ProblemDetailResponse, 'data'> & {
  data: Omit<ProblemDetailResponse['data'], 'testcases' | 'solution'> & {
    testcases: RawChallengeTestCase[]
    solution: Omit<
      ProblemDetailResponse['data']['solution'],
      'solutionApproaches'
    > & {
      solutionApproaches: RawSolutionApproach[]
    }
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

function normalizeCodeVariants(approach: RawSolutionApproach): CodeVariant[] {
  if (
    !Array.isArray(approach.codeVariants) ||
    approach.codeVariants.length === 0
  ) {
    return []
  }

  return approach.codeVariants
    .filter(
      variant =>
        typeof variant?.language === 'string' &&
        typeof variant?.sourceCode === 'string'
    )
    .map(variant => ({
      language: variant.language,
      sourceCode: variant.sourceCode,
    }))
}

function normalizeSolutionApproach(
  approach: RawSolutionApproach
): SolutionApproach {
  return {
    id: approach.id,
    title: approach.title,
    description: approach.description ?? '',
    codeVariants: normalizeCodeVariants(approach),
    timeComplexity: approach.timeComplexity ?? '',
    spaceComplexity: approach.spaceComplexity ?? '',
    explanation: approach.explanation ?? '',
    order: approach.order,
    createdAt: approach.createdAt ?? '',
    updatedAt: approach.updatedAt ?? '',
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
      solution: {
        ...response.data.solution,
        solutionApproaches: response.data.solution.solutionApproaches.map(
          normalizeSolutionApproach
        ),
      },
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

import type { OutputState, TestCase } from '@/types/editor.types'
import type {
  SandboxTestcaseResult,
  SubmissionDetail,
  SubmissionResultSummary,
  SubmissionStreamPayload,
} from '@/types/submission.types'
import { normalizeSubmissionStatus } from '@/utils/submissionStatus'

const STATUS_MAP: Record<string, string> = {
  PENDING: 'pending',
  RUNNING: 'running',
  ACCEPTED: 'accepted',
  WRONG_ANSWER: 'wrong_answer',
  TIME_LIMIT_EXCEEDED: 'time_limit_exceeded',
  MEMORY_LIMIT_EXCEEDED: 'memory_limit_exceeded',
  RUNTIME_ERROR: 'runtime_error',
  COMPILATION_ERROR: 'compilation_error',
  FAILED: 'failed',
  SYSTEM_ERROR: 'failed',
  INTERNAL_ERROR: 'failed',
  WA: 'wrong_answer',
  TLE: 'time_limit_exceeded',
  MLE: 'memory_limit_exceeded',
  CE: 'compilation_error',
  RE: 'runtime_error',
}

const TERMINAL_STATUSES = new Set([
  'accepted',
  'wrong_answer',
  'time_limit_exceeded',
  'memory_limit_exceeded',
  'runtime_error',
  'compilation_error',
  'failed',
])

type RawSandboxResult = {
  index?: number
  testcaseId?: string
  input?: string
  stdin?: string
  expected?: string
  expectedOutput?: string
  output?: string
  actual?: string
  actualOutput?: string
  stdout?: string
  ok?: boolean
  isPassed?: boolean
  passed?: boolean
  stderr?: string
  error?: string
  executionTime?: number
  time?: number
  isPublic?: boolean
}

type SnapshotLike = {
  status?: string
  overall_status?: string
  result?: SubmissionResultSummary | null
  results?: RawSandboxResult[]
  message?: string
}

/**
 * Normalizes backend submission status strings into the frontend execution status contract.
 */
export function normalizeExecutionStatus(status?: string): string {
  if (!status) {
    return ''
  }

  const upper = status.toUpperCase()
  return STATUS_MAP[upper] ?? status.toLowerCase()
}

/**
 * Returns whether the provided execution status is terminal for the submission UI.
 */
export function isTerminalExecutionStatus(status?: string): boolean {
  return TERMINAL_STATUSES.has(normalizeExecutionStatus(status))
}

/**
 * Coerces sandbox/submission testcase payloads into the UI result shape.
 */
export function coerceSandboxResults(
  results?: RawSandboxResult[] | null,
  testCases: TestCase[] = []
): SandboxTestcaseResult[] | undefined {
  if (!Array.isArray(results)) {
    return undefined
  }

  return results.map((result, index) => {
    let resolvedIndex =
      typeof result.index === 'number' ? result.index : undefined

    if (
      resolvedIndex === undefined &&
      typeof result.testcaseId === 'string' &&
      Array.isArray(testCases)
    ) {
      const foundIndex = testCases.findIndex(
        testCase => testCase.id === result.testcaseId
      )
      if (foundIndex >= 0) {
        resolvedIndex = foundIndex
      }
    }

    return {
      index: resolvedIndex ?? index,
      input: result.input ?? result.stdin ?? '',
      expectedOutput:
        result.expectedOutput ?? result.expected ?? result.output ?? '',
      actualOutput: result.actualOutput ?? result.actual ?? result.stdout ?? '',
      ok:
        typeof result.ok === 'boolean'
          ? result.ok
          : typeof result.isPassed === 'boolean'
            ? result.isPassed
            : Boolean(result.passed),
      stderr: result.stderr ?? result.error ?? '',
      executionTime: result.executionTime ?? result.time ?? 0,
      isPublic: result.isPublic ?? true,
    }
  })
}

/**
 * Filters testcase results down to the subset the current challenge page can display.
 */
export function filterVisibleResults(
  results: SandboxTestcaseResult[],
  testCases: TestCase[]
): SandboxTestcaseResult[] {
  return results.filter(result => {
    const testCase = testCases[result.index]
    return result.isPublic !== false && testCase?.isPublic !== false
  })
}

/**
 * Builds the editor/output state from either SSE payloads or polled submission detail snapshots.
 */
export function createOutputStateFromSnapshot(options: {
  snapshot: SnapshotLike
  testCases: TestCase[]
  isSubmit: boolean
  previousResults?: SandboxTestcaseResult[]
}): OutputState {
  const { snapshot, testCases, isSubmit, previousResults } = options
  const normalizedStatus = normalizeExecutionStatus(
    snapshot.overall_status ?? snapshot.status
  )
  const terminal = isTerminalExecutionStatus(normalizedStatus)
  const allResults =
    coerceSandboxResults(
      snapshot.result?.results ?? snapshot.results,
      testCases
    ) ?? []
  const visibleResults = filterVisibleResults(allResults, testCases)

  const visiblePassed = visibleResults.filter(result => result.ok).length
  const visibleTotal = visibleResults.length
  const allPassed =
    snapshot.result?.passed ?? allResults.filter(result => result.ok).length
  const allTotal = snapshot.result?.total ?? allResults.length

  const passedTests = isSubmit ? allPassed : visiblePassed
  const totalTests = isSubmit ? allTotal : visibleTotal

  const terminalMessage = terminal
    ? normalizedStatus === 'accepted'
      ? isSubmit
        ? 'You have successfully completed this problem!'
        : 'All test cases passed!'
      : `Status: ${normalizedStatus}${
          typeof passedTests === 'number' && typeof totalTests === 'number'
            ? ` � ${passedTests}/${totalTests}`
            : ''
        }`
    : typeof passedTests === 'number' && typeof totalTests === 'number'
      ? `Running... ${passedTests}/${totalTests} passed`
      : snapshot.message || 'Running...'

  return {
    status: terminal
      ? normalizedStatus === 'accepted'
        ? 'accepted'
        : 'rejected'
      : 'running',
    message: terminalMessage,
    passedTests,
    totalTests,
    results: visibleResults.length > 0 ? visibleResults : previousResults,
    isSubmit,
    normalizedStatus: normalizeSubmissionStatus(normalizedStatus),
  }
}

/**
 * Projects a full submission detail into the subset used by the editor execution UI.
 */
export function toExecutionSnapshot(
  submission: SubmissionDetail | SubmissionStreamPayload
): SnapshotLike {
  return {
    status: submission.status,
    result: submission.result,
    message: 'message' in submission ? submission.message : undefined,
  }
}

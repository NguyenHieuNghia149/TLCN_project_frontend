export type LearnerResultBreakdownItem = {
  problemId: string
  challengeTitle: string
  obtained: number
  maxPoints: number | null
}

function asFiniteNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readMaxPoints(row: Record<string, unknown>): number | null {
  return (
    asFiniteNumberOrNull(row.maxPoints) ??
    asFiniteNumberOrNull(row.maxScore) ??
    asFiniteNumberOrNull(row.totalPoints) ??
    asFiniteNumberOrNull(row.challengeMaxScore)
  )
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function hasSolutionAttemptEvidence(row: Record<string, unknown>): boolean {
  const code = asNonEmptyString(row.code)
  const results = Array.isArray(row.results) ? row.results : []
  const score = asFiniteNumberOrNull(row.score)

  return Boolean(code) || results.length > 0 || (score !== null && score > 0)
}

export function normalizeLearnerBreakdown(
  raw: Record<string, unknown> | null | undefined
): LearnerResultBreakdownItem[] {
  if (!raw) {
    return []
  }

  const perProblem = raw.perProblem
  if (Array.isArray(perProblem)) {
    const normalized: LearnerResultBreakdownItem[] = perProblem
      .map((item, index): LearnerResultBreakdownItem | null => {
        if (!item || typeof item !== 'object') {
          return null
        }

        const row = item as Record<string, unknown>
        const problemId =
          asNonEmptyString(row.problemId) ||
          asNonEmptyString(row.challengeId) ||
          `problem-${index + 1}`
        const challengeTitle =
          asNonEmptyString(row.challengeTitle) ||
          asNonEmptyString(row.title) ||
          problemId
        const obtained =
          asFiniteNumberOrNull(row.obtained) ??
          asFiniteNumberOrNull(row.score) ??
          0
        const maxPoints = readMaxPoints(row)

        return {
          problemId,
          challengeTitle,
          obtained,
          maxPoints,
        }
      })
      .filter((item): item is LearnerResultBreakdownItem => item !== null)

    return normalized
  }

  const solutions = raw.solutions
  if (Array.isArray(solutions)) {
    return solutions
      .map((item, index): LearnerResultBreakdownItem | null => {
        if (!item || typeof item !== 'object') {
          return null
        }

        const row = item as Record<string, unknown>
        if (!hasSolutionAttemptEvidence(row)) {
          return null
        }

        const problemId =
          asNonEmptyString(row.challengeId) ||
          asNonEmptyString(row.problemId) ||
          `problem-${index + 1}`
        const challengeTitle =
          asNonEmptyString(row.challengeTitle) ||
          asNonEmptyString(row.title) ||
          problemId
        const obtained = asFiniteNumberOrNull(row.score) ?? 0

        return {
          problemId,
          challengeTitle,
          obtained,
          maxPoints: readMaxPoints(row),
        }
      })
      .filter((item): item is LearnerResultBreakdownItem => item !== null)
  }

  return []
}

export type SubmissionDetailSolutionViewModel = {
  challengeId: string
  challengeTitle: string
  language: string
  code: string
  score: number | null
  submittedAt: string | null
  passedCount: number
  totalTests: number
}

export type SubmissionDetailViewModel = {
  participationId: string
  userName: string
  email: string
  startedAt: string | null
  submittedAt: string | null
  durationMinutes: number | null
  totalScore: number | null
  solutions: SubmissionDetailSolutionViewModel[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function asNumberOrNull(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }
  return value
}

function asBoolean(value: unknown): boolean {
  return value === true
}

export function normalizeSubmissionDetails(
  payload: unknown
): SubmissionDetailViewModel | null {
  if (!isRecord(payload)) {
    return null
  }

  const user = isRecord(payload.user) ? payload.user : {}
  const firstName = asStringOrNull(user.firstname) || ''
  const lastName = asStringOrNull(user.lastname) || ''
  const email = asStringOrNull(user.email) || 'Unknown email'
  const userName = `${firstName} ${lastName}`.trim() || email

  const rawSolutions = Array.isArray(payload.solutions) ? payload.solutions : []
  const solutions: SubmissionDetailSolutionViewModel[] = rawSolutions
    .filter(isRecord)
    .map(item => {
      const challengeId =
        asStringOrNull(item.challengeId) || 'unknown-challenge'
      const challengeTitle = asStringOrNull(item.challengeTitle) || challengeId
      const language = asStringOrNull(item.language) || 'unknown'
      const code = typeof item.code === 'string' ? item.code : ''
      const score = asNumberOrNull(item.score)
      const submittedAt = asStringOrNull(item.submittedAt)
      const rawResults = Array.isArray(item.results) ? item.results : []
      const totalTests = rawResults.filter(isRecord).length
      const passedCount = rawResults.filter(
        result => isRecord(result) && asBoolean(result.passed)
      ).length

      return {
        challengeId,
        challengeTitle,
        language,
        code,
        score,
        submittedAt,
        passedCount,
        totalTests,
      }
    })

  return {
    participationId: asStringOrNull(payload.id) || 'unknown-participation',
    userName,
    email,
    startedAt: asStringOrNull(payload.startedAt),
    submittedAt: asStringOrNull(payload.submittedAt),
    durationMinutes: asNumberOrNull(payload.duration),
    totalScore: asNumberOrNull(payload.totalScore),
    solutions,
  }
}

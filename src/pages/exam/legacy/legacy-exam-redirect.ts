export type LegacyExamRedirectMode = 'results' | 'challenge' | 'admin-results'

type ResolveLegacyRedirectTargetParams = {
  mode: LegacyExamRedirectMode
  examId?: string
  challengeId?: string
  slug?: string | null
}

export function resolveLegacyRedirectTarget({
  mode,
  examId,
  challengeId,
  slug,
}: ResolveLegacyRedirectTargetParams): string | null {
  if (!examId) {
    return null
  }

  if (mode === 'admin-results') {
    return `/admin/exams/${examId}/results`
  }

  if (!slug) {
    return null
  }

  if (mode === 'results') {
    return `/exam/${slug}/results`
  }

  if (mode === 'challenge') {
    if (!challengeId) {
      return `/exam/${slug}`
    }
    return `/exam/${slug}/challenges/${challengeId}`
  }

  return `/exam/${slug}`
}

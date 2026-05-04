export type LegacyExamRedirectMode = 'results' | 'challenge' | 'admin-results'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isLegacyExamId(value: string | null | undefined): boolean {
  if (!value) {
    return false
  }
  return UUID_PATTERN.test(value.trim())
}

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
    return `/exam/${examId}/results/manage`
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

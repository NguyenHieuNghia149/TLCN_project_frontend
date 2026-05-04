export type ResultStatus = 'pending' | 'scored' | 'failed'

function isResultStatus(value: unknown): value is ResultStatus {
  return value === 'pending' || value === 'scored' || value === 'failed'
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function normalizeAdminResultStatus(
  rawStatus: unknown,
  rawScore: unknown
): ResultStatus {
  if (isResultStatus(rawStatus)) {
    return rawStatus
  }

  const score = asNumberOrNull(rawScore)
  if (score !== null) {
    return 'scored'
  }

  return 'pending'
}

export function normalizeLearnerResultStatus(
  rawStatus: unknown,
  rawScore: unknown
): {
  status: ResultStatus
  score: number | null
} {
  const score = asNumberOrNull(rawScore)

  if (rawStatus === 'failed') {
    return {
      status: 'failed',
      score: null,
    }
  }

  if (rawStatus === 'pending') {
    return {
      status: 'pending',
      score: null,
    }
  }

  if (rawStatus === 'scored') {
    return {
      status: 'scored',
      score: score ?? 0,
    }
  }

  if (score !== null) {
    return {
      status: 'scored',
      score,
    }
  }

  return {
    status: 'pending',
    score: null,
  }
}

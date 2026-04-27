function toEpoch(value?: string | number | null): number | null {
  if (value === null || value === undefined) return null
  const parsed =
    typeof value === 'number' ? value : new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : null
}

export function canResumeExamWorkspace(input: {
  participationStatus?: string | null
  examEndDate?: string | null
  participationExpiresAt?: string | number | null
  nowMs?: number
}): boolean {
  const nowMs = input.nowMs ?? Date.now()
  const status = `${input.participationStatus || ''}`.trim().toUpperCase()

  if (!status) {
    return false
  }

  if (!['IN_PROGRESS', 'ACTIVE'].includes(status)) {
    return false
  }

  const examEndMs = toEpoch(input.examEndDate)
  if (examEndMs !== null && nowMs > examEndMs) {
    return false
  }

  const expiresMs = toEpoch(input.participationExpiresAt)
  if (expiresMs !== null && nowMs > expiresMs) {
    return false
  }

  return true
}

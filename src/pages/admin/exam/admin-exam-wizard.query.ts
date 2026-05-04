export function resolveWizardStepIndex(
  step: string | null,
  stepKeys: readonly string[]
): number {
  const index = step ? stepKeys.indexOf(step) : -1
  return index >= 0 ? index : 0
}

export function syncWizardSearchParams(
  current: URLSearchParams,
  stepKey: string
): URLSearchParams {
  const next = new URLSearchParams(current)
  next.set('step', stepKey)
  if (stepKey !== 'participants') {
    next.delete('participantId')
  }
  return next
}

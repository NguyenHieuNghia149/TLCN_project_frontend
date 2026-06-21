// Status normalization and display helpers for submissions
export type SubmissionUiStatus =
  | 'accepted'
  | 'wrong'
  | 'runtime'
  | 'timeout'
  | 'compile'
  | 'memory'
  | 'pending'
  | 'running'
  | 'unknown'

export const normalizeSubmissionStatus = (
  s: string | undefined
): SubmissionUiStatus => {
  if (!s) return 'unknown'
  const normalized = s.toLowerCase()
  if (normalized === 'accepted') return 'accepted'
  if (normalized === 'wrong_answer' || normalized === 'wrong') return 'wrong'
  if (normalized === 'runtime_error' || normalized === 'runtime')
    return 'runtime'
  if (normalized === 'time_limit_exceeded' || normalized === 'timeout')
    return 'timeout'
  if (normalized === 'compilation_error' || normalized === 'compile')
    return 'compile'
  if (normalized === 'memory_limit_exceeded' || normalized === 'memory')
    return 'memory'
  if (normalized === 'pending') return 'pending'
  if (normalized === 'running') return 'running'
  return 'unknown'
}

export const getSubmissionStatusLabel = (s: SubmissionUiStatus): string => {
  if (s === 'accepted') return 'Accepted'
  if (s === 'wrong') return 'Wrong Answer'
  if (s === 'runtime') return 'Runtime Error'
  if (s === 'timeout') return 'Time Limit Exceeded'
  if (s === 'compile') return 'Compilation Error'
  if (s === 'memory') return 'Memory Limit Exceeded'
  if (s === 'pending') return 'Pending'
  if (s === 'running') return 'Running'
  return 'Unknown'
}

export const getSubmissionStatusColor = (s: SubmissionUiStatus): string => {
  if (s === 'accepted') return 'text-green-400'
  if (s === 'wrong') return 'text-red-400'
  if (s === 'runtime') return 'text-orange-400'
  if (s === 'timeout') return 'text-yellow-400'
  if (s === 'compile') return 'text-red-300'
  if (s === 'memory') return 'text-purple-400'
  if (s === 'pending') return 'text-gray-400'
  if (s === 'running') return 'text-blue-400'
  return 'text-[var(--muted-text)]'
}

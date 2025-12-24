import type { SandboxTestcaseResult } from '@/types/submission.types'

export interface TestCase {
  id: string
  name: string
  input: string
  expectedOutput: string
  isPublic?: boolean
}

export interface OutputState {
  status: 'idle' | 'running' | 'accepted' | 'rejected'
  message: string
  passedTests?: number
  totalTests?: number
  results?: SandboxTestcaseResult[]
  processingTime?: number
  error?: string
  isSubmit?: boolean // true for submit, false/undefined for run
}

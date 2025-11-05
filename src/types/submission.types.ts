export type SupportedLanguage = 'cpp' | 'python' | 'java' | 'javascript'

export interface SandboxTestcaseResult {
  index: number
  input: string
  expectedOutput: string
  actualOutput: string
  ok: boolean
  stderr: string
  executionTime: number
}

export interface RunResponseData {
  summary: { passed: number; total: number; successRate: string }
  results: SandboxTestcaseResult[]
  processingTime: number
}

export interface SubmissionResultSummary {
  passed: number
  total: number
  results: SandboxTestcaseResult[]
}

export interface SubmissionDetail {
  submissionId: string
  userId: string
  problemId: string
  language: SupportedLanguage
  status: string
  result?: SubmissionResultSummary
  score?: number
  submittedAt: string
  judgedAt?: string
  executionTime?: number
}

export interface RunOrSubmitPayload {
  sourceCode: string
  language: SupportedLanguage
  problemId: string
}

export interface RunResponseWrapper {
  success: true
  data: {
    success: boolean
    data: RunResponseData
    timestamp: string
  }
}

export interface SubmitResponseData {
  submissionId: string
  status: string
  queuePosition: number
  estimatedWaitTime: number
}

export interface SubmitResponseWrapper {
  success: true
  message: string
  data: SubmitResponseData
}

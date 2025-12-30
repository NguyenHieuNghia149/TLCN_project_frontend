import { ChallengeItem } from './challenge.types'
import { User } from './auth.types'

export interface Exam {
  id: string
  title: string
  password?: string
  duration: number // in minutes
  challenges: ChallengeItem[]
  startDate: string // ISO datetime
  endDate: string // ISO datetime
  createdBy?: string // userId
  isVisible: boolean
  maxAttempts: number
  createdAt: string
  updatedAt?: string
}

export interface CreateExamPayload {
  title: string
  password?: string
  duration: number
  startDate: string
  endDate: string
  isVisible: boolean
  maxAttempts: number
  challenges: Array<{
    type: 'existing' | 'new'
    challengeId: string
    orderIndex?: number
  }>
}

export interface UpdateExamPayload {
  title?: string
  password?: string
  duration?: number
  startDate?: string
  endDate?: string
  isVisible?: boolean
  maxAttempts?: number
  challenges?: Array<{
    type: 'existing' | 'new'
    challengeId: string
    orderIndex?: number
  }>
}
export interface ExamParticipation {
  id: string
  participationId?: string // Alias for id
  userId: string
  examId: string
  startedAt?: string
  startAt?: string | number // Alias
  startTimestamp?: number // Alias
  startedAtMs?: number // Alias
  expiresAt?: string | number
  expires_at?: string // Alias
  expires?: string | number // Alias
  currentChallengeId?: string
  currentChallenge?: string // Alias
  currentAnswers?: Record<string, { sourceCode?: string; language?: string }> // Session answers
  answers?: Record<string, { sourceCode?: string; language?: string }> // Alias
  totalScore: number
  submittedAt?: string
  status?: string // Add status property
  createdAt: string
  updatedAt?: string
}

export interface ExamParticipationResponse {
  success: boolean
  data: ExamParticipation
}

export interface ExamChallengeData {
  id: string
  title: string
  description?: string
  content?: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  totalPoints: number
  constraint: string
  tags: string[]
  orderIndex: number
  testcases: Array<{
    id: string
    input: string
    output: string
    isPublic: boolean
    point: number
  }>
  solution?: {
    id: string
    title: string
    description: string
    videoUrl?: string
    imageUrl?: string
  }
  initialCode?: string
}

export interface ExamChallengeResponse {
  success: boolean
  data: ExamChallengeData
}

export interface ExamSubmission {
  id: string
  userId: string
  examId: string
  user?: User // User details for display
  solutions?: ChallengeSolution[]
  totalScore: number
  startedAt?: string
  submittedAt: string
  duration?: number // actual time spent in minutes
  perProblem?: Array<{ problemId: string; obtained: number; maxPoints: number }>
  rank?: number
}

export interface ChallengeSolution {
  challengeId: string
  challengeTitle?: string
  code: string
  language: string
  score: number
  results?: TestCaseResult[]
  submittedAt: string
}

export interface TestCaseResult {
  testCaseId: string
  passed: boolean
  actualOutput: string
  expectedOutput: string
  error?: string
}

export interface ExamResponse {
  success: boolean
  data: Exam
}

export interface ExamListResponse {
  success: boolean
  data: Exam[]
  total: number
}

export interface ExamSubmissionResponse {
  success: boolean
  data: ExamSubmission
}

export interface ExamSubmissionDetailsResponse {
  success: boolean
  data: {
    totalScore: number
    perProblem?: Array<{
      problemId: string
      obtained: number
      maxPoints: number
    }>
  }
}

export interface ExamStatisticsResponse {
  success: boolean
  data: {
    totalParticipants: number
    submissions: ExamSubmission[]
    averageScore: number
    statistics: {
      challengeId: string
      challengeTitle: string
      averageScore: number
      passedCount: number
    }[]
  }
}

export interface ExamStatistics {
  totalParticipants: number
  averageScore: number
  challengeStats: {
    challengeId: string
    challengeTitle: string
    averageScore: number
    passedCount: number
  }[]
}

export interface ExamState {
  exams: Exam[]
  currentExam: Exam | null
  submissions: ExamSubmission[]
  currentSubmission: ExamSubmission | null
  // current participation/session info (optional during migration)
  currentParticipationId?: string | null
  currentParticipationExamId?: string | null // NEW: Scope participation to specific exam
  currentParticipationStartAt?: number | string | null
  currentParticipationExpiresAt?: number | string | null
  // optional: which challenge the user is currently on (for resume)
  currentParticipationChallengeId?: string | null
  isLoading: boolean
  error: string | null
  statistics: ExamStatistics | null
}

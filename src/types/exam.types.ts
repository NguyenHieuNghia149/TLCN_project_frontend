import { Challenge } from './challenge.types'
import { User } from './auth.types'

export interface Exam {
  id: string
  title: string
  password: string
  duration: number // in minutes
  challenges: Challenge[]
  startDate: string // ISO datetime
  endDate: string // ISO datetime
  createdBy: string // userId
  createdAt: string
  updatedAt?: string
}

export interface ExamParticipation {
  id: string
  userId: string
  examId: string
  totalScore: number
  submittedAt?: string
  createdAt: string
  updatedAt?: string
}

export interface ExamSubmission {
  id: string
  userId: string
  examId: string
  user?: User // User details for display
  solutions: ChallengeSolution[]
  totalScore: number
  startedAt: string
  submittedAt: string
  duration: number // actual time spent in minutes
}

export interface ChallengeSolution {
  challengeId: string
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

export interface CreateExamPayload {
  title: string
  password: string
  duration: number
  challengeIds: string[]
  startDate: string
  endDate: string
}

export interface UpdateExamPayload {
  title?: string
  password?: string
  duration?: number
  challengeIds?: string[]
  startDate?: string
  endDate?: string
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
  isLoading: boolean
  error: string | null
  statistics: ExamStatistics | null
}

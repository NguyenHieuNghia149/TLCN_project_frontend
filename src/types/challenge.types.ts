import type {
  FunctionSignature,
  StarterCodeByLanguage,
} from '@/types/functionSignature.types'

export interface Challenge {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  createdAt?: string
  updatedAt?: string
  totalPoints?: number
  isSolved?: boolean
  isFavorite?: boolean
  obtainedPoints?: number
}

export interface TestCase {
  id: string
  inputJson: Record<string, unknown>
  outputJson: unknown
  displayInput: string
  displayOutput: string
  isPublic: boolean
  point: number
  createdAt: string
  updatedAt: string
}

export interface SolutionApproach {
  id: string
  title: string
  description: string
  sourceCode: string
  language: string
  timeComplexity: string
  spaceComplexity: string
  explanation: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface Solution {
  id: string
  title: string
  description: string
  videoUrl: string
  imageUrl: string
  isVisible: boolean
  solutionApproaches: SolutionApproach[]
  createdAt: string
  updatedAt: string
}

export interface Problem {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  constraint: string
  tags: string[]
  topic?: string
  topicId?: string
  topicName?: string
  lessonId?: string
  lessonName?: string
  orderIndex?: number
  totalPoints: number
  isSolved?: boolean
  isFavorite?: boolean
  functionSignature?: FunctionSignature | null
  starterCodeByLanguage?: StarterCodeByLanguage | null
  createdAt?: string
  updatedAt?: string
}

export interface ProblemDetailResponse {
  success: boolean
  data: {
    problem: Problem
    testcases: TestCase[]
    solution: Solution
  }
}

export interface Cursor {
  createdAt: string
  id: string
}

export interface PaginatedResponse<T> {
  items: T[]
  nextCursor: Cursor | null
  rank?: number
  rankingPoint?: number
}

export interface ChallengeItem {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  createdAt: string
  totalPoints: number
  isSolved: boolean
  isFavorite: boolean
  topicName?: string
  visibility: string
}

export type { FunctionSignature, StarterCodeByLanguage }

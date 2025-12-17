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
  input: string
  output: string
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
  lessonId?: string
  topicId?: string
  totalPoints: number
  isSolved?: boolean
  isFavorite?: boolean
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

// For challenge listing service - cursor-based pagination
export interface Cursor {
  createdAt: string
  id: string
}

export interface PaginatedResponse<T> {
  items: T[]
  nextCursor: Cursor | null
  // Optional metadata returned by some endpoints (e.g., user's rank for this topic)
  rank?: number
  rankingPoint?: number
}

export interface ChallengeItem {
  id: string
  title: string
  description: string | null
  difficulty: string
  createdAt: string
  totalPoints: number
  isSolved: boolean
  isFavorite: boolean
  topicName?: string
  visibility: string
}

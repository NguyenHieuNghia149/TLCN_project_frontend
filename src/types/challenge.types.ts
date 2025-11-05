export interface Challenge {
  id: string
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  topic: string
  createdAt: string
  updatedAt?: string
  totalPoints?: number

  /** Trạng thái người dùng */
  isSolve: boolean
  isFavorite: boolean
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
  lessonId: string
  topicId: string
  totalPoints: number
  createdAt: string
  updatedAt: string
}

export interface ProblemDetailResponse {
  success: boolean
  data: {
    problem: Problem
    testcases: TestCase[]
    solution: Solution
  }
}

// For challenge listing service
export interface PaginatedResponse<T> {
  items: T[]
  nextCursor: string | null
}

export interface ChallengeItem {
  id: string
  title: string
}
